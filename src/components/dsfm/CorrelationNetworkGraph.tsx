import { useEffect, useRef } from "react";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CorrelationNetworkGraphProps {
  graph: NetworkGraph | null;
  loading?: boolean;
  mode: "stock" | "sector";
}

const CorrelationNetworkGraph = ({ graph, loading, mode }: CorrelationNetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);

  useEffect(() => {
    if (!graph || !containerRef.current || loading) return;

    // Dynamically import vis-network
    import("vis-network").then((vis) => {
      if (!containerRef.current) return;

      // Clear previous network
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      // Prepare nodes for vis-network
      const nodes = graph.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        value: node.betweenness * 10 + 5, // Scale for visibility
        color: getNodeColor(node.sector || "", mode),
        title: `${node.label}\nBetweenness: ${node.betweenness.toFixed(2)}\nDegree: ${node.degree}`
      }));

      // Prepare edges for vis-network
      const edges = graph.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        value: edge.weight * 5, // Scale edge thickness
        color: {
          color: edge.correlation > 0 ? "#3b82f6" : "#ef4444",
          opacity: Math.abs(edge.correlation) * 0.6
        },
        title: `Correlation: ${edge.correlation.toFixed(3)}`
      }));

      const data = { nodes, edges };
      const options = {
        nodes: {
          shape: "dot",
          font: { size: 12, color: "#333" },
          borderWidth: 2
        },
        edges: {
          smooth: {
            type: "continuous",
            roundness: 0.5
          },
          arrows: {
            to: { enabled: false }
          }
        },
        physics: {
          enabled: true,
          stabilization: { iterations: 100 }
        },
        interaction: {
          hover: true,
          tooltipDelay: 100
        }
      };

      networkRef.current = new vis.Network(containerRef.current, data, options);
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graph, mode, loading]);

  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[500px] w-full" />
      </Card>
    );
  }

  if (!graph) {
    return (
      <Card className="p-4">
        <div className="h-[500px] flex items-center justify-center text-gray-500">
          No network data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold mb-1">
          {mode === "stock" ? "Stock-Level Network" : "Sector-Level Network"}
        </h3>
        <p className="text-xs text-gray-500">
          Node size = Betweenness Centrality | Edge thickness = Correlation strength
        </p>
      </div>
      <div ref={containerRef} className="h-[500px] border rounded-md" />
    </Card>
  );
};

// Color mapping for sectors
function getNodeColor(sector: string, mode: "stock" | "sector"): string {
  const colors: Record<string, string> = {
    "Information Technology": "#3b82f6",
    "Banking": "#10b981",
    "Automotive": "#f59e0b",
    "Pharmaceuticals": "#8b5cf6",
    "FMCG": "#ec4899",
    "Energy": "#ef4444",
    "Financial Services": "#06b6d4",
    "Realty": "#84cc16",
    "Metals": "#6366f1",
    "PSU Banking": "#14b8a6",
    "Construction": "#f97316",
    "Telecommunications": "#a855f7"
  };

  return colors[sector] || "#6b7280";
}

export default CorrelationNetworkGraph;

