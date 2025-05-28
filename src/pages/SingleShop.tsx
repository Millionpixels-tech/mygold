import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import {
  doc, getDoc, collection, query, orderBy, getDocs, addDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import Header from "../components/Header";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Helmet } from "react-helmet";
import "leaflet/dist/leaflet.css";

// Helper: Extract Firestore shop ID from slug (e.g. shop-name-123456)
const extractIdFromSlug = (slugAndId: string | undefined) => {
  if (!slugAndId) return undefined;
  const idx = slugAndId.lastIndexOf("-");
  if (idx === -1) return slugAndId;
  return slugAndId.slice(idx + 1);
};

// Star rating SVG
const StarRating = ({ value, size = 22 }: { value: number, size?: number }) => (
  <span>
    {[1, 2, 3, 4, 5].map(i => (
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill={i <= value ? "#FBBF24" : "#E5E7EB"}
        style={{ display: "inline", verticalAlign: "middle" }}
      >
        <polygon points="10,2 12.5,7.5 18,8 13.5,12 14.7,18 10,15 5.3,18 6.5,12 2,8 7.5,7.5" />
      </svg>
    ))}
  </span>
);

// Inline icons for contact
const ICONS = {
  phone: (
    <svg width={18} height={18} fill="none" stroke="#fbbf24" strokeWidth={2} viewBox="0 0 24 24" className="inline mr-1">
      <path d="M22 16.92V21a2 2 0 0 1-2.18 2A19.88 19.88 0 0 1 3 5.18 2 2 0 0 1 5 3h4.09a1 1 0 0 1 1 .75l1.2 4.73a1 1 0 0 1-.29 1l-2.2 2.2a16 16 0 0 0 6.9 6.9l2.2-2.2a1 1 0 0 1 1-.29l4.73 1.2a1 1 0 0 1 .75 1z"/>
    </svg>
  ),
  email: (
    <svg width={18} height={18} fill="none" stroke="#60a5fa" strokeWidth={2} viewBox="0 0 24 24" className="inline mr-1">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6 12 13 2 6"/>
    </svg>
  ),
  facebook: (
    <svg width={18} height={18} fill="#3b82f6" viewBox="0 0 24 24" className="inline mr-1">
      <path d="M22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 5.014 3.676 9.157 8.438 9.877V15.89h-2.54v-2.374h2.54v-1.8c0-2.506 1.493-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.631.772-1.631 1.562v1.474h2.773l-.443 2.374h-2.33v5.987C18.324 21.157 22 17.014 22 12z"/>
    </svg>
  ),
  whatsapp: (
    <svg width={18} height={18} fill="#22c55e" viewBox="0 0 24 24" className="inline mr-1">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.14 1.61 5.92l-1.6 5.85 6.02-1.57A11.92 11.92 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22a9.87 9.87 0 0 1-5.2-1.44l-.36-.22-3.57.93.95-3.48-.23-.36A9.87 9.87 0 0 1 2 12c0-5.51 4.49-10 10-10s10 4.49 10 10-4.49 10-10 10zm5.16-7.59c-.28-.14-1.62-.8-1.87-.9-.25-.1-.43-.14-.6.14-.17.28-.68.9-.84 1.09-.15.18-.31.21-.59.07-.28-.14-1.18-.43-2.24-1.37-.83-.74-1.39-1.66-1.56-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.34.41-.51.13-.18.17-.32.25-.53.08-.2.04-.39-.02-.53-.06-.14-.6-1.45-.82-1.98-.21-.51-.43-.44-.59-.45-.15-.01-.32-.01-.49-.01s-.46.07-.7.34C5.6 8.75 5.6 10.2 6.2 11.38c.6 1.18 2.34 3.37 5.31 4.53.74.32 1.31.51 1.76.65.74.24 1.42.21 1.95.13.6-.09 1.62-.66 1.84-1.3.23-.64.23-1.18.16-1.3-.06-.12-.24-.19-.51-.33z"/>
    </svg>
  )
};

