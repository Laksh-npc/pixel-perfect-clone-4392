import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, onClose, duration = 3000 }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        <p className="text-sm text-gray-900 flex-1">{message}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="h-6 w-6 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Toast;

