import { useState, memo } from "react";
import { X, Network, TrendingUp, BarChart3, Layers, Activity, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DSFMAnalysisPanel = memo(() => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const navigate = useNavigate();

  const sections = [
    { id: "overview", icon: Network, label: "Overview" },
    { id: "bridge", icon: Layers, label: "Bridge Finder" },
    { id: "shock", icon: Activity, label: "Shock Simulator" },
    { id: "insights", icon: Brain, label: "Insights" },
  ];

  if (!isOpen) {
    return (
      <div className="w-8 bg-muted/30 border-l border-border flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-8 w-8 text-muted-foreground hover:bg-muted"
        >
          <Network className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-background border-l border-border flex flex-col h-full">
      {/* DSFM Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">:: DSFM Analysis</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 text-muted-foreground hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* DSFM Content */}
      {activeSection === "overview" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Market Analyzer</span>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-xs h-8"
              onClick={() => navigate("/dsfm-analysis")}
            >
              <Network className="w-3 h-3 mr-2" />
              Open Full Dashboard
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="p-2 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">Market Bridge Finder</span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-5">
                  Identify systemic influencers and bridge stocks
                </p>
              </div>
              <div className="p-2 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">Shock Simulator</span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-5">
                  Test shock propagation patterns
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Sections Placeholder */}
      {activeSection !== "overview" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground mb-2">
              {sections.find((s) => s.id === activeSection)?.label}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dsfm-analysis")}
              className="text-xs"
            >
              Open Full Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="border-t border-border p-2">
        <div className="flex flex-col gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className={`h-8 w-full justify-start text-xs ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3 h-3 mr-2" />
                {section.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

DSFMAnalysisPanel.displayName = "DSFMAnalysisPanel";

export default DSFMAnalysisPanel;
