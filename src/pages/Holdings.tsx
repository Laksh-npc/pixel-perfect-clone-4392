import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HoldingsView from "@/components/HoldingsView";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Holdings Table */}
          <div className="lg:col-span-2">
            <HoldingsView onStockSelect={handleStockSelect} />
          </div>

          {/* Right Column - Placeholder - Match Groww */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="border-gray-200 shadow-sm bg-white rounded-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="w-full">
                    <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-lg p-4 mb-4 cursor-pointer hover:bg-green-100 transition-colors">
                      <p className="text-sm text-gray-600 text-center">Select a stock to get started</p>
                    </div>
                  </div>
                  <div className="w-full pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">Balance:</span>
                      <VisibilityValue 
                        value={`₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        className="font-medium text-gray-900"
                      />
                    </div>
                    <button 
                      className="text-primary hover:underline text-sm"
                      onClick={() => setAddMoneyOpen(true)}
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