export default function SingleShop() {
  const { slugAndId } = useParams<{ slugAndId: string }>();
  const shopId = extractIdFromSlug(slugAndId);

  const [shop, setShop] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any>(null);
  const [ratingInput, setRatingInput] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [replyInputs, setReplyInputs] = useState<{ [rid: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const user = auth.currentUser;

  // Load shop
  useEffect(() => {
    (async () => {
      if (!shopId) return;
      const shopSnap = await getDoc(doc(db, "shops", shopId));
      if (shopSnap.exists()) setShop(shopSnap.data());
    })();
  }, [shopId]);

  // Load reviews
  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const q = query(
        collection(db, "shops", shopId, "reviews"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const reviewsArr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(reviewsArr);
      if (user) {
        setMyReview(reviewsArr.find((r: any) => r.userId === user.uid) || null);
      }
    })();
  }, [shopId, user]);

  // Inputs for edit if user has already reviewed
  useEffect(() => {
    if (myReview) {
      setRatingInput(myReview.rating);
      setCommentInput(myReview.comment || "");
    }
  }, [myReview]);

  // Add or edit review
  const handleReviewSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      if (myReview) {
        // Update existing
        await updateDoc(doc(db, "shops", shopId!, "reviews", myReview.id), {
          rating: ratingInput,
          comment: commentInput,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add new
        await addDoc(collection(db, "shops", shopId!, "reviews"), {
          userId: user.uid,
          userName: user.displayName || user.email || "User",
          rating: ratingInput,
          comment: commentInput,
          createdAt: serverTimestamp(),
        });
      }
      // Refresh reviews after submit
      const q = query(collection(db, "shops", shopId!, "reviews"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const reviewsArr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(reviewsArr);
      setMyReview(reviewsArr.find((r: any) => r.userId === user.uid) || null);
    } finally {
      setSubmitting(false);
    }
  };

  // Owner replies to a review
  const handleReply = async (reviewId: string) => {
    if (!shopId) return;
    await updateDoc(doc(db, "shops", shopId, "reviews", reviewId), {
      reply: replyInputs[reviewId],
      repliedAt: serverTimestamp(),
    });
    setReplyInputs(inputs => ({ ...inputs, [reviewId]: "" }));
    // Re-fetch reviews
    const q = query(collection(db, "shops", shopId, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Share handler
  const handleShare = async () => {
    if (!shop) return;
    const url = window.location.href;
    const shareData = {
      title: shop.shopName,
      text: shop.description?.slice(0, 100) || "Check out this gold shop on Gold Auctions!",
      url
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      // fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied!");
        setTimeout(() => setShareMsg(""), 1500);
      } catch {
        setShareMsg("Failed to copy link.");
        setTimeout(() => setShareMsg(""), 1500);
      }
    }
  };

  // Stats for rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
      : 0;
  const ratingCount = reviews.length;

  if (!shop) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    </div>
  );

  const isOwner = user && shop.ownerId === user.uid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      <Helmet>
        <title>{shop.shopName} | Gold Shops in Sri Lanka</title>
        <meta name="description" content={shop.description ? shop.description.slice(0, 140) : "Gold shop"} />
        <meta property="og:title" content={shop.shopName} />
        <meta property="og:description" content={shop.description ? shop.description.slice(0, 140) : "Gold shop"} />
        <meta property="og:url" content={window.location.href} />
        {shop.coverUrl && <meta property="og:image" content={shop.coverUrl} />}
      </Helmet>
      <Header />
      <main className="max-w-4xl mx-auto py-8 px-3">
        <div className="relative rounded-3xl shadow-xl border border-yellow-100 bg-white/90">
          {shop.coverUrl && (
            <img src={shop.coverUrl} alt="cover" className="w-full h-48 md:h-64 object-cover rounded-t-3xl" />
          )}
          {/* SHARE BUTTON */}
          <button
            onClick={handleShare}
            title="Share shop"
            className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 rounded-full shadow border border-yellow-200 text-yellow-700 font-semibold text-sm"
            style={{ boxShadow: "0 1px 8px 0 rgba(240, 180, 30, 0.06)" }}
          >
            <svg width={18} height={18} fill="none" stroke="#eab308" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#eab308" strokeWidth="2" fill="#fef3c7" />
              <path d="M7 12v0a5 5 0 0 0 10 0v0" stroke="#eab308" strokeWidth="2" />
              <path d="M12 16v-7m0 0-3.5 3.5M12 9l3.5 3.5" stroke="#eab308" strokeWidth="2" />
            </svg>
            Share This Shop
            {shareMsg && <span className="ml-2 text-green-600 text-xs">{shareMsg}</span>}
          </button>
          <div className="flex flex-col md:flex-row items-center gap-6 p-7">
            <img src={shop.logoUrl} alt="logo"
              className="w-28 h-28 rounded-full border-4 border-yellow-300 -mt-20 bg-white object-cover shadow" />
            <div className="flex-1">
              <h1 className="text-3xl font-black text-yellow-700">{shop.shopName}</h1>
              <div className="mt-1 text-gray-600">{shop.district}</div>
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={averageRating} />
                <span className="text-yellow-700 font-bold ml-1">{averageRating.toFixed(1)} / 5</span>
                <span className="text-gray-500 text-sm">({ratingCount} ratings)</span>
              </div>
              <div className="mt-2 text-gray-700">{shop.description}</div>
              <div className="mt-2 text-gray-700">📍 {shop.address}</div>
              <div className="flex gap-4 mt-2 flex-wrap">
                {shop.contactPhone && (
                  <a href={`tel:${shop.contactPhone}`} className="text-yellow-700 font-bold underline flex items-center gap-1">
                    {ICONS.phone} {shop.contactPhone}
                  </a>
                )}
                {shop.contactEmail && (
                  <a href={`mailto:${shop.contactEmail}`} className="text-blue-700 underline flex items-center gap-1">
                    {ICONS.email} {shop.contactEmail}
                  </a>
                )}
                {shop.facebook && (
                  <a href={shop.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                    {ICONS.facebook} Facebook
                  </a>
                )}
                {shop.whatsapp && (
                  <a href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-600 underline flex items-center gap-1">
                    {ICONS.whatsapp} WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="p-7">
            <h3 className="text-xl font-bold text-yellow-700 mb-3">Location on Map</h3>
            {shop.location &&
              <MapContainer
                // @ts-ignore
                center={[shop.location.lat, shop.location.lng]}
                zoom={14}
                style={{ height: 240, width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[shop.location.lat, shop.location.lng]} />
              </MapContainer>
            }
          </div>
          {/* Reviews Section */}
          <div className="p-7 pt-2">
            <h3 className="text-xl font-bold text-yellow-700 mb-4">Reviews</h3>
            {user && (
              <form onSubmit={handleReviewSubmit} className="mb-6 bg-yellow-50 rounded-xl p-4 shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">Your Rating:</span>
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      type="button"
                      className="focus:outline-none"
                      onClick={() => setRatingInput(i)}
                    >
                      <svg width={28} height={28} viewBox="0 0 20 20"
                        fill={i <= ratingInput ? "#FBBF24" : "#E5E7EB"}>
                        <polygon points="10,2 12.5,7.5 18,8 13.5,12 14.7,18 10,15 5.3,18 6.5,12 2,8 7.5,7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full border border-yellow-200 rounded-lg p-2 min-h-[50px] mb-2"
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="Write your review (optional)"
                  maxLength={300}
                />
                <button
                  className="px-4 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow"
                  disabled={submitting || ratingInput === 0}
                  type="submit"
                >
                  {myReview ? "Update Review" : "Add Review"}
                </button>
              </form>
            )}

            {reviews.length === 0 && (
              <div className="text-gray-400">No reviews yet.</div>
            )}
            <div className="space-y-6">
              {reviews.map(r => (
                <div key={r.id} className="bg-white border border-yellow-100 rounded-xl p-4 shadow">
                  <div className="flex items-center gap-3">
                    <StarRating value={r.rating} size={20} />
                    <span className="font-semibold text-yellow-700">{r.userName}</span>
                    <span className="text-gray-400 text-xs">{r.createdAt?.toDate?.().toLocaleString?.()}</span>
                  </div>
                  {r.comment && <div className="text-gray-700 mt-2">{r.comment}</div>}
                  {r.reply && (
                    <div className="bg-yellow-50 rounded p-3 mt-3 ml-2 border-l-4 border-yellow-400 text-sm">
                      <span className="font-bold text-yellow-700">Owner Reply:</span>
                      <div>{r.reply}</div>
                    </div>
                  )}
                  {isOwner && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        className="border border-yellow-200 rounded-lg px-2 py-1 mr-2"
                        value={replyInputs[r.id] || ""}
                        onChange={e => setReplyInputs(inputs => ({ ...inputs, [r.id]: e.target.value }))}
                        maxLength={200}
                      />
                      <button
                        className="px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-600 text-white font-bold"
                        onClick={() => handleReply(r.id)}
                        disabled={!replyInputs[r.id]}
                        type="button"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
