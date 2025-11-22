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
      <div className="w-10 bg-muted/50 border-l border-border flex flex-col items-center py-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg"
          title="Watchlist"
        >
          <FileText className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-background/95 border-l border-border flex flex-col h-full">
        {/* Watchlist Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <span className="text-sm font-bold text-foreground">Watchlist</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Watchlist Content */}
        {activeSection === "watchlist" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{watchlistName}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:bg-muted hover:text-foreground rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:bg-muted hover:text-foreground rounded"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search & add"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/50 border-border focus:bg-background rounded-lg"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {watchlistStocks.map((stock, index) => {
                    const isPositive = stock.percentChange >= 0;
                    return (
                      <div
                        key={index}
                        onClick={() => navigate(`/terminal/${stock.symbol}`)}
                        className="p-3 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-semibold text-foreground">{stock.name}</div>
                            <div className="text-xs text-muted-foreground">{stock.symbol}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">
                            ₹{stock.price.toFixed(2)}
                          </span>
                          <span className={`text-xs font-semibold ${isPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
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

      {/* Right Side Toolbar - Sections selector */}
      <div className="w-12 bg-muted/50 border-l border-border flex flex-col items-center py-3 gap-1">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant="ghost"
              size="icon"
              onClick={() => setActiveSection(section.id)}
              className={`h-9 w-9 rounded-lg ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={section.label}
            >
              <Icon className="w-4.5 h-4.5" />
            </Button>
          );
        })}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg"
          title="Layout"
        >
          <Layout className="w-4.5 h-4.5" />
        </Button>
      </div>
    </>
  );
});

TerminalWatchlist.displayName = "TerminalWatchlist";

export default TerminalWatchlist;
