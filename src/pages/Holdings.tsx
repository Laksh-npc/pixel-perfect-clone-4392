import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HoldingsView from "@/components/HoldingsView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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
                {/* Green bar with cursor icon - Match Groww */}
                <div className="bg-green-50 dark:bg-green-900/10 border-b border-green-200 dark:border-green-800/30 px-4 py-3 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-green-600 dark:text-green-500 flex-shrink-0">
                    <path d="M2 2L2 10L6 6L8 8L12 4L12 2L2 2Z" fill="currentColor"/>
                    <path d="M12 4L8 8L10 10L14 6L14 4L12 4Z" fill="currentColor" fillOpacity="0.6"/>
                    <path d="M14 6L10 10L12 12L16 8L16 6L14 6Z" fill="currentColor"/>
                  </svg>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium" style={{ fontSize: '14px', fontWeight: 500 }}>Select a stock to get started</p>
                </div>
                
                {/* Balance Section - Match Groww */}
                <div className="px-4 py-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400" style={{ fontSize: '14px' }}>Balance:</span>
                    <VisibilityValue 
                      value={`₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      className="text-sm font-semibold text-gray-900 dark:text-white"
                      style={{ fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-sm font-medium border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => setAddMoneyOpen(true)}
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    Add money
                  </Button>
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

