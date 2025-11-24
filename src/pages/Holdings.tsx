import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HoldingsView from "@/components/HoldingsView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Wallet } from "lucide-react";
import { useBalance } from "@/hooks/useBalance";
import { useVisibility, VisibilityValue } from "@/hooks/useVisibility";
import AddMoneyDialog from "@/components/AddMoneyDialog";
import Toast from "@/components/Toast";

const Holdings = () => {
  const navigate = useNavigate();
  const { balance } = useBalance();
  const { isVisible } = useVisibility();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const handleStockSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    navigate(`/stock/${symbol}`);
  };

  const handleAddMoneySuccess = (amount: number) => {
    setToast({
      message: `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been added to your Groww balance.`,
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left Column - Holdings Table */}
          <div>
            <HoldingsView onStockSelect={handleStockSelect} />
          </div>

          {/* Right Column - Match Groww exactly */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden">
              <CardContent className="p-0">
                {/* Green bar - Match Groww exactly */}
                <div className="px-4 pt-4 pb-3">
                  {/* Horizontal green bar - 8-10px high, rounded ends */}
                  <div className="mb-3">
                    <div className="h-2.5 bg-[#22C55E] dark:bg-[#00C46A] rounded-full w-full"></div>
                  </div>
                  {/* Centered text below the green bar - medium grey */}
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3" style={{ fontSize: '14px', fontWeight: 400 }}>
                    Select a stock to get started
                  </p>
                </div>
                
                {/* Dashed separator line */}
                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-4"></div>
                
                {/* Balance Section - Match Groww exactly */}
                <div className="px-4 py-4">
                  <div className="flex justify-between items-center">
                    {/* Left side: Wallet icon (dark) + Balance: (lighter gray) + amount (darker gray) */}
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-gray-900 dark:text-gray-100 flex-shrink-0" />
                      <span className="text-sm text-gray-500 dark:text-gray-400" style={{ fontSize: '14px' }}>
                        Balance:
                      </span>
                      <VisibilityValue 
                        value={`₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        className="text-sm text-gray-900 dark:text-gray-100"
                        style={{ fontSize: '14px', fontWeight: 400 }}
                      />
                    </div>
                    {/* Right side: Add money with dashed underline - darker gray/black */}
                    <button
                      onClick={() => setAddMoneyOpen(true)}
                      className="text-sm text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 underline decoration-dashed underline-offset-2 cursor-pointer transition-colors"
                      style={{ fontSize: '14px', fontWeight: 400 }}
                    >
                      Add money
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddMoneyDialog 
        open={addMoneyOpen} 
        onOpenChange={setAddMoneyOpen}
        onSuccess={handleAddMoneySuccess}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          onClose={() => setToast(null)}
        />
      )}

      <Footer />
    </div>
  );
};

export default Holdings;

