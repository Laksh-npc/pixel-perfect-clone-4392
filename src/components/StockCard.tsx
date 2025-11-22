import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (symbol) {
      navigate(`/stock/${symbol}`);
    }
  };

  // Extract initials for logo
  const getLogoInitials = () => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-card relative group"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Bookmark Icon - Only shows on hover */}
      {isHovered && (
        <button 
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            // Handle bookmark action
          }}
        >
          <Bookmark className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}

      {/* Logo - Changes to circular with black background on hover */}
      <div className="mb-3">
        {isHovered ? (
          <div className="w-12 h-12 rounded-full bg-black border-2 border-white flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {getLogoInitials()}
            </span>
          </div>
        ) : (
          <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center font-bold text-lg">
            {logo}
          </div>
        )}
      </div>

      {/* Company Name - Underlined on hover */}
      <div className={cn(
        "text-sm font-medium mb-2 transition-all",
        isHovered ? "underline text-gray-700 dark:text-gray-300" : ""
      )}>
        {name}
      </div>

      {/* Current Price */}
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {price}
      </div>

      {/* Price Change */}
      <div className={cn("text-sm font-medium", positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
        {change} {percent}
      </div>
    </div>
  );
};

export default StockCard;
