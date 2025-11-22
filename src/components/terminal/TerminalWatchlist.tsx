import { useState, useEffect, memo } from "react";
import { X, Plus, Search, Edit2, Wallet, FileText, Layers, Eye, DollarSign, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const TerminalWatchlist = memo(() => {
  const [isOpen, setIsOpen] = useState(true);
  const [watchlistName, setWatchlistName] = useState("Aditya's Watchlist");
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("watchlist");
  const navigate = useNavigate();

  // Default watchlist symbols - matching the screenshot
  const defaultSymbols = ["IDEA", "TATASTEEL", "IOC", "SBIN", "CANBK", "ZOMATO"];

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
      <div className="w-8 bg-muted/30 border-l border-border flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-8 w-8 text-muted-foreground hover:bg-muted"
        >
          <FileText className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-background border-l border-border flex flex-col h-full">
        {/* Watchlist Header */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">:: Watchlist</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 text-muted-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Watchlist Content */}
        {activeSection === "watchlist" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{watchlistName}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Q Search & add"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs bg-muted/50 border-border"
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
                        className="p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{stock.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            ₹{stock.price.toFixed(2)}
                          </span>
                          <span className={`text-xs font-medium ${isPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
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
            <p className="text-sm text-muted-foreground">{sections.find((s) => s.id === activeSection)?.label}</p>
          </div>
        )}
      </div>

      {/* Right Side Toolbar - Separate from watchlist */}
      <div className="w-8 bg-muted/30 border-l border-border flex flex-col items-center py-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant="ghost"
              size="icon"
              onClick={() => setActiveSection(section.id)}
              className={`h-8 w-8 mb-1 ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={section.label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:bg-muted"
          title="Layout"
        >
          <Layout className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
});

TerminalWatchlist.displayName = "TerminalWatchlist";

export default TerminalWatchlist;
