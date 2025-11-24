import { useState, useEffect } from "react";
import { X, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useNavigate } from "react-router-dom";

interface WatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol?: string;
  companyName?: string;
}

const WatchlistDialog = ({ open, onOpenChange, symbol, companyName }: WatchlistDialogProps) => {
  const { watchlistStocks, watchlistName, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Add current stock to watchlist if provided and not already in watchlist
  useEffect(() => {
    if (open && symbol && companyName && !isInWatchlist(symbol)) {
      addToWatchlist({
        symbol,
        companyName,
      });
    }
  }, [open, symbol, companyName, isInWatchlist, addToWatchlist]);

  const handleAddToWatchlist = () => {
    if (symbol && companyName) {
      addToWatchlist({
        symbol,
        companyName,
      });
    }
  };

  const handleRemoveFromWatchlist = (stockSymbol: string) => {
    removeFromWatchlist(stockSymbol);
  };

  const handleViewWatchlist = () => {
    onOpenChange(false);
    navigate("/watchlist");
  };

  const filteredStocks = watchlistStocks.filter((stock) =>
    stock.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Stock to</DialogTitle>
          <DialogDescription className="sr-only">
            Add stock to your watchlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Watchlist Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{watchlistName}</span>
              <span className="text-xs text-muted-foreground">
                ({watchlistStocks.length} {watchlistStocks.length === 1 ? "item" : "items"})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewWatchlist}
              className="h-8 px-3 text-xs text-primary hover:text-primary/90"
            >
              View Watchlist
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your watchlist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Stock List */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredStocks.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery ? "No stocks found" : "No stocks in watchlist"}
              </div>
            ) : (
              filteredStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {stock.companyName
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {stock.companyName}
                      </div>
                      <div className="text-xs text-muted-foreground">{stock.symbol}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFromWatchlist(stock.symbol)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Create New Watchlist Button */}
          <Button
            variant="outline"
            className="w-full h-9 text-sm"
            onClick={() => {
              // For now, just show a message - can be extended later
              console.log("Create new watchlist");
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Watchlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchlistDialog;

