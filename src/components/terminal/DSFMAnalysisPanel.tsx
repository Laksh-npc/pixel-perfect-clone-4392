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
      <div className="w-10 bg-muted/50 border-l border-border flex flex-col items-center py-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg"
          title="DSFM Analysis"
        >
          <Network className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-background/95 border-l border-border flex flex-col h-full">
      {/* DSFM Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
        <span className="text-sm font-bold text-foreground">DSFM Analysis</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* DSFM Content */}
      {activeSection === "overview" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Market Analyzer</span>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-xs h-9 bg-muted/50 border-border hover:bg-muted hover:text-foreground rounded-lg"
              onClick={() => navigate("/dsfm-analysis")}
            >
              <Network className="w-3.5 h-3.5 mr-2.5" />
              Open Full Dashboard
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">Market Bridge Finder</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Identify systemic influencers and bridge stocks
                </p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" />
                  <span className="font-semibold text-foreground">Shock Simulator</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
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
            <p className="text-sm font-semibold text-foreground mb-3">
              {sections.find((s) => s.id === activeSection)?.label}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dsfm-analysis")}
              className="text-xs h-8 bg-muted/50 border-border hover:bg-muted"
            >
              Open Full Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="border-t border-border p-3 bg-muted/20 flex flex-col gap-1">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveSection(section.id)}
              className={`h-9 w-full justify-start text-xs font-medium rounded-lg transition-colors ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 mr-2.5" />
              {section.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
});

DSFMAnalysisPanel.displayName = "DSFMAnalysisPanel";

export default DSFMAnalysisPanel;
