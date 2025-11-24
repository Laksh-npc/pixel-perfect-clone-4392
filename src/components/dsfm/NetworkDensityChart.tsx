import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { buildNetworkGraph, EdgeConstructionMode } from "@/services/dsfm/networkEngine";
import { StockData } from "@/services/dsfm/dataFetcher";
import { buildCorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NetworkDensityChartProps {
  stockData: StockData[];
  mode: "stock" | "sector";
  sectorMap?: Map<string, string>;
  edgeMode: EdgeConstructionMode;
  threshold: number;
  topK: number;
}

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y";

const NetworkDensityChart = ({
  stockData,
  mode,
  sectorMap,
  edgeMode,
  threshold,
  topK
}: NetworkDensityChartProps) => {
  const [densityData, setDensityData] = useState<Array<{ period: string; density: number; edges: number; nodes: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [interpretation, setInterpretation] = useState("");

  useEffect(() => {
    const calculateDensityOverTime = () => {
      if (stockData.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const timeRanges: TimeRange[] = ["1M", "3M", "6M", "1Y", "3Y", "5Y"];
      const dataPoints: Array<{ period: string; density: number; edges: number; nodes: number }> = [];

      try {
        // Build correlation matrix from current data
        const matrix = buildCorrelationMatrix(stockData);
        
        // Build network graph with current settings
        const graph = buildNetworkGraph(matrix, threshold, sectorMap, edgeMode, topK);
        
        const nodes = graph.nodes.length;
        const edges = graph.edges.length;
        const density = graph.metadata?.density || (nodes > 1 ? (2 * edges) / (nodes * (nodes - 1)) : 0);
        
        // For simplicity, show the same density for all time ranges
        // In a real implementation, you'd fetch data for each time range
        for (const period of timeRanges) {
          dataPoints.push({
            period,
            density: isNaN(density) ? 0 : density,
            edges,
            nodes
          });
        }
      } catch (error) {
        console.warn(`Failed to calculate density:`, error);
        for (const period of timeRanges) {
          dataPoints.push({ period, density: 0, edges: 0, nodes: 0 });
        }
      }

      setDensityData(dataPoints);
      
      // Generate interpretation
      const avgDensity = dataPoints.length > 0 
        ? dataPoints.reduce((sum, d) => sum + d.density, 0) / dataPoints.length 
        : 0;
      let interpretation = "";
      
      if (avgDensity > 0.7) {
        interpretation = `High network density (${(avgDensity * 100).toFixed(1)}%) indicates a highly interconnected market where ${mode === "stock" ? "stocks" : "sectors"} move together strongly. This suggests systemic risk and potential for cascading effects.`;
      } else if (avgDensity > 0.4) {
        interpretation = `Moderate network density (${(avgDensity * 100).toFixed(1)}%) shows balanced connectivity. Some ${mode === "stock" ? "stocks" : "sectors"} are well-connected while others operate more independently.`;
      } else {
        interpretation = `Low network density (${(avgDensity * 100).toFixed(1)}%) indicates fragmented market structure. ${mode === "stock" ? "Stocks" : "Sectors"} have limited connections, suggesting more isolated movements and lower systemic risk.`;
      }
      
      setInterpretation(interpretation);
      setLoading(false);
    };

    calculateDensityOverTime();
  }, [stockData, mode, sectorMap, edgeMode, threshold, topK]);

  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">Network Density Over Time</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Density = 2E / (N×(N-1)) where E=edges, N=nodes. Higher density means more connections.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={densityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 1]}
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={(value) => value.toFixed(2)}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 border-gray-200">
                        <p className="text-sm font-semibold">{data.period}</p>
                        <p className="text-xs text-gray-600">
                          Density: {(data.density * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600">
                          Edges: {data.edges} | Nodes: {data.nodes}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="density"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Density"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Interpretation card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 leading-relaxed">{interpretation}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkDensityChart;

