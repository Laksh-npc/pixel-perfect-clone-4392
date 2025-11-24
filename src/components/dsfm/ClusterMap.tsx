/**
 * Cluster Map / Communities
 * Louvain community detection with cluster visualization
 */

import { Card } from "@/components/ui/card";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { computeSectorClusters, ClusterAnalysis } from "@/services/dsfm/opt/sectorClusters";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ClusterMapProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  loading?: boolean;
  mode: "stock" | "sector";
}

const ClusterMap = ({ networkGraph, correlationMatrix, loading, mode }: ClusterMapProps) => {
  const [clusterAnalysis, setClusterAnalysis] = useState<ClusterAnalysis | null>(null);

  useEffect(() => {
    if (!networkGraph || !correlationMatrix || loading) {
      setClusterAnalysis(null);
      return;
    }

    // Use requestIdleCallback for heavy computation
    const computeClusters = () => {
      const analysis = computeSectorClusters(correlationMatrix, networkGraph);
      setClusterAnalysis(analysis);
    };

    // Use requestIdleCallback for heavy computation, fallback to setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(computeClusters, { timeout: 2000 });
    } else {
      setTimeout(computeClusters, 0);
    }
  }, [networkGraph, correlationMatrix, loading]);

  const clusterColors = useMemo(() => {
    const colors = [
      "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
      "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
    ];
    return colors;
  }, []);

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[500px] w-full" />
      </Card>
    );
  }

  if (!clusterAnalysis) {
    return (
      <Card className="p-4">
        <div className="h-[500px] flex items-center justify-center text-gray-500 text-sm">
          Computing clusters...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Cluster Map / Communities</h3>
        <p className="text-xs text-gray-500">
          Louvain community detection based on modularity. {clusterAnalysis.numClusters} clusters detected.
        </p>
      </div>

      {/* Cluster Report */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-md text-center">
            <div className="text-xs text-blue-600 mb-1"># Clusters</div>
            <div className="text-2xl font-bold text-blue-900">{clusterAnalysis.numClusters}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-md text-center">
            <div className="text-xs text-green-600 mb-1">Modularity</div>
            <div className="text-2xl font-bold text-green-900">{clusterAnalysis.modularity.toFixed(3)}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-md text-center">
            <div className="text-xs text-purple-600 mb-1">Avg Internal Corr</div>
            <div className="text-2xl font-bold text-purple-900">
              {clusterAnalysis.clusterInfo.length > 0
                ? (clusterAnalysis.clusterInfo.reduce((sum, c) => sum + c.avgInternalCorrelation, 0) / 
                   clusterAnalysis.clusterInfo.length).toFixed(3)
                : "0.000"}
            </div>
          </div>
        </div>

        {/* Cluster Members */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Cluster Members</h4>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Internal Corr</TableHead>
                  <TableHead className="text-right">External Corr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusterAnalysis.clusterInfo.map((cluster, idx) => (
                  <TableRow key={cluster.clusterId}>
                    <TableCell>
                      <Badge 
                        style={{ backgroundColor: clusterColors[idx % clusterColors.length] }}
                        className="text-white"
                      >
                        Cluster {cluster.clusterId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cluster.members.slice(0, 5).map(member => (
                          <span key={member} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {member.replace('.NS', '')}
                          </span>
                        ))}
                        {cluster.members.length > 5 && (
                          <span className="text-xs text-gray-500">+{cluster.members.length - 5}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {cluster.avgInternalCorrelation.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {cluster.avgExternalCorrelation.toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Inter-cluster correlation strength */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Inter-Cluster Correlation Strength</h4>
          <div className="text-xs text-gray-600 space-y-1">
            {clusterAnalysis.clusterInfo.map((cluster, idx) => (
              <div key={cluster.clusterId} className="flex items-center gap-2">
                <Badge 
                  style={{ backgroundColor: clusterColors[idx % clusterColors.length] }}
                  className="text-white w-20 justify-center"
                >
                  Cluster {cluster.clusterId}
                </Badge>
                <span>
                  Internal: {cluster.avgInternalCorrelation.toFixed(3)} | 
                  External: {cluster.avgExternalCorrelation.toFixed(3)} | 
                  {cluster.avgInternalCorrelation > cluster.avgExternalCorrelation ? "✓ Well-defined" : "⚠ Weak boundaries"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClusterMap;

