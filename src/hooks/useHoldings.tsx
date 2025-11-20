import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";

export interface Holding {
  symbol: string;
  companyName: string;
  shares: number;
  avgPrice: number;
  investedAmount: number;
  currentPrice?: number;
  currentValue?: number;
  change?: number;
  changePercent?: number;
  oneDayChange?: number;
  oneDayChangePercent?: number;
  returns?: number;
  returnsPercent?: number;
}

const STORAGE_KEY = "groww_holdings";

export const useHoldings = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  // Load holdings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHoldings(parsed);
      }
    } catch (error) {
      console.error("Error loading holdings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save holdings to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
      } catch (error) {
        console.error("Error saving holdings:", error);
      }
    }
  }, [holdings, loading]);

  // Fetch current prices for all holdings
  const updateHoldingsPrices = useCallback(async () => {
    if (holdings.length === 0) return;

    try {
      const updatedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const details = await api.getStockDetails(holding.symbol);
            if (!details) return holding;

            const priceInfo = details.priceInfo || {};
            const currentPrice = priceInfo.lastPrice || 0;
            const change = priceInfo.change || 0;
            const changePercent = priceInfo.pChange || 0;
            const currentValue = currentPrice * holding.shares;
            const returns = currentValue - holding.investedAmount;
            const returnsPercent = holding.investedAmount > 0 
              ? (returns / holding.investedAmount) * 100 
              : 0;
            // One day change is the price change * number of shares
            const oneDayChange = change * holding.shares;
            // One day change percent is the same as the stock's daily change percent
            const oneDayChangePercent = changePercent;

            return {
              ...holding,
              currentPrice,
              currentValue,
              change,
              changePercent,
              oneDayChange,
              oneDayChangePercent,
              returns,
              returnsPercent,
            };
          } catch (error) {
            return holding;
          }
        })
      );

      setHoldings(updatedHoldings);
    } catch (error) {
      console.error("Error updating holdings prices:", error);
    }
  }, [holdings.length]);

  // Update prices periodically
  useEffect(() => {
    if (holdings.length > 0 && !loading) {
      updateHoldingsPrices();
      const interval = setInterval(updateHoldingsPrices, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [holdings.length, loading, updateHoldingsPrices]);

  // Add a new holding (buy)
  const addHolding = useCallback((holding: Omit<Holding, "currentPrice" | "currentValue" | "change" | "changePercent" | "returns" | "returnsPercent" | "oneDayChange" | "oneDayChangePercent">) => {
    setHoldings((prev) => {
      const existing = prev.find((h) => h.symbol === holding.symbol);
      if (existing) {
        // Update existing holding
        const totalShares = existing.shares + holding.shares;
        const totalInvested = existing.investedAmount + holding.investedAmount;
        const newAvgPrice = totalInvested / totalShares;
        
        return prev.map((h) =>
          h.symbol === holding.symbol
            ? {
                ...h,
                shares: totalShares,
                investedAmount: totalInvested,
                avgPrice: newAvgPrice,
              }
            : h
        );
      } else {
        // Add new holding
        return [...prev, holding];
      }
    });
  }, []);

  // Remove or reduce a holding (sell)
  const removeHolding = useCallback((symbol: string, shares: number) => {
    setHoldings((prev) => {
      const holding = prev.find((h) => h.symbol === symbol);
      if (!holding) return prev;

      if (holding.shares <= shares) {
        // Remove completely
        return prev.filter((h) => h.symbol !== symbol);
      } else {
        // Reduce shares proportionally
        const ratio = shares / holding.shares;
        return prev.map((h) =>
          h.symbol === symbol
            ? {
                ...h,
                shares: h.shares - shares,
                investedAmount: h.investedAmount * (1 - ratio),
                avgPrice: h.avgPrice, // Keep same avg price
              }
            : h
        );
      }
    });
  }, []);

  // Calculate portfolio summary
  const getPortfolioSummary = useCallback(() => {
    const currentValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const investedAmount = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
    const totalReturns = currentValue - investedAmount;
    const totalReturnsPercent = investedAmount > 0 ? (totalReturns / investedAmount) * 100 : 0;
    const oneDayReturns = holdings.reduce((sum, h) => sum + (h.oneDayChange || 0), 0);
    const oneDayReturnsPercent = currentValue > 0 ? (oneDayReturns / currentValue) * 100 : 0;

    return {
      currentValue,
      investedAmount,
      totalReturns,
      totalReturnsPercent,
      oneDayReturns,
      oneDayReturnsPercent,
    };
  }, [holdings]);

  return {
    holdings,
    loading,
    addHolding,
    removeHolding,
    updateHoldingsPrices,
    getPortfolioSummary,
  };
};

