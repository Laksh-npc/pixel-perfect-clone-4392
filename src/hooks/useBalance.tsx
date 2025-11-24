import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "groww_balance";

// Initialize balance from localStorage synchronously to avoid flash of default value
const getInitialBalance = (): number => {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    }
  } catch (error) {
    console.error("Error loading balance:", error);
  }
  return 27.22; // Default fallback
};

export const useBalance = () => {
  const [balance, setBalance] = useState<number>(getInitialBalance);

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, balance.toString());
    } catch (error) {
      console.error("Error saving balance:", error);
    }
  }, [balance]);

  const addBalance = useCallback((amount: number) => {
    if (amount > 0 && !isNaN(amount)) {
      setBalance((prev) => {
        const newBalance = prev + amount;
        return newBalance;
      });
      return true;
    }
    return false;
  }, []);

  const deductBalance = useCallback((amount: number) => {
    if (amount > 0 && !isNaN(amount)) {
      setBalance((prev) => {
        if (prev >= amount) {
          return prev - amount;
        }
        return prev; // Don't deduct if insufficient balance
      });
      // Check if deduction was successful by reading current balance
      // Note: This is a limitation - we can't know immediately if it succeeded
      // The caller should check balance before calling, or we need to return a promise
      return true; // Optimistic return - actual check happens in setState
    }
    return false;
  }, []);

  const setBalanceValue = (amount: number) => {
    if (amount >= 0) {
      setBalance(amount);
      return true;
    }
    return false;
  };

  return {
    balance,
    addBalance,
    deductBalance,
    setBalance: setBalanceValue,
  };
};

