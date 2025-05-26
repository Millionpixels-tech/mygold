import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import GoldCard from "../components/GoldCard";
import { districts } from "../utils/districts";
import Header from "../components/Header";

type ItemType = {
  id: string;
  title: string;
  description: string;
  images: string[];
  highestBid: number;
  bidsCount: number;
  district: string;
  karat: number;
  weight: number;
};

const PAGE_SIZE = 10;

const Home = () => {
  const [items, setItems] = useState<ItemType[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  // Fetch item counts for each district
  useEffect(() => {
    (async () => {
      const counts: Record<string, number> = {};
      // Use one query to get all items, then count by district (Firestore doesn't support group-by)
      const snap = await getDocs(collection(db, "items"));
      snap.docs.forEach(doc => {
        const data = doc.data() as any;
        if (data.district) {
          counts[data.district] = (counts[data.district] || 0) + 1;
        }
      });
      // Also store "All" count
      counts[""] = snap.docs.length;
      setDistrictCounts(counts);
    })();
  }, [items.length]); // Refresh on item list change

  // Infinite scroll observer
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchItems = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        let q;
        if (selectedDistrict) {
          if (lastDoc && !reset) {
            q = query(
              collection(db, "items"),
              where("district", "==", selectedDistrict),
              orderBy("createdAt", "desc"),
              startAfter(lastDoc),
              limit(PAGE_SIZE)
            );
          } else {
            q = query(
              collection(db, "items"),
              where("district", "==", selectedDistrict),
              orderBy("createdAt", "desc"),
              limit(PAGE_SIZE)
            );
          }
        } else {
          if (lastDoc && !reset) {
            q = query(
              collection(db, "items"),
              orderBy("createdAt", "desc"),
              startAfter(lastDoc),
              limit(PAGE_SIZE)
            );
          } else {
            q = query(
              collection(db, "items"),
              orderBy("createdAt", "desc"),
              limit(PAGE_SIZE)
            );
          }
        }
        const snapshot = await getDocs(q);
        const newItems: ItemType[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ItemType[];

        setItems(prev =>
          reset ? newItems : [...prev, ...newItems]
        );

        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } catch (err) {
        setHasMore(false);
      }
      setLoading(false);
    },
    [selectedDistrict, lastDoc, loading]
  );

  useEffect(() => {
    setItems([]);
    setLastDoc(null);
    setHasMore(true);
    fetchItems(true);
    // eslint-disable-next-line
  }, [selectedDistrict]);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          fetchItems(false);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchItems]
  );

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      {/* Modern gold radial glow background */}
      <div aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(circle at 70% 10%, #fffbe6 0%, #ffecb3 30%, #fef6e1 60%, #fff0c2 100%)",
          opacity: 0.7,
          width: "100vw",
          height: "100vh"
        }}
      />

      {/* Decorative SVG pattern */}
      <svg
        aria-hidden
        className="fixed top-[-80px] right-[-80px] w-[350px] h-[350px] z-0 opacity-40 select-none pointer-events-none"
        width="350"
        height="350"
        viewBox="0 0 350 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="175" cy="175" r="165" stroke="#FDE68A" strokeWidth="6" />
        <circle cx="175" cy="175" r="120" stroke="#FDE68A" strokeWidth="2" />
        <circle cx="175" cy="175" r="90" stroke="#FDE68A" strokeWidth="1" />
      </svg>

      <div className="relative z-10">
        <Header />

        <main className="max-w-7xl mx-auto py-12 px-2 flex flex-col md:flex-row gap-8">
          {/* Left: Locations */}
          <aside className="w-full md:w-60 md:sticky md:top-24 z-20">
            <div className="bg-white/80 border border-yellow-100 rounded-2xl shadow p-4 mb-8 flex md:flex-col flex-row gap-2 md:gap-3 overflow-x-auto">
              <button
                className={`px-3 py-2 text-sm rounded-lg font-bold transition border 
                  ${selectedDistrict === "" ? "bg-yellow-500 text-white border-yellow-400 shadow" : "bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100"}
                `}
                onClick={() => setSelectedDistrict("")}
              >
                All ({districtCounts[""] || 0})
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  className={`px-3 py-2 text-sm rounded-lg font-bold transition border whitespace-nowrap
                    ${selectedDistrict === d ? "bg-yellow-500 text-white border-yellow-400 shadow" : "bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100"}
                  `}
                  onClick={() => setSelectedDistrict(d)}
                >
                  {d} ({districtCounts[d] || 0})
                </button>
              ))}
            </div>
          </aside>

          {/* Right: Items */}
          <section className="flex-1">
            {/* Modern Header + Description */}
            <div className="bg-white/90 rounded-2xl shadow-md border border-yellow-100 px-6 py-7 mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-black text-yellow-700 tracking-tight mb-2">Explore Gold Auctions</h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto font-medium">
                Discover, bid, and buy gold items posted by users across Sri Lanka.<br/>
                Filter by district or browse the entire collection. Join the bidding or list your own!
              </p>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  ref={i === items.length - 1 && hasMore ? lastItemRef : undefined}
                >
                  <GoldCard
                    id={item.id}
                    title={item.title}
                    image={item.images[0]}
                    description={item.description}
                    highestBid={item.highestBid}
                    bidsCount={item.bidsCount}
                    district={item.district}
                    karat={item.karat}
                    weight={item.weight}
                  />
                </div>
              ))}
            </div>

            {/* Loading / Empty states */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-yellow-600 text-xl font-semibold animate-pulse">
                <svg width={56} height={56} fill="none" viewBox="0 0 48 48" className="mb-2">
                  <circle cx="24" cy="24" r="22" fill="#FFD700" stroke="#F59E42" strokeWidth="3"/>
                  <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#fff">G</text>
                </svg>
                Loading items...
              </div>
            )}
            {!hasMore && !loading && items.length > 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-lg">
                <span className="mb-2">No more items.</span>
              </div>
            )}
            {items.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xl">
                <svg width={56} height={56} fill="none" viewBox="0 0 48 48" className="mb-2">
                  <circle cx="24" cy="24" r="22" fill="#fff7c5" stroke="#F59E42" strokeWidth="3"/>
                  <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#FFD700">G</text>
                </svg>
                No items found for this filter.
              </div>
            )}
          </section>
        </main>

        {/* Floating Add Item Button (only for logged-in users) */}
        {/* {user && (
          <button
            className="
              fixed bottom-7 right-7 z-50
              flex items-center gap-2
              bg-gradient-to-br from-yellow-400 to-yellow-500
              hover:from-yellow-500 hover:to-yellow-400
              text-white text-lg font-bold shadow-xl rounded-full
              px-6 py-3
              transition-all
              active:scale-95
            "
            onClick={() => navigate("/add")}
            aria-label="Add Gold Item"
          >
            <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity={0.1}/>
              <path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline">Add Item</span>
          </button>
        )} */}
      </div>
    </div>
  );
};

export default Home;
