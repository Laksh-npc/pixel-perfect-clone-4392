/**
 * Shock Timeline Plot
 * Shows sector shock propagation over iterations
 */

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ShockSimulation } from "@/services/dsfm/shockEngine";
import { EnhancedShockSimulation, ShockTimeline as ShockTimelineType } from "@/services/dsfm/opt/sectorShock";

interface ShockTimelineProps {
  simulation: ShockSimulation | EnhancedShockSimulation | null;
  loading?: boolean;
  mode: "stock" | "sector";
}

const ShockTimeline = ({ simulation, loading, mode }: ShockTimelineProps) => {
  const getTimelineData = () => {
    if (!simulation) return [];
    
    // Check if it's enhanced simulation with timeline
    const enhanced = simulation as EnhancedShockSimulation;
    if (enhanced && 'timeline' in enhanced && enhanced.timeline && Array.isArray(enhanced.timeline) && enhanced.timeline.length > 0) {
      return enhanced.timeline.map(t => ({
        iteration: t.iteration,
        cumulativeImpact: t.cumulativeImpact,
        affectedCount: t.affectedCount
      }));
    }
    
    // Fallback: create single data point
    return [{
      iteration: 0,
      cumulativeImpact: simulation.averageImpact * simulation.totalAffected,
      affectedCount: simulation.totalAffected
    }];
  };

  const getNetworkWideData = () => {
    if (!simulation) return [];
    
    const enhanced = simulation as EnhancedShockSimulation;
    if (enhanced && 'networkWideImpact' in enhanced && enhanced.networkWideImpact !== undefined) {
      return [{
        metric: "Network Impact",
        value: enhanced.networkWideImpact
      }];
    }
    
    return [];
  };

  const getClusterData = () => {
    if (!simulation) return [];
    
    const enhanced = simulation as EnhancedShockSimulation;
    if (enhanced && 'mostAffectedClusters' in enhanced && enhanced.mostAffectedClusters && Array.isArray(enhanced.mostAffectedClusters) && enhanced.mostAffectedClusters.length > 0) {
      return enhanced.mostAffectedClusters.slice(0, 5).map((cluster, idx) => ({
        cluster: `Cluster ${cluster.clusterId}`,
        impact: cluster.totalImpact,
        members: cluster.members.length
      }));
    }
    
    return [];
  };

  const timelineData = getTimelineData();
  const networkData = getNetworkWideData();
  const clusterData = getClusterData();

  if (loading || !simulation) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Plot */}
      {timelineData.length > 0 && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-1">Sector Shock Timeline</h3>
            <p className="text-xs text-gray-500">
              Propagation over iterations until impact &lt; 0.5%
            </p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" label={{ value: 'Iteration', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Impact', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cumulativeImpact" 
                stroke="#ef4444" 
                name="Cumulative Impact"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="affectedCount" 
                stroke="#3b82f6" 
                name="Affected Count"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Network-wide Impact */}
      {networkData.length > 0 && (
        <Card className="p-4">
          <div className="mb-2">
            <h3 className="text-sm font-semibold">Network-Wide Cumulative Impact</h3>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {networkData[0].value.toFixed(2)}%
          </div>
        </Card>
      )}

      {/* Most Affected Clusters */}
      {clusterData.length > 0 && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-1">Most Affected Clusters</h3>
            <p className="text-xs text-gray-500">
              Clusters highlighted by shock propagation
            </p>
          </div>
          
          <div className="space-y-2">
            {clusterData.map((cluster, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-sm">{cluster.cluster}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({cluster.members} {mode === "sector" ? "sectors" : "stocks"})
                  </span>
                </div>
                <div className="font-bold text-red-600">
                  {cluster.impact.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShockTimeline;

