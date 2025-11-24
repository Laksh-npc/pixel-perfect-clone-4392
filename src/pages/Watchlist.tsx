import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit2, X } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

// Generate improved mini line graph data points - matching Groww's sparklines
const generateLineGraph = (changePct: number, isPositive: boolean) => {
  const points = 15;
  const data = [];
  const magnitude = Math.min(Math.abs(changePct) / 5, 1); // Scale based on change %
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 100;
    // Create smoother trend line with natural variation
    const progress = i / (points - 1);
    const baseY = 20;
    const variation = Math.sin(progress * Math.PI) * 2; // Subtle wave
    const trend = isPositive 
      ? baseY - (progress * 10 * magnitude) - variation
      : baseY + (progress * 10 * magnitude) + variation;
    data.push({ x, y: Math.max(3, Math.min(27, trend)) });
  }
  return data;
};

const Watchlist = () => {
  const { watchlistStocks, watchlistName, removeFromWatchlist } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [stocksData, setStocksData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Fetch data for all watchlist stocks
  useEffect(() => {
    const fetchWatchlistData = async () => {
      if (watchlistStocks.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const stocks = await Promise.all(
          watchlistStocks.map(async (stock) => {
            try {
              // Fetch both stock details and trade info for volume data
              const [details, tradeInfo] = await Promise.all([
                api.getStockDetails(stock.symbol),
                api.getStockTradeInfo(stock.symbol).catch(() => null), // Trade info might not always be available
              ]);
              
              const priceInfo = details?.priceInfo || {};
              const info = details?.info || {};
              const tradeInfoData = tradeInfo?.tradeInfo || tradeInfo || {};
              
              const isPositive = (priceInfo.pChange || 0) >= 0;
              const percentChange = priceInfo.pChange || 0;
              
              // Generate improved sparkline data
              const lineData = generateLineGraph(percentChange, isPositive);

              // Calculate 52W position
              const high52W = priceInfo.high52W || priceInfo.lastPrice || 0;
              const low52W = priceInfo.low52W || priceInfo.lastPrice || 0;
              const currentPrice = priceInfo.lastPrice || 0;
              const range52W = high52W - low52W;
              const current52WPosition = range52W > 0 
                ? (currentPrice - low52W) / range52W 
                : 0.5;

              // Get volume - try multiple sources like MostBoughtStocks does
              const totalVolume = tradeInfoData?.totalTradedVolume || priceInfo.totalTradedVolume || priceInfo.tradedQuantity || 0;

              return {
                symbol: stock.symbol,
                companyName: info.companyName || stock.companyName,
                price: priceInfo.lastPrice || 0,
                change: priceInfo.change || 0,
                percentChange,
                volume: totalVolume,
                high52W,
                low52W,
                current52WPosition,
                lineData,
                isPositive,
              };
            } catch (err) {
              console.error(`Error fetching data for ${stock.symbol}:`, err);
              return null;
            }
          })
        );

        setStocksData(stocks.filter(Boolean));
      } catch (err) {
        console.error("Error fetching watchlist data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlistData();

    // Refresh data every 2 minutes (120000 milliseconds)
    const interval = setInterval(fetchWatchlistData, 120000);
    return () => clearInterval(interval);
  }, [watchlistStocks]);

  // Filter stocks based on search
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocksData;
    const query = searchQuery.toLowerCase();
    return stocksData.filter(
      (stock) =>
        stock.companyName.toLowerCase().includes(query) ||
        stock.symbol.toLowerCase().includes(query)
    );
  }, [stocksData, searchQuery]);

  // Get company logo/initials
  const getCompanyLogo = (name: string) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length >= 2) {
      return words[0].charAt(0) + words[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format volume - matching Groww format (Indian numbering)
  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(2)}Cr`;
    }
    if (volume >= 100000) {
      return `${(volume / 100000).toFixed(2)}L`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toLocaleString("en-IN");
  };

  // Format volume with commas (for display)
  const formatVolumeWithCommas = (volume: number) => {
    return volume.toLocaleString("en-IN");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Header />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header Section - Matching Groww exactly */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{watchlistName}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Watchlist
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-sm border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={() => {
                  // TODO: Implement add stocks functionality
                  console.log("Add stocks");
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add stocks
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-sm border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search your watchlist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Table Section - Matching Groww's clean design */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Company ({filteredStocks.length})
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Trend
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Mkt price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    1D change
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    1D vol
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    52W perf
                  </th>
                  {isEditing && (
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
                            <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-700" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-gray-700" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-2 w-32 bg-gray-200 dark:bg-gray-700" />
                      </td>
                    </tr>
                  ))
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={isEditing ? 7 : 6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? "No stocks found" : "No stocks in watchlist"}
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {getCompanyLogo(stock.companyName)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {stock.companyName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {/* Improved Mini Graph - SVG based like Groww */}
                        <div className="w-20 h-8 flex-shrink-0 relative">
                          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id={`gradient-${stock.symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={stock.isPositive ? "#22C55E" : "#EF4444"} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={stock.isPositive ? "#22C55E" : "#EF4444"} stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            {/* Gradient fill area */}
                            <polyline
                              points={`0,30 ${stock.lineData.map(d => `${d.x},${30 - d.y}`).join(" ")} 100,30`}
                              fill={`url(#gradient-${stock.symbol})`}
                              stroke="none"
                            />
                            {/* Main trend line */}
                            <polyline
                              points={stock.lineData.map(d => `${d.x},${30 - d.y}`).join(" ")}
                              fill="none"
                              stroke={stock.isPositive ? "#22C55E" : "#EF4444"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ₹{stock.price.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-sm font-medium ${
                            stock.isPositive
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {stock.isPositive ? "+" : ""}
                          ₹{Math.abs(stock.change).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ({stock.isPositive ? "+" : ""}
                          {stock.percentChange.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatVolumeWithCommas(stock.volume)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative max-w-[120px]">
                            <div
                              className="absolute h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                              style={{ width: `${stock.current52WPosition * 100}%` }}
                            />
                            <div
                              className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2 border border-white dark:border-gray-800"
                              style={{ left: `${stock.current52WPosition * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <span className="text-red-600 dark:text-red-400">L</span>{" "}
                            {stock.low52W.toFixed(2)} |{" "}
                            <span className="text-green-600 dark:text-green-400">H</span>{" "}
                            {stock.high52W.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      {isEditing && (
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromWatchlist(stock.symbol)}
                            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Watchlist;

