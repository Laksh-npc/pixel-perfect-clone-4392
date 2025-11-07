import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StockCardProps {
  logo: string;
  name: string;
  price: string;
  change: string;
  percent: string;
  positive: boolean;
  showBookmark?: boolean;
  symbol?: string; // Add symbol prop for navigation
}

const StockCard = ({ logo, name, price, change, percent, positive, showBookmark, symbol }: StockCardProps) => {
  const navigate = useNavigate();

  // Extract symbol from name if not provided (simple heuristic)
  const getSymbol = () => {
    if (symbol) return symbol;
    // Try to extract symbol from name (e.g., "Vodafone Idea" -> "VI")
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleClick = () => {
    if (symbol) {
      navigate(`/stock/${symbol}`);
    }
  };

  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-card relative"
      onClick={handleClick}
    >
      {showBookmark && (
        <button 
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
          onClick={(e) => {
            e.stopPropagation();
            // Handle bookmark action
          }}
        >
          <Bookmark className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center font-bold text-lg">
          {logo}
        </div>
      </div>
      <div className="text-sm font-medium mb-2">{name}</div>
      <div className="text-lg font-semibold mb-1">{price}</div>
      <div className={`text-sm ${positive ? 'text-success' : 'text-destructive'}`}>
        {change} {percent}
      </div>
    </div>
  );
};

export default StockCard;
