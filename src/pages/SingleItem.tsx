import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";

type BidType = {
  amount: number;
  description: string;
  userId: string;
  userName: string;
  contact: string;
};

type BidWithPhone = BidType & { phone?: string };

// Helper to extract Firestore ID from /item/:slugAndId
const extractIdFromSlug = (slugAndId: string | undefined) => {
  if (!slugAndId) return undefined;
  const idx = slugAndId.lastIndexOf('-');
  if (idx === -1) return slugAndId;
  return slugAndId.slice(idx + 1);
};

const SingleItem = () => {
  const { slugAndId } = useParams();
  const id = extractIdFromSlug(slugAndId);

  const [item, setItem] = useState<any>(null);
  const [bids, setBids] = useState<BidWithPhone[]>([]);
  const [amount, setAmount] = useState<number | "">("");
  const [bidDesc, setBidDesc] = useState("");
  const [myUid, setMyUid] = useState("");
  const [myContact, setMyContact] = useState("");
  const [enlargeImg, setEnlargeImg] = useState<string | null>(null);

  // Fetch item
  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      const docSnap = await getDoc(doc(db, "items", id));
      if (docSnap.exists()) setItem({ id: docSnap.id, ...docSnap.data() });
    };
    fetchItem();
  }, [id]);

  // Fetch bids and their phone numbers
  useEffect(() => {
    if (!id) return;
    const fetchBids = async () => {
      const q = query(collection(db, "items", id, "bids"), orderBy("amount", "desc"));
      const snap = await getDocs(q);
      let loadedBids: BidWithPhone[] = snap.docs.map(doc => ({ ...doc.data() })) as BidWithPhone[];

      // For each bid, if user is owner, try to load phone number from users collection
      if (item?.ownerId === myUid && loadedBids.length > 0) {
        const userIds = Array.from(new Set(loadedBids.map(b => b.userId)));
        const usersMap: Record<string, string | undefined> = {};
        for (let uid of userIds) {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            usersMap[uid] = userDoc.data()?.phone || undefined;
          }
        }
        loadedBids = loadedBids.map(bid => ({
          ...bid,
          phone: usersMap[bid.userId]
        }));
      }

      setBids(loadedBids);
    };
    fetchBids();
    // eslint-disable-next-line
  }, [id, item?.ownerId, myUid]);

  // User state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setMyUid(user?.uid || "");
      setMyContact(user?.email || "");
    });
    return () => unsub();
  }, []);

  // Place bid
  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUid) return alert("Please login to bid");
    if (!amount || !bidDesc) return alert("Enter bid amount and description");

    if (item?.sold) {
      alert("This item is sold. You can't place a bid.");
      return;
    }

    // Fetch phone from user doc if exists
    let phone = "";
    const userDoc = await getDoc(doc(db, "users", myUid));
    if (userDoc.exists()) {
      phone = userDoc.data()?.phone || "";
    }

    // Add bid
    const bid = {
      amount: Number(amount),
      description: bidDesc,
      userId: myUid,
      userName: auth.currentUser?.displayName || "",
      contact: myContact,
      phone,
    };
    await addDoc(collection(db, "items", id!, "bids"), bid);
    await updateDoc(doc(db, "items", id!), {
      highestBid: Number(amount) > (item?.highestBid || 0) ? Number(amount) : item?.highestBid,
      bidsCount: increment(1),
    });
    setAmount("");
    setBidDesc("");
    // reload bids
    const q = query(collection(db, "items", id!, "bids"), orderBy("amount", "desc"));
    const snap = await getDocs(q);
    setBids(snap.docs.map(doc => ({ ...doc.data() })) as BidWithPhone[]);
  };

  // Get SEO alt text for each image
  const getAltText = (idx: number) => {
    if (item?.imageAlts && Array.isArray(item.imageAlts) && item.imageAlts[idx]) {
      return item.imageAlts[idx];
    }
    return item.title || "Gold Item";
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-yellow-600 text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  const isOwner = item.ownerId === myUid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
      <Header />

      {/* Image enlarge modal */}
      {enlargeImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn" onClick={() => setEnlargeImg(null)}>
          <img
            src={enlargeImg}
            alt="enlarged gold item"
            className="max-h-[85vh] max-w-[95vw] rounded-3xl shadow-2xl border-4 border-yellow-200 cursor-pointer"
            onClick={e => e.stopPropagation()}
          />
          <button className="absolute top-4 right-6 text-white text-3xl font-bold" onClick={() => setEnlargeImg(null)}>
            ×
          </button>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-3 py-10">
        {/* Gallery + Info */}
        <div className="bg-white/90 rounded-3xl shadow-xl border border-yellow-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image gallery */}
            <div className="md:w-2/5 flex flex-col items-center gap-3">
              <img
                src={item.images[0]}
                alt={getAltText(0)}
                className="w-full max-h-64 object-cover rounded-2xl border-2 border-yellow-100 shadow cursor-pointer transition hover:scale-105"
                onClick={() => setEnlargeImg(item.images[0])}
              />
              <div className="flex gap-2 flex-wrap justify-center">
                {item.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={getAltText(idx)}
                    className={`h-14 w-14 object-cover rounded-lg border-2 cursor-pointer transition hover:scale-110
                      ${img === item.images[0] ? "border-yellow-400 shadow" : "border-yellow-100"}
                    `}
                    onClick={() => setEnlargeImg(img)}
                  />
                ))}
              </div>
            </div>
            {/* Item info */}
            <div className="md:w-3/5 flex flex-col gap-3">
              <h2 className="text-3xl font-black text-yellow-700 mb-2">
                {item.title}
                {item.sold && (
                  <span className="ml-3 px-3 py-1 bg-green-500 text-white text-sm rounded-full font-bold align-middle">
                    SOLD
                  </span>
                )}
              </h2>
              <div className="text-gray-700 text-base mb-2">{item.description}</div>
              <div className="flex gap-4 flex-wrap text-sm font-semibold text-gray-600 mb-3">
                <span className="bg-yellow-50 px-3 py-1 rounded-xl">
                  Weight: <span className="font-bold text-yellow-700">{item.weight}g</span>
                </span>
                <span className="bg-yellow-50 px-3 py-1 rounded-xl">
                  Karat: <span className="font-bold text-yellow-700">{item.karat}</span>
                </span>
                <span className="bg-yellow-50 px-3 py-1 rounded-xl">
                  District: <span className="font-bold text-yellow-700">{item.district}</span>
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-lg font-extrabold text-yellow-600 bg-yellow-100 px-4 py-2 rounded-2xl">Highest Bid: Rs. {item.highestBid}</div>
                <div className="text-sm text-gray-500">Total Bids: <span className="font-bold">{item.bidsCount}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bids Section */}
        <div className="bg-white/90 rounded-3xl shadow-lg border border-yellow-100 p-6 mb-10">
          <h3 className="font-bold text-xl text-yellow-700 mb-4">Bids</h3>
          <div className="space-y-4 mb-6">
            {bids.length === 0 && <div className="text-gray-400">No bids yet.</div>}
            {bids.map((bid, idx) => (
              <div key={idx} className="p-4 bg-yellow-50 rounded-2xl shadow flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-yellow-800 text-lg">Rs. {bid.amount}</span>
                  <span className="text-xs text-gray-600">{bid.userName}</span>
                </div>
                <div className="text-gray-700 text-sm mb-1">{bid.description}</div>
                {isOwner && (
                  <div className="text-blue-600 text-xs mt-1">
                    Contact: {bid.contact}
                    {bid.phone && (
                      <span className="block text-blue-500 mt-0.5">Phone: {bid.phone}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Bidding Form or Sold Notice */}
          {item.sold ? (
            <div className="bg-green-100 text-green-700 text-center font-bold py-4 rounded-xl text-lg border border-green-200 shadow">
              Bidding is closed. This item is <span className="text-green-800">SOLD</span>!
            </div>
          ) : myUid && !isOwner && (
            <form onSubmit={handleBid} className="flex flex-col gap-3 bg-yellow-50 p-5 rounded-2xl shadow">
              <div className="font-bold text-gray-700 mb-1">Place a Bid</div>
              <input
                type="number" min={1}
                className="border border-yellow-200 rounded-xl px-4 py-3 bg-yellow-50 focus:ring-2 focus:ring-yellow-400 outline-none text-base"
                placeholder="Your Bid (LKR)"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                required
              />
              <input
                className="border border-yellow-200 rounded-xl px-4 py-3 bg-yellow-50 focus:ring-2 focus:ring-yellow-400 outline-none text-base"
                placeholder="Bid Description"
                value={bidDesc}
                onChange={e => setBidDesc(e.target.value)}
                required
              />
              <button
                className="w-full py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
                type="submit"
              >
                Place Bid
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default SingleItem;
