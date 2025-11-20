import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useHoldings } from "@/hooks/useHoldings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  companyName: string;
  currentPrice: number;
  priceInfo?: any;
}

const SellDialog = ({ open, onOpenChange, symbol, companyName, currentPrice, priceInfo }: SellDialogProps) => {
  const { holdings, removeHolding } = useHoldings();
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<"Delivery" | "Intraday">("Delivery");
  const [priceType, setPriceType] = useState<"Market" | "Limit">("Market");
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));

  const holding = holdings.find((h) => h.symbol === symbol);
  const maxShares = holding?.shares || 0;

  useEffect(() => {
    if (open && currentPrice) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [open, currentPrice]);

  const effectivePrice = priceType === "Market" ? currentPrice : parseFloat(limitPrice) || currentPrice;
  const totalAmount = quantity ? parseFloat(quantity) * effectivePrice : 0;
  const avgPrice = holding?.avgPrice || 0;
  const profitLoss = quantity ? (effectivePrice - avgPrice) * parseFloat(quantity) : 0;
  const profitLossPercent = avgPrice > 0 ? ((effectivePrice - avgPrice) / avgPrice) * 100 : 0;

  const handleSell = () => {
    if (!quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > maxShares) return;

    removeHolding(symbol, parseFloat(quantity));
    onOpenChange(false);
    setQuantity("");
  };

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toLocaleString("en-IN", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  if (!holding) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">{companyName}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            NSE ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </DialogHeader>
        
        <div className="px-4 py-4 space-y-4">
          {/* Order Type Tabs */}
          <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
            <TabsList className="grid w-full grid-cols-2 h-10 bg-transparent p-0 border-b border-gray-200 rounded-none">
              <TabsTrigger 
                value="Delivery" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none"
              >
                Delivery
              </TabsTrigger>
              <TabsTrigger 
                value="Intraday" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none"
              >
                Intraday
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quantity Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Quantity
              </Label>
              <span className="text-xs text-gray-600">{maxShares} shares available</span>
            </div>
            <Input
              id="quantity"
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= maxShares)) {
                  setQuantity(val);
                }
              }}
              max={maxShares}
              className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          {/* Price Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Price</Label>
            <div className="flex gap-2">
              <Button
                variant={priceType === "Market" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("Market")}
                className={priceType === "Market" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
              >
                Market
              </Button>
              <Button
                variant={priceType === "Limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("Limit")}
                className={priceType === "Limit" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
              >
                Limit
              </Button>
            </div>
            {priceType === "Limit" && (
              <Input
                type="number"
                step="0.01"
                placeholder="Enter limit price"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            )}
          </div>

          {/* Amount and P/L Display */}
          {quantity && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit/Loss</span>
                <span className={`font-medium ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss)} ({formatPercent(profitLossPercent)})
                </span>
              </div>
            </div>
          )}

          {/* Sell Button */}
          <Button
            onClick={handleSell}
            disabled={!quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > maxShares}
            className="w-full h-12 text-base font-semibold rounded-md bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
          >
            Sell
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellDialog;

