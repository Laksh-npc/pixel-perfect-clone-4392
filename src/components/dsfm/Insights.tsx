import { Card } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Network, AlertCircle } from "lucide-react";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { ShockSimulation } from "@/services/dsfm/shockEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";

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
  const generateInsights = () => {
    const insights: string[] = [];

    if (networkGraph && networkGraph.nodes.length > 0) {
      const topNode = [...networkGraph.nodes]
        .sort((a, b) => b.betweenness - a.betweenness)[0];

      if (mode === "stock") {
        insights.push(
          `Most influential ${mode === "stock" ? "stock" : "sector"} this period is ${topNode.label.replace('.NS', '')} with a betweenness centrality of ${topNode.betweenness.toFixed(2)}.`
        );
      } else {
        insights.push(
          `Most influential sector this period is ${topNode.label} with a betweenness centrality of ${topNode.betweenness.toFixed(2)}.`
        );
      }

      // Network connectivity analysis
      const totalEdges = networkGraph.edges.length;
      const totalPossibleEdges = (networkGraph.nodes.length * (networkGraph.nodes.length - 1)) / 2;
      const connectivity = totalEdges / totalPossibleEdges;

      if (connectivity > 0.5) {
        insights.push(
          `Market is currently highly interconnected (${(connectivity * 100).toFixed(1)}% connectivity), indicating strong co-movement patterns.`
        );
      } else {
        insights.push(
          `Market shows moderate connectivity (${(connectivity * 100).toFixed(1)}% connectivity), with some fragmentation between ${mode === "stock" ? "stocks" : "sectors"}.`
        );
      }

      // Sector analysis for stock mode
      if (mode === "stock" && networkGraph.nodes.length > 0) {
        const sectors = new Map<string, number>();
        networkGraph.nodes.forEach(node => {
          if (node.sector) {
            sectors.set(node.sector, (sectors.get(node.sector) || 0) + node.betweenness);
          }
        });

        const topSectors = Array.from(sectors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2);

        if (topSectors.length >= 2) {
          insights.push(
            `Sectors most interlinked are ${topSectors[0][0]} and ${topSectors[1][0]}, showing strong cross-sector dependencies.`
          );
        }
      }

      // Sector-level insights
      if (mode === "sector" && correlationMatrix) {
        const avgCorrelation = correlationMatrix.matrix
          .flat()
          .filter((v, i, arr) => {
            const row = Math.floor(i / correlationMatrix.symbols.length);
            const col = i % correlationMatrix.symbols.length;
            return row !== col;
          })
          .reduce((sum, val) => sum + Math.abs(val), 0) / 
          (correlationMatrix.symbols.length * (correlationMatrix.symbols.length - 1));

        if (avgCorrelation > 0.6) {
          insights.push(
            `Sector indices show strong co-movement (avg correlation: ${avgCorrelation.toFixed(2)}), indicating synchronized market movements.`
          );
        }
      }
    }

    // Shock simulation insights
    if (shockSimulation) {
      const topImpact = shockSimulation.impacts[0];
      if (topImpact) {
        insights.push(
          `A ${shockSimulation.shockMagnitude}% shock in ${shockSimulation.shockSymbol.replace('.NS', '')} impacts ${shockSimulation.totalAffected} ${mode === "stock" ? "stocks" : "sectors"}, with maximum impact of ${shockSimulation.maxImpact.toFixed(2)}%.`
        );
      }

      if (shockSimulation.totalAffected > networkGraph?.nodes.length! * 0.5) {
        insights.push(
          `This indicates systemic vulnerability in the market, with shock propagation affecting more than 50% of the network.`
        );
      }
    }

    // Time range insight
    insights.push(
      `Analysis based on ${timeRange} of historical data, providing ${timeRange.includes('Y') ? 'long-term' : timeRange.includes('M') && parseInt(timeRange) >= 6 ? 'medium-term' : 'short-term'} market perspective.`
    );

    return insights.length > 0 ? insights : [
      "Run analysis to generate insights about market connectivity and systemic risk."
    ];
  };

  const insights = generateInsights();

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
            className="flex gap-2 p-3 bg-blue-50 rounded-md border-l-4 border-blue-500"
          >
            <div className="flex-shrink-0 mt-0.5">
              {idx === 0 && <TrendingUp className="w-4 h-4 text-blue-600" />}
              {idx === 1 && <Network className="w-4 h-4 text-blue-600" />}
              {idx === 2 && <AlertCircle className="w-4 h-4 text-blue-600" />}
              {idx > 2 && <div className="w-4 h-4 rounded-full bg-blue-600" />}
            </div>
            <p className="text-sm text-gray-700 flex-1">{insight}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Insights;

