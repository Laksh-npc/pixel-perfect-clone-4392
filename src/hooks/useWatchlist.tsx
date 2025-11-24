import { useState, useEffect, useCallback } from "react";

export interface WatchlistStock {
  symbol: string;
  companyName: string;
  price?: number;
  change?: number;
  percentChange?: number;
  volume?: number;
  high52W?: number;
  low52W?: number;
  current52WPosition?: number; // Position in 52W range (0-1)
}

const STORAGE_KEY = "groww_watchlist";
const DEFAULT_WATCHLIST_NAME = "Aditya's Watchlist";

export const useWatchlist = () => {
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [watchlistName, setWatchlistName] = useState<string>(DEFAULT_WATCHLIST_NAME);
  const [loading, setLoading] = useState(true);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.stocks && Array.isArray(parsed.stocks)) {
          setWatchlistStocks(parsed.stocks);
        }
        if (parsed.name) {
          setWatchlistName(parsed.name);
        }
      }
    } catch (error) {
      console.error("Error loading watchlist:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            stocks: watchlistStocks,
            name: watchlistName,
          })
        );
      } catch (error) {
        console.error("Error saving watchlist:", error);
      }
    }
  }, [watchlistStocks, watchlistName, loading]);

  const addToWatchlist = useCallback((stock: WatchlistStock) => {
    setWatchlistStocks((prev) => {
      // Check if stock already exists
      if (prev.some((s) => s.symbol === stock.symbol)) {
        return prev;
      }
      return [...prev, stock];
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlistStocks((prev) => prev.filter((s) => s.symbol !== symbol));
  }, []);

  const isInWatchlist = useCallback(
    (symbol: string) => {
      return watchlistStocks.some((s) => s.symbol === symbol);
    },
    [watchlistStocks]
  );

  const updateWatchlistName = useCallback((name: string) => {
    setWatchlistName(name);
  }, []);

  return {
    watchlistStocks,
    watchlistName,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    updateWatchlistName,
  };
};


