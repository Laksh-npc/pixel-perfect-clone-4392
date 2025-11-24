import { useEffect } from "react";
import { X, Plus, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { watchlistStocks, watchlistName, addToWatchlist, isInWatchlist } = useWatchlist();
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

  const handleSelectWatchlist = () => {
    if (symbol && companyName) {
      addToWatchlist({
        symbol,
        companyName,
      });
    }
    onOpenChange(false);
    navigate("/watchlist");
  };

  const handleCreateNewWatchlist = () => {
    if (symbol && companyName) {
      addToWatchlist({
        symbol,
        companyName,
      });
    }
    onOpenChange(false);
    // TODO: Implement create new watchlist functionality
    console.log("Create new watchlist");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">Add Stock to</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Add stock to your watchlist
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          {/* Existing Watchlist Option */}
          <button
            onClick={handleSelectWatchlist}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-green-600 dark:border-green-500 flex items-center justify-center flex-shrink-0">
              <Bookmark className="w-5 h-5 text-green-600 dark:text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{watchlistName}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {watchlistStocks.length} {watchlistStocks.length === 1 ? "item" : "items"}
            </div>
          </button>

          {/* Create New Watchlist Option */}
          <button
            onClick={handleCreateNewWatchlist}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-green-600 dark:border-green-500 flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 text-green-600 dark:text-green-500" />
            </div>
            <div className="text-sm font-medium text-green-600 dark:text-green-500">
              Create New Watchlist
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchlistDialog;

