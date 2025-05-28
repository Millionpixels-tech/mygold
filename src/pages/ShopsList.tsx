import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { db } from "../firebase/firebase";
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
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import ShopCard from "../components/ShopCard";
import { districts } from "../utils/districts";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const districtsLC = districts.map(d => d.toLowerCase());

function slugifyShop(name: string, id: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
    + "-" + id
  );
}

type ShopType = {
  id: string;
  shopName: string;
  description: string;
  coverUrl: string;
  logoUrl: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  facebook?: string;
  whatsapp?: string;
  district: string; // stored as lowercase
  location: {
    lat: number;
    lng: number;
  };
  ownerId: string;
  ownerName: string;
  createdAt: any;
  updatedAt?: any;
};

const PAGE_SIZE = 10;
const SRI_LANKA_CENTER = [7.8731, 80.7718];

function MapAutoCenter({ shops }: { shops: ShopType[] }) {
  const map = useMap();
  useEffect(() => {
    if (!shops.length) return;
    const bounds = L.latLngBounds(
      shops.map(shop => [shop.location.lat, shop.location.lng])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [shops, map]);
  return null;
}

// Helper for star rating
const StarRating = ({ value, size = 18 }: { value: number; size?: number }) => (
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

const ShopsPage = () => {
  const [shops, setShops] = useState<ShopType[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({});
  const [allShops, setAllShops] = useState<ShopType[]>([]);
  const [shopRatings, setShopRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const navigate = useNavigate();

  // Fetch all shops for counts/map (not paginated)
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "shops"));
      const allShopsRaw: ShopType[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ShopType[];
      const allShops = allShopsRaw.map(shop => ({
        ...shop,
        district: (shop.district || "").toLowerCase(),
      }));
      // Counts
      const counts: Record<string, number> = {};
      allShops.forEach(shop => {
        const d = shop.district || "";
        counts[d] = (counts[d] || 0) + 1;
      });
      counts[""] = allShops.length; // "All"
      setDistrictCounts(counts);
      setAllShops(allShops);
    })();
  }, []);

  // Fetch shop ratings (average + count) for all visible shops
  useEffect(() => {
    if (!allShops.length) return;
    // Only get for visible shops (for performance, 30 at most)
    const shopsToFetch = allShops.filter(
      s => selectedDistrict === "" || s.district === selectedDistrict
    );
    const fetchAllRatings = async () => {
      const ratings: Record<string, { avg: number; count: number }> = {};
      for (const shop of shopsToFetch) {
        const reviewsSnap = await getDocs(collection(db, "shops", shop.id, "reviews"));
        const reviews = reviewsSnap.docs.map(d => d.data() as any);
        if (reviews.length) {
          const avg =
            reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length;
          ratings[shop.id] = { avg, count: reviews.length };
        } else {
          ratings[shop.id] = { avg: 0, count: 0 };
        }
      }
      setShopRatings(ratings);
    };
    fetchAllRatings();
    // eslint-disable-next-line
  }, [allShops, selectedDistrict]);

  // Pagination for cards (filtered)
  const observer = useRef<IntersectionObserver | null>(null);
  const fetchShops = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        let q;
        if (selectedDistrict) {
          q = query(
            collection(db, "shops"),
            where("district", "==", selectedDistrict),
            orderBy("createdAt", "desc"),
            ...(reset ? [] : lastDoc ? [startAfter(lastDoc)] : []),
            limit(PAGE_SIZE)
          );
        } else {
          q = query(
            collection(db, "shops"),
            orderBy("createdAt", "desc"),
            ...(reset ? [] : lastDoc ? [startAfter(lastDoc)] : []),
            limit(PAGE_SIZE)
          );
        }
        const snapshot = await getDocs(q);
        const newShops: ShopType[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          district: ((doc.data() as any).district || "").toLowerCase(),
        })) as ShopType[];
        setShops(prev => (reset ? newShops : [...prev, ...newShops]));
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
    setShops([]);
    setLastDoc(null);
    setHasMore(true);
    fetchShops(true);
    // eslint-disable-next-line
  }, [selectedDistrict]);

  const lastShopRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          fetchShops(false);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchShops]
  );

  // Map markers: only show for this district (not paginated)
  const shopsForMap = useMemo(
    () =>
      allShops.filter(
        s =>
          s.location &&
          typeof s.location.lat === "number" &&
          typeof s.location.lng === "number" &&
          (selectedDistrict === "" || s.district === selectedDistrict)
      ),
    [allShops, selectedDistrict]
  );

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
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
              {districtsLC.map((d, idx) => (
                <button
                  key={d}
                  className={`px-3 py-2 text-sm rounded-lg font-bold transition border whitespace-nowrap
                    ${selectedDistrict === d ? "bg-yellow-500 text-white border-yellow-400 shadow" : "bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100"}
                  `}
                  onClick={() => setSelectedDistrict(d)}
                >
                  {districts[idx]} ({districtCounts[d] || 0})
                </button>
              ))}
            </div>
          </aside>

          {/* Right: Map + Shops */}
          <section className="flex-1">
            {/* Map Section */}
            <div className="w-full h-[350px] mb-8 rounded-2xl overflow-hidden shadow-lg border border-yellow-100 bg-white flex z-0 relative">
              <MapContainer
                // @ts-ignore
                center={shopsForMap.length > 0 ? [shopsForMap[0].location.lat, shopsForMap[0].location.lng] : SRI_LANKA_CENTER}
                zoom={8}
                scrollWheelZoom
                style={{ height: 350, width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {shopsForMap.map(shop => {
                  const rating = shopRatings[shop.id];
                  const shopSlug = slugifyShop(shop.shopName, shop.id);
                  return (
                    <Marker key={shop.id} position={[shop.location.lat, shop.location.lng]}>
                      <Popup>
                        <div className="flex flex-col items-start gap-1">
                          <a
                            href={`/shop/${shopSlug}`}
                            onClick={e => {
                              e.preventDefault();
                              navigate(`/shop/${shopSlug}`);
                            }}
                            className="font-bold text-yellow-700 underline hover:text-yellow-600 transition"
                            style={{ fontSize: 16, cursor: "pointer" }}
                          >
                            {shop.shopName}
                          </a>
                          <div style={{ fontSize: 13, color: "#444" }}>{shop.address}</div>
                          <div className="mt-1 text-yellow-700 font-bold">
                            {rating && rating.count > 0
                              ? `${rating.avg.toFixed(1)} / 5 ⭐ (${rating.count})`
                              : "No ratings yet"}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                <MapAutoCenter shops={shopsForMap} />
              </MapContainer>
            </div>

            {/* Shops List */}
            <div className="grid grid-cols-1 gap-6">
              {shops.map((shop, i) => {
                const rating = shopRatings[shop.id];
                const shopSlug = slugifyShop(shop.shopName, shop.id);
                return (
                  <div
                    key={shop.id}
                    ref={i === shops.length - 1 && hasMore ? lastShopRef : undefined}
                  >
                    <ShopCard
                      id={shop.id}
                      name={shop.shopName}
                      logo={shop.logoUrl}
                      description={shop.description}
                      district={shop.district}
                      rating={rating?.avg || 0}
                      ratingCount={rating?.count || 0}
                      onClick={() => navigate(`/shop/${shopSlug}`)}
                    />
                  </div>
                );
              })}
            </div>
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-yellow-600 text-xl font-semibold animate-pulse">
                Loading shops...
              </div>
            )}
            {!hasMore && !loading && shops.length > 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-lg">
                <span className="mb-2">No more shops.</span>
              </div>
            )}
            {shops.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xl">
                No shops found for this filter.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ShopsPage;
