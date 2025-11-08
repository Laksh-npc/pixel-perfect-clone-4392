import { useState, useEffect } from "react";
import { X, Plus, Search, Edit2, Wallet, FileText, Layers, Eye, DollarSign, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const TerminalWatchlist = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [watchlistName, setWatchlistName] = useState("Aditya's Watchlist");
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("watchlist");
  const navigate = useNavigate();

  // Default watchlist symbols
  const defaultSymbols = ["TATASTEEL", "IOC", "SBIN", "CANBK", "ZOMATO"];

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setLoading(true);
        // Fetch data for watchlist stocks
        const stocks = await Promise.all(
          defaultSymbols.map(async (symbol) => {
            try {
              const details = await api.getStockDetails(symbol);
              return {
                symbol,
                name: details?.info?.companyName || symbol,
                price: details?.priceInfo?.lastPrice || 0,
                change: details?.priceInfo?.change || 0,
                percentChange: details?.priceInfo?.pChange || 0,
              };
            } catch (err) {
              return null;
            }
          })
        );

        setWatchlistStocks(stocks.filter(Boolean));
      } catch (err) {
        console.error("Error fetching watchlist:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();

    // Refresh watchlist every 5 seconds
    const interval = setInterval(fetchWatchlist, 5000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    { id: "watchlist", icon: FileText, label: "Watchlist" },
    { id: "positions", icon: Wallet, label: "Positions" },
    { id: "orders", icon: FileText, label: "Orders" },
    { id: "chain", icon: Layers, label: "Chain" },
    { id: "depth", icon: Eye, label: "Depth" },
    { id: "holdings", icon: Wallet, label: "Holdings" },
    { id: "balance", icon: DollarSign, label: "Balance" },
  ];

  if (!isOpen) {
    return (
      <div className="w-8 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-8 w-8 text-gray-600 hover:bg-gray-200"
        >
          <FileText className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Watchlist Header */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">:: Watchlist</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 text-gray-600 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Watchlist Content */}
      {activeSection === "watchlist" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">{watchlistName}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Q Search & add"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {watchlistStocks.map((stock, index) => {
                  const isPositive = stock.percentChange >= 0;
                  return (
                    <div
                      key={index}
                      onClick={() => navigate(`/terminal/${stock.symbol}`)}
                      className="p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{stock.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{stock.price.toFixed(2)}
                        </span>
                        <span className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}
                          {stock.change.toFixed(2)} ({isPositive ? "+" : ""}
                          {stock.percentChange.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Sections Placeholder */}
      {activeSection !== "watchlist" && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">{sections.find((s) => s.id === activeSection)?.label}</p>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="border-t border-gray-200 p-2">
        <div className="flex flex-col gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className={`h-8 w-full justify-start text-xs ${
                  activeSection === section.id
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3 h-3 mr-2" />
                {section.label}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-xs text-gray-600 hover:bg-gray-100 mt-auto"
          >
            <Layout className="w-3 h-3 mr-2" />
            Layout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TerminalWatchlist;

