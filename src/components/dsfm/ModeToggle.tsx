import { Button } from "@/components/ui/button";
import { Network, Building2 } from "lucide-react";

export type AnalysisMode = "stock" | "sector";

interface ModeToggleProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <Button
        variant={mode === "stock" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("stock")}
        className="flex-1"
      >
        <Network className="w-4 h-4 mr-2" />
        Stock-Level Network
      </Button>
      <Button
        variant={mode === "sector" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("sector")}
        className="flex-1"
      >
        <Building2 className="w-4 h-4 mr-2" />
        Sector-Level Network
      </Button>
    </div>
  );
};

export default ModeToggle;

