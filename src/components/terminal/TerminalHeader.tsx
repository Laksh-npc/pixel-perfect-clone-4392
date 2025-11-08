import { useState, useEffect } from "react";
import { Search, Moon, Settings, Camera, Layout, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";

interface TerminalHeaderProps {
  symbol: string;
  stockDetails: any;
}

const TerminalHeader = ({ symbol, stockDetails }: TerminalHeaderProps) => {
  // Handle case where stockDetails might be null
  if (!stockDetails) {
    stockDetails = {
      info: { companyName: symbol, symbol: symbol },
      priceInfo: { lastPrice: 0, change: 0, pChange: 0 }
    };
  }
  const [indices, setIndices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setLoading(true);
        const data = await api.getIndices();
        // Filter for NIFTY, SENSEX, BANKNIFTY
        const majorIndices = data.filter(
          (idx: any) =>
            idx.index === "NIFTY 50" ||
            idx.index === "NIFTY" ||
            idx.index === "SENSEX" ||
            idx.index === "BANK NIFTY" ||
            idx.index === "BANKNIFTY"
        );
        setIndices(majorIndices);
      } catch (err) {
        console.error("Error fetching indices:", err);
        // Don't set loading to false on error, keep trying
        setIndices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIndices();
    // Refresh indices every 5 seconds
    const interval = setInterval(fetchIndices, 5000);
    return () => clearInterval(interval);
  }, []);

  const getIndexDisplay = (indexName: string) => {
    if (indexName.includes("NIFTY") && !indexName.includes("BANK")) return "NIFTY";
    if (indexName.includes("BANK")) return "BANKNIFTY";
    return indexName;
  };

  const formatIndexValue = (value: number) => {
    return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Left - Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-base font-semibold text-gray-900">Groww Terminal</span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search for Stocks, F&O, Indices etc."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Right - Indices and Actions */}
        <div className="flex items-center gap-4">
          {/* Indices */}
          {loading ? (
            <div className="flex gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          ) : indices.length > 0 ? (
            <div className="flex items-center gap-4">
              {indices.slice(0, 3).map((idx: any, i: number) => {
                const isPositive = (idx.variation || 0) >= 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{getIndexDisplay(idx.index)}:</span>
                    <span className="text-xs font-semibold text-gray-900">{formatIndexValue(idx.last || 0)}</span>
                    <span
                      className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                    >
                      {isPositive ? "+" : ""}
                      {(idx.variation || 0).toFixed(2)} ({isPositive ? "+" : ""}
                      {(idx.percentChange || 0).toFixed(2)}%)
                    </span>
                  </div>
                );
              })}
              <button className="text-xs text-primary hover:underline flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 rotate-180" />
                All indices
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              Loading indices...
            </div>
          )}

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100">
            <Moon className="w-4 h-4" />
          </Button>

          {/* Buy/Sell Buttons */}
          <div className="flex items-center gap-2">
            <Button className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white font-bold text-sm">
              B
            </Button>
            <Button className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white font-bold text-sm">
              S
            </Button>
          </div>

          {/* Settings and Actions */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100">
            <Camera className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100">
            <Layout className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TerminalHeader;

