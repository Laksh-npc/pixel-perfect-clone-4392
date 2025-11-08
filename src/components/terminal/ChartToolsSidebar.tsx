import {
  MousePointer2,
  Minus,
  TrendingUp,
  Type,
  Move,
  Ruler,
  Lock,
  Eye,
  Trash2,
  Settings,
  Heart,
  Magnet,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ChartToolsSidebar = () => {
  const tools = [
    { icon: MousePointer2, label: "Select" },
    { icon: Minus, label: "Horizontal Line" },
    { icon: TrendingUp, label: "Trend Line" },
    { icon: TrendingUp, label: "Fibonacci" },
    { icon: Type, label: "Text" },
    { icon: Move, label: "Pattern" },
    { icon: Ruler, label: "Brush" },
    { icon: Heart, label: "Favorite" },
    { icon: Ruler, label: "Ruler" },
    { icon: ZoomIn, label: "Zoom In" },
    { icon: ZoomOut, label: "Zoom Out" },
    { icon: Magnet, label: "Magnet" },
    { icon: Lock, label: "Lock" },
    { icon: Eye, label: "Visibility" },
    { icon: Trash2, label: "Delete" },
  ];

  return (
    <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-2 gap-1">
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        return (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md"
            title={tool.label}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md mt-auto"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ChartToolsSidebar;

