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
  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE");

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
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1a1a1a] rounded-lg">
      <CardHeader className="pb-4 px-5 pt-5">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontSize: '18px', fontWeight: 600, lineHeight: '1.4' }}>
          {companyName}
        </CardTitle>
        <div className="text-sm text-gray-900 dark:text-white leading-relaxed" style={{ fontSize: '14px' }}>
          NSE ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          <span className={percentChange >= 0 ? "text-[#22C55E] dark:text-[#00C46A]" : "text-[#EF4444] dark:text-[#FF5F5F]"}>({percentChange >= 0 ? "+" : ""}{percentChange.toFixed(2)}%)</span> · 
          BSE ₹{bsePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
          <span className="text-[#22C55E] dark:text-[#00C46A] hover:underline cursor-pointer ml-1">Depth</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0 px-5 pb-5">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "BUY" | "SELL")}>
          <TabsList className="grid w-full grid-cols-2 h-11 bg-transparent p-0 gap-0 border-b border-gray-200 dark:border-gray-800 rounded-none">
            <TabsTrigger 
              value="BUY" 
              className={`rounded-none border-b-2 transition-all h-11 px-4 text-sm font-semibold ${
                activeTab === "BUY" 
                  ? "border-[#22C55E] dark:border-[#00C46A] text-[#22C55E] dark:text-[#00C46A] bg-transparent shadow-none" 
                  : "border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              BUY
            </TabsTrigger>
            <TabsTrigger 
              value="SELL" 
              className={`rounded-none border-b-2 transition-all h-11 px-4 text-sm font-semibold ${
                activeTab === "SELL" 
                  ? "border-[#FF7043] text-[#FF7043] dark:text-[#FF7043] bg-transparent shadow-none" 
                  : "border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              SELL
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-5 mt-6">
            {/* Order Type Selection - Match Groww exactly */}
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderType("Delivery")}
                className={`flex-1 h-9 text-sm font-medium border-gray-300 dark:border-gray-700 rounded-full transition-all duration-200 ${
                  orderType === "Delivery" 
                    ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700"
                }`}
                style={{ fontSize: '14px' }}
              >
                Delivery
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderType("Intraday")}
                className={`flex-1 h-9 text-sm font-medium border-gray-300 dark:border-gray-700 rounded-full transition-all duration-200 ${
                  orderType === "Intraday" 
                    ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700"
                }`}
                style={{ fontSize: '14px' }}
              >
                Intraday
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderType("MTF")}
                className={`flex-1 h-9 text-sm font-medium border-gray-300 dark:border-gray-700 rounded-full transition-all duration-200 relative ${
                  orderType === "MTF" 
                    ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700"
                }`}
                style={{ fontSize: '14px' }}
              >
                MTF {mtfMultiplier}x
                <Settings className="w-3.5 h-3.5 ml-1.5 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>

            {/* Quantity Input - Match Groww exactly */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quantity" className="text-sm text-gray-700 dark:text-gray-300 font-normal" style={{ fontSize: '14px' }}>
                  Qty {exchange}
                </Label>
                <Select value={exchange} onValueChange={(v) => setExchange(v as "NSE" | "BSE")}>
                  <SelectTrigger className="h-5 w-auto text-sm border-none shadow-none p-0 hover:bg-transparent focus:ring-0 bg-transparent">
                    <SelectValue />
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 ml-1" />
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
                placeholder=""
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-11 border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md"
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* Price Input - Match Groww exactly */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="price" className="text-sm text-gray-700 dark:text-gray-300 font-normal" style={{ fontSize: '14px' }}>
                  Price Limit
                </Label>
                <Select value={priceType} onValueChange={(v) => setPriceType(v as "Market" | "Limit")}>
                  <SelectTrigger className="h-5 w-auto text-sm border-none shadow-none p-0 hover:bg-transparent focus:ring-0 bg-transparent">
                    <SelectValue />
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 ml-1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Market">Market</SelectItem>
                    <SelectItem value="Limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {priceType === "Market" ? (
                <div className="w-full h-11 px-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center text-sm text-gray-600 dark:text-gray-400" style={{ fontSize: '14px' }}>
                  At market
                </div>
              ) : (
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder=""
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-11 border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md"
                  style={{ fontSize: '14px' }}
                />
              )}
            </div>

            {/* Warning Message for Market Orders */}
            {priceType === "Market" && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Market order might be subject to price fluctuation
                </p>
              </div>
            )}

            {/* Balance and Requirement - Match Groww exactly */}
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center" style={{ fontSize: '14px' }}>
                <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '14px' }}>Balance:</span>
                <VisibilityValue 
                  value={`₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontSize: '14px', fontWeight: 500 }}
                />
              </div>
              <div className="flex justify-between items-center" style={{ fontSize: '14px' }}>
                <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '14px' }}>Approx req.:</span>
                <VisibilityValue 
                  value={`₹${formattedApproximateRequired}`}
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontSize: '14px', fontWeight: 500 }}
                />
              </div>
            </div>

            {/* Buy/Sell Button - Match Groww exactly */}
            <Button
              className={`w-full h-12 text-base font-semibold rounded-md transition-all duration-200 ${
                activeTab === "BUY" 
                  ? "bg-[#22C55E] hover:bg-[#16a34a] dark:bg-[#00C46A] dark:hover:bg-[#00a855] text-white shadow-sm hover:shadow-md" 
                  : "bg-[#FF7043] hover:bg-[#FF5722] dark:bg-[#FF7043] dark:hover:bg-[#FF5722] text-white shadow-sm hover:shadow-md"
              }`}
              onClick={activeTab === "BUY" ? handleBuy : handleSell}
              size="lg"
              style={{ fontSize: '16px', fontWeight: 600 }}
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

