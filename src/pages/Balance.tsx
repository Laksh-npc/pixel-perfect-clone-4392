import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBalance } from "@/hooks/useBalance";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const Balance = () => {
  const navigate = useNavigate();
  const { balance, addBalance } = useBalance();
  const { theme } = useTheme();
  const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"add" | "withdraw">("add");

  // Force re-render when balance changes
  useEffect(() => {
    // This ensures the component updates when balance changes
  }, [balance]);

  const handleAddMoney = () => {
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (addBalance(amountValue)) {
      toast.success(`₹${amountValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added to your Groww DSFM wallet`);
      setAmount("");
    } else {
      toast.error("Failed to add money");
    }
  };

  const handleQuickAdd = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  return (
    <div className="min-h-screen bg-background dark:bg-[#1a1a1a]">
      <Header />
      
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Account Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stocks, F&O Balance Card - Match Groww exactly */}
            <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-gray-800 rounded-lg p-6">
              <div className="mb-6">
                <div className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Stocks, F&O Balance</div>
                <div className="text-2xl font-semibold text-foreground dark:text-white">
                  ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Cash Section */}
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-border dark:border-gray-800">
                  <div>
                    <div className="text-sm font-medium text-foreground dark:text-white mb-1">Cash</div>
                    <div className="text-lg font-semibold text-foreground dark:text-white">
                      ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveTab("add")}
                    className="bg-green-600 hover:bg-green-700 text-white h-9 px-4"
                  >
                    Add
                  </Button>
                </div>

                {/* Pledge Section */}
                <div className="flex items-start justify-between py-3">
                  <div className="flex-1 pr-4">
                    <div className="text-sm font-medium text-foreground dark:text-white mb-1">Pledge</div>
                    <div className="text-xs text-muted-foreground dark:text-gray-500 leading-relaxed">
                      Add balance for stocks intraday and F&O by pledging your holdings on Groww
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="ml-4 h-9 px-4 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* All Transactions Button */}
              <Button
                variant="ghost"
                className="w-full mt-4 justify-between h-auto py-3 text-foreground dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => navigate("/transactions")}
              >
                <span>All transactions</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Instant Trade Balance Card */}
            <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-gray-800 rounded-lg p-6">
              <div className="text-sm font-medium text-foreground dark:text-white mb-2">Instant trade balance</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
                Get ₹1.83K for Intraday, MTF & FnO
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-10">
                Pledge
              </Button>
            </div>
          </div>

          {/* Right Panel - Add/Withdraw Money */}
          <div className="lg:col-span-1">
            <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-gray-800 rounded-lg p-6 sticky top-20">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab("add")}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "add"
                      ? "bg-green-600 text-white"
                      : "bg-muted dark:bg-gray-800 text-muted-foreground dark:text-gray-400 hover:bg-muted/80 dark:hover:bg-gray-700"
                  }`}
                >
                  Add money
                </button>
                <button
                  onClick={() => setActiveTab("withdraw")}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "withdraw"
                      ? "bg-green-600 text-white"
                      : "bg-muted dark:bg-gray-800 text-muted-foreground dark:text-gray-400 hover:bg-muted/80 dark:hover:bg-gray-700"
                  }`}
                >
                  Withdraw
                </button>
              </div>

              {activeTab === "add" ? (
                <>
                  {/* Enter Amount */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-foreground dark:text-white mb-2 block">
                      Enter Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400 text-lg">
                        ₹
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8 h-12 text-lg font-semibold bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdd(100)}
                      className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      + ₹100
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdd(500)}
                      className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      + ₹500
                    </Button>
                  </div>

                  {/* Add Money Button */}
                  <Button
                    onClick={handleAddMoney}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-semibold"
                    disabled={!amount || parseFloat(amount) <= 0}
                  >
                    Add money
                  </Button>
                </>
              ) : (
                <>
                  {/* Withdraw UI */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-foreground dark:text-white mb-2 block">
                      Enter Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400 text-lg">
                        ₹
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8 h-12 text-lg font-semibold bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white"
                        min="0"
                        step="0.01"
                        max={balance}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-xs text-muted-foreground dark:text-gray-400">
                      Available: ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      const amountValue = parseFloat(amount);
                      if (!amount || isNaN(amountValue) || amountValue <= 0 || amountValue > balance) {
                        toast.error("Please enter a valid amount");
                        return;
                      }
                      toast.info("Withdrawal functionality coming soon");
                      setAmount("");
                    }}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-semibold"
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                  >
                    Withdraw
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Balance;
