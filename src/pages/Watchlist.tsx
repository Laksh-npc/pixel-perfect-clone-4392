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
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Generate simple sparkline data
const generateSparklineData = (currentPrice: number, percentChange: number) => {
  const data = [];
  const basePrice = currentPrice / (1 + percentChange / 100);
  const steps = 20;
  
  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    // Create a trend line
    const price = basePrice + (currentPrice - basePrice) * progress;
    data.push({ value: price });
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
              const details = await api.getStockDetails(stock.symbol);
              const priceInfo = details?.priceInfo || {};
              const info = details?.info || {};
              
              // Generate sparkline data (last 20 data points)
              const sparklineData = generateSparklineData(
                priceInfo.lastPrice || 0,
                priceInfo.pChange || 0
              );

              // Calculate 52W position
              const high52W = priceInfo.high52W || priceInfo.lastPrice || 0;
              const low52W = priceInfo.low52W || priceInfo.lastPrice || 0;
              const currentPrice = priceInfo.lastPrice || 0;
              const range52W = high52W - low52W;
              const current52WPosition = range52W > 0 
                ? (currentPrice - low52W) / range52W 
                : 0.5;

              return {
                symbol: stock.symbol,
                companyName: info.companyName || stock.companyName,
                price: priceInfo.lastPrice || 0,
                change: priceInfo.change || 0,
                percentChange: priceInfo.pChange || 0,
                volume: priceInfo.totalTradedVolume || 0,
                high52W,
                low52W,
                current52WPosition,
                sparklineData,
                isPositive: (priceInfo.pChange || 0) >= 0,
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

    // Refresh data every 5 seconds
    const interval = setInterval(fetchWatchlistData, 5000);
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

  // Format volume
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{watchlistName}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Watchlist
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-sm"
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
                className="h-9 px-4 text-sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your watchlist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Company ({filteredStocks.length})
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Trend
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Mkt price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    1D change
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    1D vol
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    52W perf
                  </th>
                  {isEditing && (
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-md" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-2 w-32" />
                      </td>
                    </tr>
                  ))
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={isEditing ? 7 : 6} className="py-12 text-center text-muted-foreground">
                      {searchQuery ? "No stocks found" : "No stocks in watchlist"}
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => (
                    <tr
                      key={stock.symbol}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {getCompanyLogo(stock.companyName)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {stock.companyName}
                            </div>
                            <div className="text-xs text-muted-foreground">{stock.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-16 h-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stock.sparklineData}>
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={stock.isPositive ? "#22C55E" : "#EF4444"}
                                strokeWidth={1.5}
                                dot={false}
                                isAnimationActive={false}
                              />
                              <Tooltip content={() => null} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-foreground">
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
                        <span className="text-sm text-foreground">
                          {formatVolume(stock.volume)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full relative max-w-[120px]">
                            <div
                              className="absolute h-2 bg-foreground rounded-full"
                              style={{ width: `${stock.current52WPosition * 100}%` }}
                            />
                            <div
                              className="absolute w-2 h-2 bg-foreground rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2"
                              style={{ left: `${stock.current52WPosition * 100}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

