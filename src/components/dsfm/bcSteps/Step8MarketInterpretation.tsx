import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { Info } from "lucide-react";

interface Step8MarketInterpretationProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  loading: boolean;
}

const Step8MarketInterpretation = ({ networkGraph, correlationMatrix, loading }: Step8MarketInterpretationProps) => {
  // Generate market interpretations
  const interpretations = useMemo(() => {
    if (!networkGraph) return [];

    const topBC = networkGraph.nodes
      .sort((a, b) => b.betweenness - a.betweenness)
      .slice(0, 10);

    const bridgeStocks = topBC.filter(node => {
      const avgDegree = networkGraph.nodes.reduce((sum, n) => sum + n.degree, 0) / networkGraph.nodes.length;
      return node.betweenness > 0.1 && node.degree < avgDegree * 1.5;
    });

    const criticalConnectors = topBC.filter(node => {
      const avgDegree = networkGraph.nodes.reduce((sum, n) => sum + n.degree, 0) / networkGraph.nodes.length;
      return node.betweenness > 0.1 && node.degree >= avgDegree * 1.5;
    });

    const interpretations: Array<{ type: string; title: string; description: string; stocks: string[] }> = [];

    if (bridgeStocks.length > 0) {
      interpretations.push({
        type: 'bridge',
        title: 'Bridge Stocks',
        description: 'These stocks have high betweenness centrality but relatively few direct connections. They act as critical bridges between different market segments, making them key channels for shock propagation.',
        stocks: bridgeStocks.map(n => n.label)
      });
    }

    if (criticalConnectors.length > 0) {
      interpretations.push({
        type: 'connector',
        title: 'Critical Connectors',
        description: 'These stocks have both high betweenness and high degree centrality. They are super-connectors that link multiple market segments and are central to market stability.',
        stocks: criticalConnectors.map(n => n.label)
      });
    }

    const topCorrelations = networkGraph.edges
      .filter(e => Math.abs(e.correlation) > 0.7)
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 5);

    if (topCorrelations.length > 0) {
      const channelStocks = new Set<string>();
      topCorrelations.forEach(edge => {
        channelStocks.add(edge.from);
        channelStocks.add(edge.to);
      });

      interpretations.push({
        type: 'contagion',
        title: 'Contagion Channels',
        description: 'These stock pairs show very high correlation (>0.7), creating strong contagion channels. Shocks to one stock in these pairs will likely propagate quickly to the other.',
        stocks: Array.from(channelStocks).map(s => s.replace('.NS', ''))
      });
    }

    return interpretations;
  }, [networkGraph]);

  // Generate summary analysis
  const summaryAnalysis = useMemo(() => {
    if (!networkGraph || !correlationMatrix) return '';

    const avgBC = networkGraph.nodes.reduce((sum, n) => sum + n.betweenness, 0) / networkGraph.nodes.length;
    const maxBC = Math.max(...networkGraph.nodes.map(n => n.betweenness));
    const topNode = networkGraph.nodes.find(n => n.betweenness === maxBC);
    const networkDensity = networkGraph.metadata?.density || 0;
    const avgShortestPath = networkGraph.metadata?.avgShortestPath || 0;

    return `
The network analysis reveals several key insights:

1. **Network Structure**: The market network has ${networkGraph.nodes.length} nodes and ${networkGraph.edges.length} edges, 
   with a density of ${(networkDensity * 100).toFixed(1)}%. The average shortest path length is ${avgShortestPath.toFixed(2)}, 
   indicating ${avgShortestPath < 3 ? 'strong' : avgShortestPath < 5 ? 'moderate' : 'weak'} connectivity.

2. **Centrality Distribution**: Average betweenness centrality is ${avgBC.toFixed(4)}, with the highest BC of ${maxBC.toFixed(4)} 
   belonging to ${topNode?.label || 'N/A'}. This suggests ${maxBC > 0.2 ? 'high' : maxBC > 0.1 ? 'moderate' : 'low'} 
   concentration of influence in a few key nodes.

3. **Market Implications**: 
   - Nodes with high BC are critical for market stability and shock propagation
   - Bridge stocks (high BC, low degree) are particularly vulnerable to targeted shocks
   - The network's ${networkDensity > 0.3 ? 'high' : networkDensity > 0.1 ? 'moderate' : 'low'} density suggests 
     ${networkDensity > 0.3 ? 'strong' : networkDensity > 0.1 ? 'moderate' : 'weak'} interconnections, 
     which can ${networkDensity > 0.3 ? 'amplify' : 'moderate'} shock effects.

4. **Risk Assessment**: The presence of multiple high-BC nodes creates ${maxBC > 0.2 ? 'significant' : 'moderate'} 
   systemic risk, as shocks to these nodes can propagate widely through the network.
    `.trim();
  }, [networkGraph, correlationMatrix]);

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 8: Market Interpretation Layer</h3>
        <p className="text-sm text-gray-500">Loading interpretations...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 8: Market Interpretation Layer</h3>
        <p className="text-sm text-gray-600 mb-4">
          We now interpret the betweenness centrality results in market terms, identifying bridge stocks,
          critical connectors, and contagion channels that are important for understanding market dynamics.
        </p>
      </div>

      {/* Summary Analysis */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Summary Analysis</h4>
        <div className="text-sm text-blue-800 whitespace-pre-line">
          {summaryAnalysis}
        </div>
      </Card>

      {/* Interpretations */}
      <div className="space-y-4">
        {interpretations.map((interpretation, idx) => (
          <Card key={idx} className="p-4 border-2">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                interpretation.type === 'bridge' ? 'bg-yellow-500' :
                interpretation.type === 'connector' ? 'bg-purple-500' :
                'bg-pink-500'
              }`} />
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1">{interpretation.title}</h4>
                <p className="text-xs text-gray-600 mb-3">{interpretation.description}</p>
                <div className="flex flex-wrap gap-2">
                  {interpretation.stocks.map((stock, stockIdx) => (
                    <span 
                      key={stockIdx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {stock}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Key Insights */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-green-900 mb-2">Key Insights</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Betweenness centrality identifies stocks that are critical for market connectivity</li>
              <li>Bridge stocks (high BC, low degree) are vulnerable but important for network structure</li>
              <li>High-BC sectors indicate systemic importance in market dynamics</li>
              <li>Strong correlations create contagion channels that can amplify shocks</li>
              <li>Monitoring high-BC nodes can provide early warning of systemic risk</li>
            </ul>
          </div>
        </div>
      </Card>
    </Card>
  );
};

export default Step8MarketInterpretation;
