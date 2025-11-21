import { useState, useEffect, useRef } from "react";
import { Search, RotateCcw, TrendingUp } from "lucide-react";
import { Input } from "./ui/input";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  symbol: string;
  companyName: string;
  type: "stock" | "fno" | "mutual-fund" | "etf";
}

const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "stocks" | "fno" | "mutual-funds" | "etf" | "faqs">("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<Array<{ symbol: string; companyName: string }>>([]);
  const [popularStocks, setPopularStocks] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle both old format (string[]) and new format (object[])
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'string') {
            // Old format - convert to new format
            setRecentSearches([]);
          } else {
            setRecentSearches(parsed);
          }
        }
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Load popular stocks
  useEffect(() => {
    const loadPopularStocks = async () => {
      // Popular stocks from screenshot
      const popularSymbols = [
        { symbol: "BILLIONBRAINS", name: "Billionbrains Garage Ventures Ltd." },
        { symbol: "PHYSICSWALLAH", name: "Physicswallah Ltd." },
        { symbol: "TENNECO", name: "Tenneco Clean Air India Ltd." },
        { symbol: "JAIPRAKPOW", name: "Jaiprakash Power Ventures Ltd." }
      ];
      
      const results: SearchResult[] = [];
      
      for (const stock of popularSymbols) {
        try {
          const details = await api.getStockDetails(stock.symbol);
          if (details?.info?.companyName) {
            results.push({
              symbol: stock.symbol,
              companyName: details.info.companyName,
              type: "stock"
            });
          } else {
            results.push({
              symbol: stock.symbol,
              companyName: stock.name,
              type: "stock"
            });
          }
        } catch (e) {
          // Use fallback name if API fails
          results.push({
            symbol: stock.symbol,
            companyName: stock.name,
            type: "stock"
          });
        }
      }
      
      setPopularStocks(results);
    };
    
    if (open) {
      loadPopularStocks();
    }
  }, [open]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        // Use the search API function
        const results = await api.searchStocks(searchQuery, 20);
        setSearchResults(results as SearchResult[]);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [
      { symbol: result.symbol, companyName: result.companyName },
      ...recentSearches.filter(s => s.symbol !== result.symbol)
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    
    // Navigate to stock detail
    navigate(`/stock/${result.symbol}`);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleRecentSearchClick = (item: { symbol: string; companyName: string }) => {
    navigate(`/stock/${item.symbol}`);
    onOpenChange(false);
    setSearchQuery("");
  };

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle Esc key to close modal
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  const filters = [
    { id: "all" as const, label: "All" },
    { id: "stocks" as const, label: "Stocks" },
    { id: "fno" as const, label: "F&O" },
    { id: "mutual-funds" as const, label: "Mutual Funds" },
    { id: "etf" as const, label: "ETF" },
    { id: "faqs" as const, label: "FAQs" },
  ];

  const displayResults = activeFilter === "all" 
    ? searchResults 
    : searchResults.filter(r => {
        if (activeFilter === "stocks") return r.type === "stock";
        if (activeFilter === "fno") return r.type === "fno";
        if (activeFilter === "mutual-funds") return r.type === "mutual-fund";
        if (activeFilter === "etf") return r.type === "etf";
        return false;
      });

  const handleBackdropClick = () => {
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* Backdrop with very light blur and subtle tint - clickable */}
      <div 
        className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px]"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none"
      >
        <div 
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl pointer-events-auto"
          onClick={(e) => {
            // Prevent closing when clicking inside modal
            e.stopPropagation();
          }}
        >
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search Groww..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base flex-1"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-0 px-4 border-b">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeFilter === filter.id
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {filter.label}
              {activeFilter === filter.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto">
          {!searchQuery ? (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="px-4 py-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleRecentSearchClick(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-md text-left transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item.companyName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular on Groww */}
              {popularStocks.length > 0 && (
                <div className="px-4 py-3 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 px-3">Popular on Groww</h3>
                  {popularStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleResultClick(stock)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-md text-left transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{stock.companyName}</div>
                        <div className="text-xs text-gray-500">{stock.symbol}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Search Results */}
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">Searching...</div>
              ) : displayResults.length > 0 ? (
                <div className="px-4 py-2">
                  {displayResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-md text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {result.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{result.companyName}</div>
                        <div className="text-xs text-gray-500">{result.symbol}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;

