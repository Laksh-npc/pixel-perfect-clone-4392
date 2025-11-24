import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { NetworkGraph, calculatePathLengthDistribution, EdgeConstructionMode } from "@/services/dsfm/networkEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PathLengthDistributionProps {
  correlationMatrix: CorrelationMatrix | null;
  networkGraph: NetworkGraph | null;
  loading?: boolean;
}

const PathLengthDistribution = ({
  correlationMatrix,
  networkGraph,
  loading
}: PathLengthDistributionProps) => {
  const [distributionData, setDistributionData] = useState<Array<{ length: string; frequency: number }>>([]);
  const [meanPathLength, setMeanPathLength] = useState(0);

  useEffect(() => {
    if (!correlationMatrix || !networkGraph || loading) {
      setDistributionData([]);
      setMeanPathLength(0);
      return;
    }

    const distribution = calculatePathLengthDistribution(
      correlationMatrix,
      networkGraph.edges,
      networkGraph.metadata?.edgeMode === "full",
      networkGraph.distanceMatrix
    );

    // Convert to chart data
    const sortedEntries = Array.from(distribution.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([length, frequency]) => ({
        length: length.toString(),
        frequency
      }));

    setDistributionData(sortedEntries);

    // Calculate mean
    let totalLength = 0;
    let totalCount = 0;
    distribution.forEach((frequency, length) => {
      totalLength += length * frequency;
      totalCount += frequency;
    });
    const mean = totalCount > 0 ? totalLength / totalCount : 0;
    setMeanPathLength(mean);
  }, [correlationMatrix, networkGraph, loading]);

  if (loading || !correlationMatrix || !networkGraph) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  if (distributionData.length === 0) {
    return (
      <Card className="p-4">
        <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
          No path length data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Shortest Path Length Distribution</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Shows frequency of shortest path lengths between all node pairs. Lower mean indicates better connectivity.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="text-xs text-gray-600">
            Mean: <span className="font-semibold text-gray-900">{meanPathLength.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="length" 
                stroke="#666"
                tick={{ fontSize: 12 }}
                label={{ value: 'Path Length', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fontSize: 12 }}
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 border-gray-200">
                        <p className="text-sm font-semibold">Path Length: {data.length}</p>
                        <p className="text-xs text-gray-600">Frequency: {data.frequency}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="frequency" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Interpretation */}
        <div className="mt-3 text-xs text-gray-600">
          {meanPathLength < 2 ? (
            <p className="text-green-700">
              ✓ Low mean path length indicates strong connectivity and efficient information flow.
            </p>
          ) : meanPathLength < 3 ? (
            <p className="text-blue-700">
              → Moderate path length suggests balanced network structure.
            </p>
          ) : (
            <p className="text-orange-700">
              ⚠ Higher path length indicates fragmented network with isolated clusters.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PathLengthDistribution;

