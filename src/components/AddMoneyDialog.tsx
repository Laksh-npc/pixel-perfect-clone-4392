import { useState } from "react";
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
import { useBalance } from "@/hooks/useBalance";

interface AddMoneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (amount: number) => void;
}

const AddMoneyDialog = ({ open, onOpenChange, onSuccess }: AddMoneyDialogProps) => {
  const { addBalance } = useBalance();
  const [amount, setAmount] = useState("");

  const handleAddMoney = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && !isNaN(numAmount)) {
      addBalance(numAmount);
      onSuccess?.(numAmount);
      setAmount("");
      onOpenChange(false);
    }
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
            <DialogTitle className="text-lg font-semibold text-gray-900">Add money</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setAmount("");
                onOpenChange(false);
              }}
              className="h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="px-4 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 h-12 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          <Button
            onClick={handleAddMoney}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full h-12 text-base font-semibold rounded-md bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
          >
            Add money
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMoneyDialog;

