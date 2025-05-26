type Props = {
    id: string;
    title: string;
    highestBid: number;
    bidsCount: number;
    images: string[];
    district: string;
    onDelete: (id: string) => void;
  };
  
  const ProfileItemCard = ({ id, title, highestBid, bidsCount, images, district, onDelete }: Props) => (
    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded shadow">
      <img src={images[0]} alt={title} className="w-20 h-16 rounded object-cover" />
      <div className="flex-1">
        <div className="font-bold">{title}</div>
        <div className="text-xs text-gray-500">{district}</div>
        <div className="text-xs">Bids: {bidsCount} | Highest: Rs. {highestBid}</div>
      </div>
      <button className="bg-red-500 text-white rounded px-2 py-1 text-xs"
        onClick={() => onDelete(id)}>Delete</button>
    </div>
  );
  
  export default ProfileItemCard;
  