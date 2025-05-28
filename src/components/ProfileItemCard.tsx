type Props = {
  id: string;
  title: string;
  highestBid: number;
  bidsCount: number;
  images: string[];
  district: string;
  sold?: boolean;
  onDelete: (id: string) => void;
  onMarkSold?: (id: string) => void;
};

const ProfileItemCard = ({
  id,
  title,
  highestBid,
  bidsCount,
  images,
  district,
  sold,
  onDelete,
  onMarkSold,
}: Props) => (
  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded shadow relative">
    <img src={images[0]} alt={title} className="w-20 h-16 rounded object-cover" />
    <div className="flex-1">
      <div className="font-bold flex items-center gap-2">
        {title}
        {sold && (
          <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded font-semibold">
            SOLD
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500">{district}</div>
      <div className="text-xs">Bids: {bidsCount} | Highest: Rs. {highestBid}</div>
    </div>
    {/* ACTION BUTTONS */}
    <div className="flex flex-col gap-2 items-end">
      {!sold && onMarkSold && (
        <button
          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-xs font-semibold shadow"
          onClick={() => onMarkSold(id)}
        >
          Mark as Sold
        </button>
      )}
      <button
        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-semibold shadow"
        onClick={() => onDelete(id)}
      >
        Delete
      </button>
    </div>
  </div>
);

export default ProfileItemCard;
