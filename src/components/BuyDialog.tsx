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
import { X, ChevronDown, Settings } from "lucide-react";
import { useHoldings } from "@/hooks/useHoldings";
import { useBalance } from "@/hooks/useBalance";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  const [orderType, setOrderType] = useState<"Delivery" | "Intraday" | "MTF">("Delivery");
  const mtfMultiplier = 2.33;
  const [priceType, setPriceType] = useState<"Market" | "Limit">("Limit");
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));
  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE");

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

  const bsePrice = currentPrice + (Math.random() * 2 - 1) * 0.2; // Simulate BSE price

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg p-0 gap-0 shadow-lg">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold">{companyName}</DialogTitle>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>NSE ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span>BSE ₹{bsePrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-primary cursor-pointer">Depth</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="px-4 py-4 space-y-4">
          {/* Buy/Sell Tabs */}
          <Tabs defaultValue="BUY" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 bg-transparent p-0 border-b rounded-none">
              <TabsTrigger 
                value="BUY"
                className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none font-medium"
              >
                BUY
              </TabsTrigger>
              <TabsTrigger 
                value="SELL"
                className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none font-medium text-muted-foreground"
              >
                SELL
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Order Type Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={orderType === "Delivery" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderType("Delivery")}
              className={cn(
                "h-8 rounded-full text-xs",
                orderType === "Delivery" ? "bg-background border-border shadow-sm" : "border-border/50"
              )}
            >
              Delivery
            </Button>
            <Button
              variant={orderType === "Intraday" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderType("Intraday")}
              className={cn(
                "h-8 rounded-full text-xs",
                orderType === "Intraday" ? "bg-background border-border shadow-sm" : "border-border/50"
              )}
            >
              Intraday
            </Button>
            <Button
              variant={orderType === "MTF" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderType("MTF")}
              className={cn(
                "h-8 rounded-full text-xs",
                orderType === "MTF" ? "bg-background border-border shadow-sm" : "border-border/50"
              )}
            >
              MTF 2.33x
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-xs font-medium text-muted-foreground">
              Qty {exchange}
            </Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                placeholder=""
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-10 text-sm border-border pr-8"
              />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Price Limit Input */}
          <div className="space-y-2">
            <Label htmlFor="priceLimit" className="text-xs font-medium text-muted-foreground">
              Price Limit
            </Label>
            <div className="relative">
              <Input
                id="priceLimit"
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="h-10 text-sm border-border bg-muted/50 pr-8"
              />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Balance and Approx Required */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <span>Balance: {formatCurrency(balance)}</span>
              <span className="w-3 h-3 rounded-full border border-muted-foreground/50 flex items-center justify-center text-[10px] cursor-help">i</span>
            </div>
            <span>Approx req.: {formatCurrency(totalAmount)}</span>
          </div>

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={!quantity || parseFloat(quantity) <= 0 || totalAmount > balance}
            className="w-full h-10 text-sm font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
          >
            Buy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyDialog;

