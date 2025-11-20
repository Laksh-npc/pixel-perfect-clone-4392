import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, HelpCircle, ChevronDown } from "lucide-react";
import BuyDialog from "@/components/BuyDialog";
import SellDialog from "@/components/SellDialog";
import { useBalance } from "@/hooks/useBalance";
import { VisibilityValue } from "@/hooks/useVisibility";

interface TradingWidgetProps {
  symbol: string;
  companyName: string;
  priceInfo: any;
  tradeInfo: any;
}

const TradingWidget = ({ symbol, companyName, priceInfo, tradeInfo }: TradingWidgetProps) => {
  const { balance } = useBalance();
  const [activeTab, setActiveTab] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"Delivery" | "Intraday" | "MTF">("Delivery");
  const [quantity, setQuantity] = useState("");
  const [priceType, setPriceType] = useState<"Market" | "Limit">("Market");
  const [price, setPrice] = useState(priceInfo?.lastPrice?.toFixed(2) || "0");
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);

  // Calculate MTF multiplier (typically varies by stock, using a default calculation)
  const calculateMTFMultiplier = () => {
    const basePrice = priceInfo?.lastPrice || 100;
    // Simple calculation: higher priced stocks get lower multipliers
    if (basePrice > 1000) return "2.44";
    if (basePrice > 500) return "2.50";
    if (basePrice > 200) return "3.03";
    return "3.50";
  };

  const mtfMultiplier = calculateMTFMultiplier();

  // Update price when priceInfo changes
  useEffect(() => {
    if (priceInfo?.lastPrice && priceType === "Limit") {
      setPrice(priceInfo.lastPrice.toFixed(2));
    }
  }, [priceInfo, priceType]);

  // Use lastPrice for NSE (most recent price), or close if lastPrice not available
  // Note: The API provides NSE data. BSE prices might differ but are not available in this API
  // In a real implementation, you'd fetch BSE prices separately or use a different endpoint
  const currentPrice = priceInfo?.lastPrice || priceInfo?.close || 0;
  // For now, use the same price for BSE (in reality, BSE prices can differ)
  // TODO: Fetch BSE prices separately if API supports it
  const bsePrice = priceInfo?.lastPrice || priceInfo?.close || 0;
  
  // Use the API's calculated change and percent change (more accurate)
  // These are calculated from previousClose, which is the correct reference point
  const change = priceInfo?.change || 0;
  const percentChange = priceInfo?.pChange || 0;

  const approximateRequired = quantity && (priceType === "Market" ? currentPrice : price)
    ? (parseFloat(quantity) * (priceType === "Market" ? currentPrice : parseFloat(price)))
    : 0;
  
  const formattedApproximateRequired = isNaN(approximateRequired) 
    ? "0.00" 
    : approximateRequired.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleBuy = () => {
    setBuyDialogOpen(true);
  };

  const handleSell = () => {
    setSellDialogOpen(true);
  };

  return (
    <Card className="border border-gray-200 shadow-sm bg-white rounded-lg">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-base font-semibold text-gray-900">{companyName}</CardTitle>
        <div className="text-xs text-gray-600 mt-1">
          NSE ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={percentChange >= 0 ? "text-green-600" : "text-red-600"}>({percentChange >= 0 ? "+" : ""}{percentChange.toFixed(2)}%)</span> · BSE ₹{bsePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-primary hover:underline cursor-pointer ml-1">Depth</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 px-4 pb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "BUY" | "SELL")}>
          <TabsList className="grid w-full grid-cols-2 h-10 bg-transparent p-0 gap-0 border-b border-gray-200 rounded-none">
            <TabsTrigger 
              value="BUY" 
              className={`rounded-none border-b-2 transition-all h-10 px-4 text-sm font-medium ${
                activeTab === "BUY" 
                  ? "border-green-500 text-green-600 bg-transparent shadow-none" 
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              BUY
            </TabsTrigger>
            <TabsTrigger 
              value="SELL" 
              className={`rounded-none border-b-2 transition-all h-10 px-4 text-sm font-medium ${
                activeTab === "SELL" 
                  ? "border-orange-500 text-orange-600 bg-transparent shadow-none" 
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              SELL
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Order Type Selection - Match Groww style */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderType("Delivery")}
                className={`flex-1 h-9 text-sm font-normal border-gray-300 rounded-md transition-all duration-200 ${
                  orderType === "Delivery" 
                    ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800" 
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                Delivery
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderType("Intraday")}
                className={`flex-1 h-9 text-sm font-normal border-gray-300 rounded-md transition-all duration-200 ${
                  orderType === "Intraday" 
                    ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800" 
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                Intraday
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderType("MTF")}
                className={`flex-1 h-9 text-sm font-normal border-gray-300 rounded-md transition-all duration-200 relative ${
                  orderType === "MTF" 
                    ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800" 
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                MTF {mtfMultiplier}x
                <Settings className="w-3 h-3 ml-1.5" />
              </Button>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quantity" className="text-xs text-gray-600 font-normal">Qty NSE</Label>
                <Select defaultValue="NSE">
                  <SelectTrigger className="h-5 w-auto text-xs border-none shadow-none p-0 hover:bg-transparent focus:ring-0">
                    <SelectValue />
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BSE">BSE</SelectItem>
                    <SelectItem value="NSE">NSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-10 border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-sm"
              />
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="price" className="text-xs text-gray-600 font-normal">Price Limit</Label>
                <Select value={priceType} onValueChange={(v) => setPriceType(v as "Market" | "Limit")}>
                  <SelectTrigger className="h-5 w-auto text-xs border-none shadow-none p-0 hover:bg-transparent focus:ring-0">
                    <SelectValue />
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Market">Market</SelectItem>
                    <SelectItem value="Limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {priceType === "Market" ? (
                <div className="w-full h-10 px-3 border border-gray-300 rounded-md bg-gray-50 flex items-center text-sm text-gray-600">
                  At market
                </div>
              ) : (
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-10 border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-sm"
                />
              )}
            </div>

            {/* Warning Message for Market Orders */}
            {priceType === "Market" && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Market order might be subject to price fluctuation
                </p>
              </div>
            )}

            {/* Balance and Requirement - Match Groww style */}
            <div className="space-y-2.5 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance:</span>
                <VisibilityValue 
                  value={`₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  className="font-medium text-gray-900"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Approx req.:</span>
                <VisibilityValue 
                  value={`₹${formattedApproximateRequired}`}
                  className="font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Buy/Sell Button - Match Groww style */}
            <Button
              className={`w-full h-12 text-base font-semibold rounded-md transition-all duration-200 ${
                activeTab === "BUY" 
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md" 
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md"
              }`}
              onClick={activeTab === "BUY" ? handleBuy : handleSell}
              size="lg"
            >
              {activeTab === "BUY" ? "Buy" : "Sell"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Buy/Sell Dialogs */}
      <BuyDialog
        open={buyDialogOpen}
        onOpenChange={setBuyDialogOpen}
        symbol={symbol}
        companyName={companyName}
        currentPrice={currentPrice}
        priceInfo={priceInfo}
      />
      <SellDialog
        open={sellDialogOpen}
        onOpenChange={setSellDialogOpen}
        symbol={symbol}
        companyName={companyName}
        currentPrice={currentPrice}
        priceInfo={priceInfo}
      />
    </Card>
  );
};

export default TradingWidget;

