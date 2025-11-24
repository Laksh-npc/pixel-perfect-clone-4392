import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetworkGraph, getBridgePaths } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Network } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface BridgePathViewerProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  selectedNodeId: string | null;
  onNodeSelect?: (nodeId: string | null) => void;
  loading?: boolean;
}

const BridgePathViewer = ({
  networkGraph,
  correlationMatrix,
  selectedNodeId,
  onNodeSelect,
  loading
}: BridgePathViewerProps) => {
  const [bridgePaths, setBridgePaths] = useState<Array<{ from: string; to: string; path: string[]; length: number }>>([]);
  const [bridgeRoles, setBridgeRoles] = useState<Array<{ role: string; count: number; examples: string[] }>>([]);

  useEffect(() => {
    if (!selectedNodeId || !networkGraph || !correlationMatrix || loading) {
      setBridgePaths([]);
      setBridgeRoles([]);
      return;
    }

    const paths = getBridgePaths(
      selectedNodeId,
      correlationMatrix,
      networkGraph.edges,
      networkGraph.metadata?.edgeMode === "full",
      networkGraph.distanceMatrix
    );

    setBridgePaths(paths);

    // Analyze bridge roles
    const roles = new Map<string, { count: number; examples: Set<string> }>();
    
    paths.forEach(path => {
      const nodeIdx = path.path.indexOf(selectedNodeId);
      if (nodeIdx > 0 && nodeIdx < path.path.length - 1) {
        // Node is in the middle of the path
        const role = `Connects ${path.path[0].replace('.NS', '')} ↔ ${path.path[path.path.length - 1].replace('.NS', '')}`;
        if (!roles.has(role)) {
          roles.set(role, { count: 0, examples: new Set() });
        }
        const roleData = roles.get(role)!;
        roleData.count++;
        roleData.examples.add(`${path.from.replace('.NS', '')} → ${path.to.replace('.NS', '')}`);
      }
    });

    const rolesArray = Array.from(roles.entries())
      .map(([role, data]) => ({
        role,
        count: data.count,
        examples: Array.from(data.examples).slice(0, 3)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setBridgeRoles(rolesArray);
  }, [selectedNodeId, networkGraph, correlationMatrix, loading]);

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  const selectedNode = networkGraph.nodes.find(n => n.id === selectedNodeId);

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold">Bridge Path Viewer</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Click a node in the network graph to see all shortest paths it participates in as a bridge.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {selectedNodeId && (
            <Badge variant="outline" className="text-xs">
              {selectedNode?.label || selectedNodeId.replace('.NS', '')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedNodeId ? (
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Network className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Click a node in the network graph to view its bridge paths</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{bridgePaths.length}</div>
                <div className="text-xs text-blue-600">Total Paths</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {bridgePaths.length > 0 
                    ? (bridgePaths.reduce((sum, p) => sum + p.length, 0) / bridgePaths.length).toFixed(1)
                    : '0'}
                </div>
                <div className="text-xs text-green-600">Avg Path Length</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-700">{bridgeRoles.length}</div>
                <div className="text-xs text-purple-600">Bridge Roles</div>
              </div>
            </div>

            {/* Bridge Roles Table */}
            {bridgeRoles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2">Bridge Roles</h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs h-8">Role</TableHead>
                        <TableHead className="text-xs h-8 text-right">Count</TableHead>
                        <TableHead className="text-xs h-8">Examples</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bridgeRoles.map((role, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell className="text-xs py-2">{role.role}</TableCell>
                          <TableCell className="text-xs py-2 text-right font-medium">{role.count}</TableCell>
                          <TableCell className="text-xs py-2 text-gray-600">
                            {role.examples.join(', ')}
                            {role.examples.length < role.count && ` (+${role.count - role.examples.length} more)`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Paths Table */}
            {bridgePaths.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2">
                  Shortest Paths Through {selectedNode?.label || selectedNodeId.replace('.NS', '')} ({bridgePaths.length})
                </h4>
                <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50">
                      <TableRow>
                        <TableHead className="text-xs h-8">From</TableHead>
                        <TableHead className="text-xs h-8">To</TableHead>
                        <TableHead className="text-xs h-8">Path</TableHead>
                        <TableHead className="text-xs h-8 text-right">Length</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bridgePaths.slice(0, 50).map((path, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell className="text-xs py-2 font-medium">
                            {path.from.replace('.NS', '')}
                          </TableCell>
                          <TableCell className="text-xs py-2 font-medium">
                            {path.to.replace('.NS', '')}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-gray-600">
                            {path.path.map((p, i) => (
                              <span key={i}>
                                <span className={p === selectedNodeId ? "font-bold text-blue-700" : ""}>
                                  {p.replace('.NS', '')}
                                </span>
                                {i < path.path.length - 1 && <span className="mx-1">→</span>}
                              </span>
                            ))}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right">{path.length}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {bridgePaths.length > 50 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing first 50 of {bridgePaths.length} paths
                  </p>
                )}
              </div>
            )}

            {bridgePaths.length === 0 && selectedNodeId && (
              <div className="h-32 flex items-center justify-center text-gray-500 text-sm border-2 border-dashed rounded-lg">
                <p>No bridge paths found for this node</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BridgePathViewer;

