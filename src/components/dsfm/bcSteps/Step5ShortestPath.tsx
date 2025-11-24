import { useMemo, useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { performBFSForBrandes } from "@/services/dsfm/bcStepByStep";
import { Info } from "lucide-react";

interface Step5ShortestPathProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  loading: boolean;
}

const Step5ShortestPath = ({ networkGraph, correlationMatrix, loading }: Step5ShortestPathProps) => {
  const [selectedSource, setSelectedSource] = useState<string>("");
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<any>(null);

  // Initialize source selection
  useEffect(() => {
    if (correlationMatrix && !selectedSource && correlationMatrix.symbols.length > 0) {
      setSelectedSource(correlationMatrix.symbols[0]);
    }
  }, [correlationMatrix, selectedSource]);

  // Perform BFS for selected source
  const bfsData = useMemo(() => {
    if (!selectedSource || !networkGraph || !correlationMatrix) return null;
    
    try {
      return performBFSForBrandes(selectedSource, networkGraph, correlationMatrix);
    } catch (error) {
      console.error("Error performing BFS:", error);
      return null;
    }
  }, [selectedSource, networkGraph, correlationMatrix]);

  // Visualize BFS tree
  useEffect(() => {
    if (!bfsData || !networkGraph || !networkRef.current || loading) return;

    // Dynamically import vis-network
    import("vis-network").then((vis) => {
      if (!networkRef.current) return;

      // Only show reachable nodes
      const reachableNodes = networkGraph.nodes.filter(node => {
        const dist = bfsData.dist.get(node.id) ?? -1;
        return dist >= 0;
      });

      const pastelColors = ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#fbcfe8', '#fed7aa', '#fde68a', '#a7f3d0', '#bae6fd'];

      const nodes = reachableNodes.map(node => {
        const dist = bfsData.dist.get(node.id) ?? 0;
        const sigma = bfsData.sigma.get(node.id) ?? 0;
        const isSource = node.id === bfsData.source;
        const layer = Array.from(bfsData.layers.entries())
          .find(([_, nodes]) => nodes.includes(node.id))?.[0] ?? 0;

        return {
          id: node.id,
          label: node.label,
          value: isSource ? 20 : 14, // Reduced by 20% (was 25 and 18)
          title: `${node.label}\nDistance: ${dist}\nSigma (σ): ${sigma}`,
          color: {
            background: isSource 
              ? '#f87171' 
              : pastelColors[layer % pastelColors.length],
            border: isSource ? '#dc2626' : '#6366f1',
            highlight: { border: '#4f46e5' }
          },
          level: layer
        };
      });

      // Only show edges that are part of the BFS tree
      const treeEdges = networkGraph.edges.filter(edge => {
        const fromDist = bfsData.dist.get(edge.from) ?? -1;
        const toDist = bfsData.dist.get(edge.to) ?? -1;
        
        return fromDist >= 0 && toDist >= 0 && Math.abs(fromDist - toDist) === 1 &&
               (bfsData.predecessors.get(edge.to)?.includes(edge.from) ||
                bfsData.predecessors.get(edge.from)?.includes(edge.to));
      });

      const edges = treeEdges.map(edge => ({
        from: edge.from,
        to: edge.to,
        color: {
          color: '#a5b4fc',
          opacity: 0.5,
          highlight: '#6366f1'
        },
        width: 1
      }));

      const data = { nodes, edges };
      const options = {
        nodes: {
          shape: 'dot',
          font: { size: 10, color: '#374151' },
          borderWidth: 1.5
        },
        edges: {
          width: 1,
          smooth: { type: 'continuous', roundness: 0.5 }
        },
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            levelSeparation: 60, // Compressed height
            nodeSpacing: 100,
            treeSpacing: 100
          }
        },
        physics: {
          enabled: false
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
          zoomView: false, // Fixed zoom
          dragView: false // No panning
        }
      };

      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }

      networkInstanceRef.current = new vis.Network(networkRef.current, data, options);
    });
  }, [bfsData, networkGraph, loading]);

  // Get top 20 reachable nodes for table
  const distanceTableData = useMemo(() => {
    if (!bfsData) return [];
    
    return Array.from(bfsData.dist.entries())
      .filter(([_, dist]) => dist >= 0)
      .map(([node, dist]) => ({
        node,
        distance: dist,
        sigma: bfsData.sigma.get(node) ?? 0
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Top 20 only
  }, [bfsData]);

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 5: Shortest Path Explainer (Brandes BFS Phase)</h3>
        <p className="text-sm text-gray-500">Loading data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 5: Shortest Path Explainer (Brandes BFS Phase)</h3>
        <p className="text-sm text-gray-600 mb-3">
          In Step 5, we perform BFS from the selected source node to compute: Distance to every node, 
          Number of shortest paths (σ), and BFS layering (used later in dependency back-propagation). 
          This is Phase-1 of the Brandes centrality algorithm.
        </p>
      </div>

      {/* Source Selection */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Select Source Node:</Label>
        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {correlationMatrix.symbols.map(symbol => (
              <SelectItem key={symbol} value={symbol}>
                {symbol.replace('.NS', '')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* BFS Tree Visualization */}
      {bfsData && (
        <div>
          <h4 className="text-sm font-semibold mb-2">BFS Tree Visualization</h4>
          <div 
            ref={networkRef} 
            className="w-full border rounded-md flex items-center justify-center"
            style={{ height: '350px' }}
          />
          <Card className="mt-2 p-2 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                Red node = source. Node colors represent BFS level. Hover to see Distance and Sigma (σ) values.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* BFS Levels and Distance Table - Side by side on large screens */}
      {bfsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* BFS Levels */}
          <div>
            <h4 className="text-sm font-semibold mb-2">BFS Levels</h4>
            <div className="space-y-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {Array.from(bfsData.layers.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([level, nodes]) => (
                  <div key={level} className="p-2 bg-gray-50 rounded-md">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Level {level} (Distance = {level}):</div>
                    <div className="flex flex-wrap gap-1.5">
                      {nodes.map(node => (
                        <span 
                          key={node} 
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px]"
                        >
                          {node.replace('.NS', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Distance Table */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Distance Table (Top 20)</h4>
            <div className="border rounded-md" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Node</TableHead>
                    <TableHead className="text-right text-xs">Distance</TableHead>
                    <TableHead className="text-right text-xs">σ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distanceTableData.map((item) => (
                    <TableRow key={item.node} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-xs">{item.node.replace('.NS', '')}</TableCell>
                      <TableCell className="text-right text-xs">{item.distance}</TableCell>
                      <TableCell className="text-right text-xs">{item.sigma}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Step5ShortestPath;
