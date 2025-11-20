import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HoldingsView from "@/components/HoldingsView";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

const Holdings = () => {
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const handleStockSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    navigate(`/stock/${symbol}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-medium text-gray-900">₹27.22</span>
                    </div>
                    <button className="text-primary hover:underline text-sm mt-2">Add money</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Holdings;

