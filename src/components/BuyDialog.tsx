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
import { useBalance } from "@/hooks/useBalance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BuyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  companyName: string;
  currentPrice: number;
  priceInfo?: any;
}

const BuyDialog = ({ open, onOpenChange, symbol, companyName, currentPrice, priceInfo }: BuyDialogProps) => {
  const { addHolding } = useHoldings();
  const { balance } = useBalance();
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<"Delivery" | "Intraday">("Delivery");
  const [priceType, setPriceType] = useState<"Market" | "Limit">("Market");
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));

  useEffect(() => {
    if (open && currentPrice) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [open, currentPrice]);

  const effectivePrice = priceType === "Market" ? currentPrice : parseFloat(limitPrice) || currentPrice;
  const totalAmount = quantity ? parseFloat(quantity) * effectivePrice : 0;

  const handleBuy = () => {
    if (!quantity || parseFloat(quantity) <= 0) return;

    const shares = parseFloat(quantity);
    const avgPrice = effectivePrice;
    const investedAmount = shares * avgPrice;

    addHolding({
      symbol,
      companyName,
      shares,
      avgPrice,
      investedAmount,
    });

    onOpenChange(false);
    setQuantity("");
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

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
                className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                Delivery
              </TabsTrigger>
              <TabsTrigger 
                value="Intraday" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                Intraday
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
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
                className={priceType === "Market" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              >
                Market
              </Button>
              <Button
                variant={priceType === "Limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("Limit")}
                className={priceType === "Limit" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
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
                className="h-12 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            )}
          </div>

          {/* Amount Display */}
          {quantity && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance</span>
                <span className="font-medium text-gray-900">{formatCurrency(balance)}</span>
              </div>
            </div>
          )}

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={!quantity || parseFloat(quantity) <= 0 || totalAmount > balance}
            className="w-full h-12 text-base font-semibold rounded-md bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
          >
            Buy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyDialog;

