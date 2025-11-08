import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, HelpCircle, ChevronDown } from "lucide-react";

interface TradingWidgetProps {
  symbol: string;
  companyName: string;
  priceInfo: any;
  tradeInfo: any;
}

const TradingWidget = ({ symbol, companyName, priceInfo, tradeInfo }: TradingWidgetProps) => {
  const [activeTab, setActiveTab] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"Delivery" | "Intraday" | "MTF">("Delivery");
  const [quantity, setQuantity] = useState("");
  const [priceType, setPriceType] = useState<"Market" | "Limit">("Market");
  const [price, setPrice] = useState(priceInfo?.lastPrice?.toFixed(2) || "0");

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
    // Handle buy action
    console.log("Buy order:", { symbol, quantity, priceType, price, orderType });
  };

  const handleSell = () => {
    // Handle sell action
    console.log("Sell order:", { symbol, quantity, priceType, price, orderType });
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{companyName}</CardTitle>
        <div className="text-sm text-muted-foreground mt-1">
          NSE ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · BSE ₹{bsePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={percentChange >= 0 ? "text-green-600" : "text-red-600"}>({percentChange >= 0 ? "+" : ""}{percentChange.toFixed(2)}%)</span>{" "}
          <button className="text-primary hover:underline ml-1">Depth</button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "BUY" | "SELL")}>
          <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50 p-1 rounded-md">
            <TabsTrigger 
              value="BUY" 
              className={`rounded-md transition-all ${
                activeTab === "BUY" 
                  ? "bg-green-500 text-white shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              BUY
            </TabsTrigger>
            <TabsTrigger 
              value="SELL" 
              className={`rounded-md transition-all ${
                activeTab === "SELL" 
                  ? "bg-red-500 text-white shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              SELL
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Order Type Selection */}
            <div className="flex gap-2">
              <Button
                variant={orderType === "Delivery" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("Delivery")}
                className={`flex-1 h-9 text-sm ${
                  orderType === "Delivery" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background hover:bg-muted"
                }`}
              >
                Delivery
              </Button>
              <Button
                variant={orderType === "Intraday" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("Intraday")}
                className={`flex-1 h-9 text-sm ${
                  orderType === "Intraday" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background hover:bg-muted"
                }`}
              >
                Intraday
              </Button>
              <Button
                variant={orderType === "MTF" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("MTF")}
                className={`flex-1 h-9 text-sm relative ${
                  orderType === "MTF" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background hover:bg-muted"
                }`}
              >
                MTF {mtfMultiplier}x
                <Settings className="w-3 h-3 ml-1.5" />
              </Button>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quantity" className="text-sm text-muted-foreground font-normal">Qty BSE</Label>
                <Select defaultValue="BSE">
                  <SelectTrigger className="h-6 w-16 text-xs border-none shadow-none p-0 hover:bg-transparent">
                    <SelectValue />
                    <ChevronDown className="h-3 w-3" />
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
                className="w-full h-10"
              />
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="price" className="text-sm text-muted-foreground font-normal">Price Market</Label>
                <Select value={priceType} onValueChange={(v) => setPriceType(v as "Market" | "Limit")}>
                  <SelectTrigger className="h-6 w-auto text-xs border-none shadow-none p-0 hover:bg-transparent">
                    <SelectValue />
                    <ChevronDown className="h-3 w-3" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Market">Market</SelectItem>
                    <SelectItem value="Limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {priceType === "Market" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 justify-start bg-background hover:bg-muted text-sm font-normal"
                >
                  At market
                </Button>
              ) : (
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-10"
                />
              )}
            </div>

            {/* Warning Message for Market Orders */}
            {priceType === "Market" && (
              <div className="bg-muted/50 border border-muted rounded-md p-3 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Market order might be subject to price fluctuation
                </p>
              </div>
            )}

            {/* Balance and Requirement */}
            <div className="space-y-2.5 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-medium text-foreground">₹0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approx req.:</span>
                <span className="font-medium text-foreground underline decoration-dashed underline-offset-2">₹{formattedApproximateRequired}</span>
              </div>
            </div>

            {/* Buy/Sell Button */}
            <Button
              className={`w-full h-12 text-base font-semibold rounded-md ${
                activeTab === "BUY" 
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-sm" 
                  : "bg-red-500 hover:bg-red-600 text-white shadow-sm"
              }`}
              onClick={activeTab === "BUY" ? handleBuy : handleSell}
              size="lg"
            >
              {activeTab === "BUY" ? "Buy" : "Sell"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TradingWidget;

