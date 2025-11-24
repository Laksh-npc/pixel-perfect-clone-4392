import { useMemo, useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetworkGraph, buildNetworkGraph, EdgeConstructionMode } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";

interface Step4GraphConstructionProps {
  correlationMatrix: CorrelationMatrix | null;
  sectorMap: Map<string, string>;
  loading: boolean;
}

const Step4GraphConstruction = ({ correlationMatrix, sectorMap, loading }: Step4GraphConstructionProps) => {
  const [threshold, setThreshold] = useState(0.5);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<any>(null);

  // Initialize selected stocks (first 15)
  useEffect(() => {
    if (correlationMatrix && selectedStocks.length === 0) {
      setSelectedStocks(correlationMatrix.symbols.slice(0, 15));
    }
  }, [correlationMatrix, selectedStocks.length]);

  // Build filtered correlation matrix for selected stocks
  const filteredMatrix = useMemo(() => {
    if (!correlationMatrix || selectedStocks.length === 0) return null;

    const indices = selectedStocks.map(symbol => correlationMatrix.symbols.indexOf(symbol));
    const filteredSymbols = selectedStocks;
    const filteredMatrixData: number[][] = [];

    indices.forEach(i => {
      const row: number[] = [];
      indices.forEach(j => {
        row.push(correlationMatrix.matrix[i][j]);
      });
      filteredMatrixData.push(row);
    });

    return {
      symbols: filteredSymbols,
      matrix: filteredMatrixData
    };
  }, [correlationMatrix, selectedStocks]);

  // Build graph based on threshold only
  const graph = useMemo(() => {
    if (!filteredMatrix) return null;
    return buildNetworkGraph(filteredMatrix, threshold, sectorMap, "threshold", 3);
  }, [filteredMatrix, threshold, sectorMap]);

  // Degree distribution
  const degreeDistribution = useMemo(() => {
    if (!graph) return [];
    
    const degrees = graph.nodes.map(n => n.degree);
    const bins: { [key: number]: number } = {};
    
    degrees.forEach(deg => {
      bins[deg] = (bins[deg] || 0) + 1;
    });
    
    return Object.entries(bins)
      .map(([degree, count]) => ({
        degree: parseInt(degree),
        count
      }))
      .sort((a, b) => a.degree - b.degree);
  }, [graph]);

  // Render network graph
  useEffect(() => {
    if (!graph || !networkRef.current || loading) return;

    // Dynamically import vis-network
    import("vis-network").then((vis) => {
      if (!networkRef.current) return;

      const pastelColors = ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#fbcfe8', '#fed7aa', '#fde68a', '#a7f3d0', '#bae6fd', '#ddd6fe', '#fce7f3'];

      const nodes = graph.nodes.map((node, idx) => ({
        id: node.id,
        label: node.label,
        value: 15 + node.degree * 2,
        title: `${node.label}\nDegree: ${node.degree}`,
        color: {
          background: pastelColors[idx % pastelColors.length],
          border: '#6366f1',
          highlight: { border: '#4f46e5', background: pastelColors[idx % pastelColors.length] }
        }
      }));

      const edges = graph.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        value: edge.weight,
        title: `Correlation: ${edge.correlation.toFixed(3)}`,
        color: {
          color: edge.correlation >= 0 ? '#a5b4fc' : '#f9a8d4',
          opacity: 0.4,
          highlight: '#6366f1'
        },
        width: 0.5
      }));

      const data = { nodes, edges };
      const options = {
        nodes: {
          shape: 'dot',
          font: { size: 11, color: '#374151' },
          borderWidth: 1.5
        },
        edges: {
          width: 0.5,
          smooth: { type: 'continuous', roundness: 0.5 }
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

      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }

      networkInstanceRef.current = new vis.Network(networkRef.current, data, options);
    });
  }, [graph, loading]);

  if (loading || !correlationMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 4: Graph Construction</h3>
        <p className="text-sm text-gray-500">Loading graph...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 4: Graph Construction</h3>
        <p className="text-sm text-gray-600 mb-4">
          We construct a network graph where nodes are stocks and edges represent correlations above a threshold.
          For clarity, we'll work with 15 selected stocks.
        </p>
      </div>

      {/* Stock Selection Info */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Selected Stocks (15):</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedStocks.map((symbol) => (
            <span key={symbol} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {symbol.replace('.NS', '')}
            </span>
          ))}
        </div>
      </div>

      {/* Threshold Control */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Correlation Threshold: {threshold.toFixed(2)}
        </Label>
        <Slider
          value={[threshold]}
          onValueChange={(vals) => setThreshold(vals[0])}
          min={0.1}
          max={0.9}
          step={0.05}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Stocks with correlation above this threshold will be connected in the graph.
        </p>
      </div>

      {/* Graph Stats */}
      {graph && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="text-xs text-blue-600 font-medium">Nodes</div>
            <div className="text-2xl font-bold text-blue-900">{graph.nodes.length}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-md">
            <div className="text-xs text-purple-600 font-medium">Edges</div>
            <div className="text-2xl font-bold text-purple-900">{graph.edges.length}</div>
          </div>
          <div className="p-3 bg-pink-50 rounded-md">
            <div className="text-xs text-pink-600 font-medium">Density</div>
            <div className="text-2xl font-bold text-pink-900">
              {graph.metadata?.density ? (graph.metadata.density * 100).toFixed(1) + '%' : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Network Visualization */}
      {graph && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Network Graph Visualization</h4>
          <div 
            ref={networkRef} 
            className="w-full border rounded-md"
            style={{ height: '400px' }}
          />
          <Card className="mt-3 p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <strong>Explanation:</strong> Each node represents a stock. Node size indicates degree (number of connections). 
                Edges connect stocks with correlations above the threshold. Blue edges = positive correlation, pink edges = negative correlation.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Degree Distribution */}
      {graph && degreeDistribution.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Degree Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={degreeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="degree" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Degree', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={{ value: 'Number of Nodes', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#c4b5fd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default Step4GraphConstruction;
