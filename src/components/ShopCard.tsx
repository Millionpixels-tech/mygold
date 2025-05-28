import { Link } from "react-router-dom";

type ShopCardProps = {
  id: string;
  name: string;
  logo?: string;
  description: string;
  district: string;
  rating?: number;
  ratingCount?: number;
  onClick?: () => void; // for programmatic navigation if needed
};

const DESCRIPTION_LINES = 2;

// Helper to create SEO-friendly shop slugs
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

// Inline star display (SVG, 5 stars)
const StarRating = ({ value = 0, size = 18 }: { value?: number; size?: number }) => (
  <span className="inline-flex items-center">
    {[1, 2, 3, 4, 5].map(i => (
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill={i <= Math.round(value) ? "#FBBF24" : "#E5E7EB"}
        className="inline"
        style={{ marginRight: 1, verticalAlign: "middle" }}
      >
        <polygon points="10,2 12.5,7.5 18,8 13.5,12 14.7,18 10,15 5.3,18 6.5,12 2,8 7.5,7.5" />
      </svg>
    ))}
  </span>
);

const ShopCard = ({
  id,
  name,
  logo,
  description,
  district,
  rating = 0,
  ratingCount = 0,
  onClick,
}: ShopCardProps) => {
  const shopSlug = slugifyShop(name, id);

  // If you want to use programmatic navigation, use the onClick prop; otherwise use <Link>
  return (
    <Link
      to={`/shop/${shopSlug}`}
      className="
        flex flex-col sm:flex-row items-center
        bg-white/90 rounded-3xl shadow-md hover:shadow-xl
        transition-all duration-200 border border-yellow-50 hover:border-yellow-300
        group cursor-pointer relative overflow-hidden h-full px-5 py-4
      "
      style={{
        boxShadow: "0 2px 12px 0 rgba(240, 180, 30, 0.08), 0 1.5px 8px 0 rgba(0,0,0,0.03)",
        minHeight: 120,
      }}
      onClick={onClick}
    >
      {/* Logo Left */}
      <div className="flex-shrink-0 w-20 h-20 mr-0 sm:mr-5 mb-4 sm:mb-0 flex items-center justify-center">
        <img
          src={logo || "/shop-logo-placeholder.svg"}
          alt={name ? `${name} logo` : "Shop logo"}
          className="w-20 h-20 object-cover rounded-full border-4 border-yellow-300 shadow bg-yellow-50"
        />
      </div>
      {/* Title + Location Right */}
      <div className="flex flex-1 flex-col justify-center w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-1 gap-1">
          <span className="font-bold text-lg text-yellow-700 truncate">{name || "Untitled Shop"}</span>
          <span className="inline-block text-xs bg-yellow-50 text-yellow-700 px-3 py-0.5 rounded-lg font-medium shadow-sm border border-yellow-200 sm:ml-2 w-max">
            {district}
          </span>
        </div>
        {/* RATING */}
        <div className="flex items-center gap-2 mb-1">
          <StarRating value={rating} size={16} />
          <span className="text-yellow-700 font-semibold text-sm ml-1">
            {ratingCount > 0 ? `${rating.toFixed(1)}/5` : "No ratings"}
          </span>
          {ratingCount > 0 && (
            <span className="text-gray-400 text-xs">({ratingCount})</span>
          )}
        </div>
        {/* Description Full Width */}
        <div
          className="text-gray-500 text-sm mt-1 w-full"
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
      </div>
      {/* Soft glow hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-gradient-to-br from-yellow-200 to-white rounded-3xl transition-all duration-300" />
    </Link>
  );
};

export default ShopCard;
