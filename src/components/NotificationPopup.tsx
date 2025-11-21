import { CheckCircle2, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface Notification {
  id: string;
  type: "executed" | "placed";
  title: string;
  description: string;
  timestamp: string;
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "executed",
    title: "Order Executed",
    description: "Physicswallah Limited delivery buy order for 1 share at Rs 140.75 has been executed on BSE",
    timestamp: "2 days ago"
  },
  {
    id: "2",
    type: "placed",
    title: "Order Placed",
    description: "Physicswallah Limited delivery buy order for 1 share at Market Price has been placed on BSE",
    timestamp: "2 days ago"
  },
  {
    id: "3",
    type: "executed",
    title: "Order Executed",
    description: "GMRAIRPORT delivery sell order for 2 shares at Rs 102.84 has been executed on NSE",
    timestamp: "2 days ago"
  }
];

interface NotificationPopupProps {
  children: React.ReactNode;
}

const NotificationPopup = ({ children }: NotificationPopupProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 shadow-xl border-gray-200 relative"
        align="end"
        sideOffset={8}
      >
        {/* Arrow pointer */}
        <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />
        <div className="max-h-[500px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="relative flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
                {notification.type === "executed" && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {notification.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {notification.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 bg-gray-50">
          <button className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            VIEW ALL
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopup;

