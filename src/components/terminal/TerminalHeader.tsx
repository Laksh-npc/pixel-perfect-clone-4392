import { useState, useEffect, memo } from "react";
import { Search, Moon, Sun, Settings, Camera, Layout, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";

interface TerminalHeaderProps {
  symbol: string;
  stockDetails: any;
}

const TerminalHeader = memo(({ symbol, stockDetails }: TerminalHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
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
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Left - Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-base font-semibold text-foreground">Groww Terminal</span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for Stocks, F&O, Indices etc."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm bg-muted/50 border-border focus:bg-background"
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
                    <span className="text-xs font-medium text-muted-foreground">{getIndexDisplay(idx.index)}:</span>
                    <span className="text-xs font-semibold text-foreground">{formatIndexValue(idx.last || 0)}</span>
                    <span
                      className={`text-xs font-medium ${isPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                    >
                      {isPositive ? "+" : ""}
                      {(idx.variation || 0).toFixed(2)} ({isPositive ? "+" : ""}
                      {(idx.percentChange || 0).toFixed(2)}%)
                    </span>
                  </div>
                );
              })}
              <button className="text-xs text-primary hover:underline flex items-center gap-1">
                All indices
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Loading indices...
            </div>
          )}

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:bg-muted"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Camera className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Layout className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
});

TerminalHeader.displayName = "TerminalHeader";

export default TerminalHeader;
