import { useState, useEffect } from "react";

const STORAGE_KEY = "groww_balance";

export const useBalance = () => {
  const [balance, setBalance] = useState<number>(27.22);

  // Load balance from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed)) {
          setBalance(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  }, []);

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, balance.toString());
    } catch (error) {
      console.error("Error saving balance:", error);
    }
  }, [balance]);

  const addBalance = (amount: number) => {
    if (amount > 0) {
      setBalance((prev) => prev + amount);
      return true;
    }
    return false;
  };

  const deductBalance = (amount: number) => {
    if (amount > 0 && balance >= amount) {
      setBalance((prev) => prev - amount);
      return true;
    }
    return false;
  };

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

