import { Link } from "react-router-dom";

type GoldCardProps = {
  id: string;
  title: string;
  image: string;
  description: string;
  highestBid: number;
  bidsCount: number;
  district: string;
  karat: number;
  weight: number;
};

const DESCRIPTION_LINES = 2;

// Helper to create SEO-friendly URL slugs
function slugify(title: string, id: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
    + "-" + id
  );
}

const GoldCard = ({
  id,
  title,
  image,
  description,
  highestBid,
  bidsCount,
  district,
  karat,
  weight,
}: GoldCardProps) => (
  <Link
    to={`/item/${slugify(title, id)}`}
    className="flex flex-col bg-white/90 rounded-3xl shadow-md hover:shadow-xl transition-all duration-200 border border-yellow-50 hover:border-yellow-300 group cursor-pointer relative overflow-hidden h-full"
    style={{
      boxShadow:
        "0 2px 12px 0 rgba(240, 180, 30, 0.10), 0 1.5px 8px 0 rgba(0,0,0,0.03)",
    }}
  >
    <div className="h-44 w-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-yellow-100 to-white flex items-center justify-center">
      {image ? (
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-300"
        />
      ) : (
        <div className="text-yellow-200 text-6xl">🪙</div>
      )}
    </div>
    <div className="px-4 py-4 flex flex-col gap-1 flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-lg truncate">{title}</span>
        <span className="inline-block text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-lg font-medium shadow-sm border border-yellow-200">{district}</span>
      </div>
      <div className="flex items-center gap-3 mb-1">
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="mr-1">
            <circle cx="12" cy="12" r="10" stroke="#F59E42" strokeWidth="2" fill="#FFD700" />
            <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#444" fontWeight="bold">{karat}</text>
          </svg>
          {karat}K
        </span>
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="mr-1">
            <path d="M6 20V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13" stroke="#6B7280" strokeWidth="2" />
            <rect x="8" y="11" width="8" height="7" rx="1" fill="#A7F3D0" />
          </svg>
          {weight}g
        </span>
      </div>
      {/* FIXED SIZE, ELLIPSIS, 2 LINES */}
      <div
        className="text-gray-500 text-sm mb-1 overflow-hidden"
        style={{
          minHeight: `${DESCRIPTION_LINES * 1.25}em`,
          maxHeight: `${DESCRIPTION_LINES * 1.25}em`,
          display: "-webkit-box",
          WebkitLineClamp: DESCRIPTION_LINES,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {description}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-xs">
            <svg width={14} height={14} className="inline" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            {bidsCount} {bidsCount === 1 ? "bid" : "bids"}
          </span>
        </div>
        <span className="text-base font-bold text-yellow-700 tracking-tight bg-yellow-50 px-2 py-0.5 rounded-xl">
          Rs. {highestBid}
        </span>
      </div>
    </div>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-gradient-to-br from-yellow-200 to-white rounded-3xl transition-all duration-300" />
  </Link>
);

export default GoldCard;
