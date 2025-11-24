import { Button } from "@/components/ui/button";
import { Filter, Network, Link2 } from "lucide-react";
import { EdgeConstructionMode } from "@/services/dsfm/networkEngine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EdgeModeToggleProps {
  mode: EdgeConstructionMode;
  onModeChange: (mode: EdgeConstructionMode) => void;
  threshold?: number;
  topK?: number;
  onThresholdChange?: (threshold: number) => void;
  onTopKChange?: (topK: number) => void;
}

const EdgeModeToggle = ({
  mode,
  onModeChange,
  threshold = 0.5,
  topK = 3,
  onThresholdChange,
  onTopKChange
}: EdgeModeToggleProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Edge Construction:</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-gray-500 cursor-help">ℹ️</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                <strong>Threshold:</strong> Only correlations above threshold create edges<br/>
                <strong>Top-K:</strong> Each node connects to its K strongest correlations<br/>
                <strong>MST:</strong> Minimum Spanning Tree for always-connected structure<br/>
                <strong>Full:</strong> All nodes connected with distance weights
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <Button
          variant={mode === "threshold" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("threshold")}
          className="flex-1 text-xs"
        >
          <Filter className="w-3 h-3 mr-1" />
          Threshold
        </Button>
        <Button
          variant={mode === "topk" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("topk")}
          className="flex-1 text-xs"
        >
          <Network className="w-3 h-3 mr-1" />
          Top-K
        </Button>
        <Button
          variant={mode === "mst" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("mst")}
          className="flex-1 text-xs"
        >
          <Link2 className="w-3 h-3 mr-1" />
          MST
        </Button>
        <Button
          variant={mode === "full" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("full")}
          className="flex-1 text-xs"
        >
          <Link2 className="w-3 h-3 mr-1" />
          Full
        </Button>
      </div>
      
      {/* Parameter controls */}
      <div className="flex gap-2 text-xs">
        {mode === "threshold" && onThresholdChange && (
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Threshold:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-700 font-medium w-12">{threshold.toFixed(2)}</span>
          </div>
        )}
        {mode === "topk" && onTopKChange && (
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Top-K:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => onTopKChange(parseInt(e.target.value) || 3)}
              className="w-16 px-2 py-1 border rounded text-sm"
            />
          </div>
        )}
        {mode === "mst" && (
          <div className="text-gray-600 text-xs">
            Minimum Spanning Tree: Always-connected, n-1 edges
          </div>
        )}
        {mode === "full" && (
          <div className="text-gray-600 text-xs">
            All nodes connected with distance = √(2×(1-corr))
          </div>
        )}
      </div>
    </div>
  );
};

export default EdgeModeToggle;

