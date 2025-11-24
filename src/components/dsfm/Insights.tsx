import { Card } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Network, AlertCircle, Shield, Zap } from "lucide-react";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { ShockSimulation } from "@/services/dsfm/shockEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { computeSectorClusters } from "@/services/dsfm/opt/sectorClusters";
import { useMemo } from "react";

interface InsightsProps {
  mode: "stock" | "sector";
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  shockSimulation: ShockSimulation | null;
  timeRange: string;
}

const Insights = ({
  mode,
  networkGraph,
  correlationMatrix,
  shockSimulation,
  timeRange
}: InsightsProps) => {
  // Compute clusters for insights
  const clusterAnalysis = useMemo(() => {
    if (!networkGraph || !correlationMatrix) return null;
    try {
      return computeSectorClusters(correlationMatrix, networkGraph);
    } catch {
      return null;
    }
  }, [networkGraph, correlationMatrix]);

  const generateInsights = () => {
    const insights: Array<{ text: string; icon: "trending" | "network" | "alert" | "shield" | "zap" }> = [];

    if (networkGraph && networkGraph.nodes.length > 0) {
      // 1. Top bridge sectors and why
      const topNodes = [...networkGraph.nodes]
        .sort((a, b) => b.betweenness - a.betweenness)
        .slice(0, 3);
      
      if (topNodes.length > 0) {
        const topNode = topNodes[0];
        const degree = topNode.degree || topNode.centrality;
        const reason = degree > networkGraph.nodes.length * 0.3 
          ? "high connectivity" 
          : "critical bridge position";
        
        insights.push({
          text: `Top bridge ${mode === "sector" ? "sector" : "stock"}: ${topNode.label.replace('.NS', '')} (BC: ${topNode.betweenness.toFixed(4)}) acts as ${reason}, making it a key shock transmitter.`,
          icon: "trending"
        });
      }

      // 2. Most vulnerable cluster
      if (clusterAnalysis && clusterAnalysis.clusterInfo.length > 0) {
        const vulnerableCluster = clusterAnalysis.clusterInfo
          .sort((a, b) => b.avgExternalCorrelation - a.avgExternalCorrelation)[0];
        
        if (vulnerableCluster.avgExternalCorrelation > 0.5) {
          insights.push({
            text: `Most vulnerable cluster: ${vulnerableCluster.members.length} ${mode === "sector" ? "sectors" : "stocks"} with high external correlation (${vulnerableCluster.avgExternalCorrelation.toFixed(3)}), indicating susceptibility to external shocks.`,
            icon: "alert"
          });
        }
      }

      // 3. Sector acting as shock amplifier
      const highDegreeNodes = networkGraph.nodes
        .filter(n => (n.degree || n.centrality) > networkGraph.nodes.length * 0.4)
        .sort((a, b) => (b.degree || b.centrality) - (a.degree || a.centrality));
      
      if (highDegreeNodes.length > 0 && correlationMatrix) {
        const amplifier = highDegreeNodes[0];
        const idx = correlationMatrix.symbols.indexOf(amplifier.id);
        if (idx !== -1) {
          let avgCorr = 0;
          let count = 0;
          for (let j = 0; j < correlationMatrix.symbols.length; j++) {
            if (j !== idx) {
              avgCorr += Math.abs(correlationMatrix.matrix[idx][j]);
              count++;
            }
          }
          avgCorr = count > 0 ? avgCorr / count : 0;
          
          if (avgCorr > 0.6) {
            insights.push({
              text: `Shock amplifier: ${amplifier.label.replace('.NS', '')} with ${amplifier.degree} connections and avg correlation ${avgCorr.toFixed(3)}, can rapidly propagate shocks across the network.`,
              icon: "zap"
            });
          }
        }
      }

      // 4. Sectors isolated from market stress
      const isolatedNodes = networkGraph.nodes
        .filter(n => (n.degree || n.centrality) < 2 && n.betweenness < 0.01)
        .slice(0, 3);
      
      if (isolatedNodes.length > 0) {
        insights.push({
          text: `Isolated from market stress: ${isolatedNodes.map(n => n.label.replace('.NS', '')).join(', ')} show low connectivity, providing natural diversification benefits.`,
          icon: "shield"
        });
      }

      // 5. Network density and connectivity
      const density = networkGraph.metadata?.density || 
        (2 * networkGraph.edges.length) / (networkGraph.nodes.length * (networkGraph.nodes.length - 1));
      
      if (density > 0.5) {
        insights.push({
          text: `High network density (${(density * 100).toFixed(1)}%) indicates strong co-movement patterns and systemic risk concentration.`,
          icon: "network"
        });
      } else if (density < 0.2) {
        insights.push({
          text: `Low network density (${(density * 100).toFixed(1)}%) suggests fragmented market with limited shock propagation pathways.`,
          icon: "network"
        });
      }

      // 6. Changes across time ranges
      const avgCorr = networkGraph.metadata?.avgCorrelation || 0;
      if (avgCorr > 0.7) {
        insights.push({
          text: `Strong average correlation (${avgCorr.toFixed(3)}) in ${timeRange} suggests synchronized ${timeRange.includes('Y') ? 'long-term' : 'short-term'} market movements.`,
          icon: "trending"
        });
      }
    }

    // Shock simulation insights
    if (shockSimulation) {
      const topImpact = shockSimulation.impacts[0];
      if (topImpact) {
        insights.push({
          text: `Shock analysis: ${shockSimulation.shockMagnitude}% shock in ${shockSimulation.shockSymbol.replace('.NS', '')} affects ${shockSimulation.totalAffected} ${mode === "stock" ? "stocks" : "sectors"} with max impact ${shockSimulation.maxImpact.toFixed(2)}% on ${topImpact.symbol.replace('.NS', '')}.`,
          icon: "alert"
        });
      }

      const affectedRatio = networkGraph ? shockSimulation.totalAffected / networkGraph.nodes.length : 0;
      if (affectedRatio > 0.7) {
        insights.push({
          text: `Systemic vulnerability detected: ${(affectedRatio * 100).toFixed(0)}% of network affected, indicating high contagion risk.`,
          icon: "alert"
        });
      }
    }

    // Warning about sparsity
    if (networkGraph?.metadata?.warning) {
      insights.push({
        text: networkGraph.metadata.warning,
        icon: "alert"
      });
    }

    return insights.length > 0 ? insights : [{
      text: "Run analysis to generate insights about market connectivity and systemic risk.",
      icon: "network" as const
    }];
  };

  const insights = generateInsights();

  const getIcon = (icon: string) => {
    switch (icon) {
      case "trending": return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "network": return <Network className="w-4 h-4 text-blue-600" />;
      case "alert": return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case "shield": return <Shield className="w-4 h-4 text-green-600" />;
      case "zap": return <Zap className="w-4 h-4 text-yellow-600" />;
      default: return <div className="w-4 h-4 rounded-full bg-blue-600" />;
    }
  };

  const getBorderColor = (icon: string) => {
    switch (icon) {
      case "trending": return "border-blue-500";
      case "network": return "border-blue-500";
      case "alert": return "border-orange-500";
      case "shield": return "border-green-500";
      case "zap": return "border-yellow-500";
      default: return "border-blue-500";
    }
  };

  const getBgColor = (icon: string) => {
    switch (icon) {
      case "trending": return "bg-blue-50";
      case "network": return "bg-blue-50";
      case "alert": return "bg-orange-50";
      case "shield": return "bg-green-50";
      case "zap": return "bg-yellow-50";
      default: return "bg-blue-50";
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-sm font-semibold">AI-Generated Insights</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`flex gap-2 p-3 ${getBgColor(insight.icon)} rounded-md border-l-4 ${getBorderColor(insight.icon)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(insight.icon)}
            </div>
            <p className="text-sm text-gray-700 flex-1">{insight.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Insights;

