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
import { memo } from "react";

const ChartToolsSidebar = memo(() => {
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
    <div className="w-12 bg-muted/30 border-r border-border flex flex-col items-center py-2 gap-1">
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        return (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md"
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
        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md mt-auto"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
});

ChartToolsSidebar.displayName = "ChartToolsSidebar";

export default ChartToolsSidebar;
