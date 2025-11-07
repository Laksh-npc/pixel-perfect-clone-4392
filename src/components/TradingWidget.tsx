import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

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
  const [price, setPrice] = useState(priceInfo?.lastPrice?.toFixed(2) || "0");

  const currentPrice = priceInfo?.lastPrice || 0;
  const bsePrice = priceInfo?.lastPrice || 0; // Assuming same for now
  const change = priceInfo?.change || 0;
  const percentChange = priceInfo?.pChange || 0;

  const approximateRequired = quantity && price 
    ? (parseFloat(quantity) * parseFloat(price)).toFixed(2)
    : "0";

  const handleBuy = () => {
    // Handle buy action
    console.log("Buy order:", { symbol, quantity, price, orderType });
  };

  const handleSell = () => {
    // Handle sell action
    console.log("Sell order:", { symbol, quantity, price, orderType });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{companyName}</CardTitle>
        <div className="text-sm text-muted-foreground">
          NSE ₹{currentPrice.toFixed(2)} · BSE ₹{bsePrice.toFixed(2)} ({percentChange >= 0 ? "+" : ""}
          {percentChange.toFixed(2)}%){" "}
          <button className="text-primary hover:underline">Depth</button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "BUY" | "SELL")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="BUY" className={activeTab === "BUY" ? "bg-green-500 text-white" : ""}>
              BUY
            </TabsTrigger>
            <TabsTrigger value="SELL" className={activeTab === "SELL" ? "bg-red-500 text-white" : ""}>
              SELL
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Order Type Selection */}
            <div className="flex gap-2">
              <Button
                variant={orderType === "Delivery" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("Delivery")}
                className="flex-1"
              >
                Delivery
              </Button>
              <Button
                variant={orderType === "Intraday" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("Intraday")}
                className="flex-1"
              >
                Intraday
              </Button>
              <Button
                variant={orderType === "MTF" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType("MTF")}
                className="flex-1 relative"
              >
                MTF 2.44x
                <Settings className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                <Select>
                  <SelectTrigger id="quantity-label" className="w-24 h-6 text-xs">
                    <SelectValue placeholder="Qty BSE" />
                  </SelectTrigger>
                </Select>
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <Label htmlFor="price">
                <Select>
                  <SelectTrigger id="price-label" className="w-24 h-6 text-xs">
                    <SelectValue placeholder="Price Limit" />
                  </SelectTrigger>
                </Select>
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Balance and Requirement */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance:</span>
                <span>₹0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approx req.:</span>
                <span>₹{approximateRequired}</span>
              </div>
            </div>

            {/* Buy/Sell Button */}
            <Button
              className={`w-full ${activeTab === "BUY" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white`}
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

