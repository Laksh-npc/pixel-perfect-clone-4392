import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { performBFSForBrandes, performDeltaAccumulation } from "@/services/dsfm/bcStepByStep";
import { Info } from "lucide-react";

interface Step6DependencyPropagationProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  loading: boolean;
}

const Step6DependencyPropagation = ({ networkGraph, correlationMatrix, loading }: Step6DependencyPropagationProps) => {
  const [selectedSource, setSelectedSource] = useState<string>("");

  // Initialize source selection
  useEffect(() => {
    if (correlationMatrix && !selectedSource && correlationMatrix.symbols.length > 0) {
      setSelectedSource(correlationMatrix.symbols[0]);
    }
  }, [correlationMatrix, selectedSource]);

  // Perform BFS and delta accumulation
  const bfsData = useMemo(() => {
    if (!selectedSource || !networkGraph || !correlationMatrix) return null;
    
    try {
      return performBFSForBrandes(selectedSource, networkGraph, correlationMatrix);
    } catch (error) {
      console.error("Error performing BFS:", error);
      return null;
    }
  }, [selectedSource, networkGraph, correlationMatrix]);

  const deltaSteps = useMemo(() => {
    if (!bfsData || !correlationMatrix) return [];
    return performDeltaAccumulation(bfsData, correlationMatrix);
  }, [bfsData, correlationMatrix]);

  // Get final delta values per node
  const finalDeltas = useMemo(() => {
    if (deltaSteps.length === 0) return new Map<string, number>();
    
    const deltas = new Map<string, number>();
    deltaSteps.forEach(step => {
      deltas.set(step.node, step.delta);
    });
    return deltas;
  }, [deltaSteps]);

  // Get top contributors
  const topContributors = useMemo(() => {
    return Array.from(finalDeltas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [finalDeltas]);

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 6: Dependency Back-propagation Visualization</h3>
        <p className="text-sm text-gray-500">Loading data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 6: Dependency Back-propagation Visualization</h3>
        <p className="text-sm text-gray-600 mb-4">
          In the second phase of Brandes algorithm, we accumulate dependencies (delta) from leaves back to root.
          For each node w, we update: <code className="bg-gray-100 px-2 py-1 rounded">delta[v] += (sigma[v] / sigma[w]) × (1 + delta[w])</code>
          This measures how much each node contributes to shortest paths.
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

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Top 5 Contributors to Centrality (for this source)</h4>
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex flex-wrap gap-2">
              {topContributors.map(([node, delta], idx) => (
                <div key={node} className="px-3 py-2 bg-yellow-100 rounded-md">
                  <div className="text-xs font-semibold text-yellow-900">{node.replace('.NS', '')}</div>
                  <div className="text-xs text-yellow-700">Delta: {delta.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="mt-3 p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <strong>Explanation:</strong> These nodes contribute most to the betweenness centrality calculation for this source. 
                Higher delta values mean the node lies on more shortest paths from the source to other nodes.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Dependency Table */}
      {finalDeltas.size > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Dependency Values (Delta) for Each Node</h4>
          <div className="border rounded-md max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Node</TableHead>
                  <TableHead className="text-right">Delta Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(finalDeltas.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([node, delta]) => {
                    const isTopContributor = topContributors.some(([n]) => n === node);
                    return (
                      <TableRow 
                        key={node}
                        className={isTopContributor ? 'bg-yellow-50' : ''}
                      >
                        <TableCell className="font-medium">
                          {node.replace('.NS', '')}
                          {isTopContributor && (
                            <span className="ml-2 text-xs text-yellow-600">★ Top Contributor</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isTopContributor ? 'font-semibold text-yellow-700' : ''}>
                            {delta.toFixed(4)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Explanation */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-green-800">
            <strong>How Dependency Accumulation Works:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>We start from leaves (nodes farthest from source) and work backwards</li>
              <li>For each node, we accumulate dependencies from nodes it can reach</li>
              <li>Nodes with high delta values are critical bridges in the network</li>
              <li>These delta values are summed across all sources to get final betweenness centrality</li>
            </ul>
          </div>
        </div>
      </Card>
    </Card>
  );
};

export default Step6DependencyPropagation;
