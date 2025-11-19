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
import { ArrowLeft } from "lucide-react";

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol?: string;
  currentPrice?: number;
}

const CreateAlertDialog = ({ open, onOpenChange, symbol, currentPrice = 0 }: CreateAlertDialogProps) => {
  const [targetPrice, setTargetPrice] = useState("");
  const [notifyFrequency, setNotifyFrequency] = useState<"once" | "every">("once");

  const handleSetAlert = () => {
    // Handle alert creation logic here
    console.log("Setting alert:", { symbol, targetPrice, notifyFrequency });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-lg font-semibold text-gray-900">Set alert</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="px-4 py-4 space-y-5">
          {/* Target Price Input */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice" className="text-sm font-medium text-gray-700">
              Target price
            </Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              placeholder="Enter target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="h-12 bg-green-50 border-green-200 focus:border-green-400 focus:ring-green-400 text-base"
            />
          </div>

          {/* Notify Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Notify me</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotifyFrequency("every")}
                className={`flex-1 h-10 text-sm font-normal rounded-md border-gray-300 transition-all ${
                  notifyFrequency === "every"
                    ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Every time
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotifyFrequency("once")}
                className={`flex-1 h-10 text-sm font-normal rounded-md border-gray-300 transition-all ${
                  notifyFrequency === "once"
                    ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Once
              </Button>
            </div>
          </div>

          {/* Set Alert Button */}
          <Button
            onClick={handleSetAlert}
            className="w-full h-12 text-base font-semibold rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 disabled:opacity-50"
            disabled={!targetPrice || parseFloat(targetPrice) <= 0}
          >
            SET ALERT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAlertDialog;

