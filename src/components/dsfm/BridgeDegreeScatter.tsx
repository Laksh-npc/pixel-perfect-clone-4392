import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BridgeDegreeScatterProps {
  networkGraph: NetworkGraph | null;
  loading?: boolean;
}

const BridgeDegreeScatter = ({ networkGraph, loading }: BridgeDegreeScatterProps) => {
  const [scatterData, setScatterData] = useState<Array<{ degree: number; betweenness: number; symbol: string; sector?: string }>>([]);
  const [outliers, setOutliers] = useState<Array<{ degree: number; betweenness: number; symbol: string }>>([]);

  useEffect(() => {
    if (!networkGraph || loading) {
      setScatterData([]);
      setOutliers([]);
      return;
    }

    const data = networkGraph.nodes.map(node => ({
      degree: node.degree,
      betweenness: node.betweenness,
      symbol: node.label,
      sector: node.sector
    }));

    setScatterData(data);

    // Identify outliers: high betweenness but low degree (or vice versa)
    const sortedByBetweenness = [...data].sort((a, b) => b.betweenness - a.betweenness);
    const sortedByDegree = [...data].sort((a, b) => b.degree - a.degree);
    
    // Find nodes with high betweenness but relatively low degree
    const topBetweenness = sortedByBetweenness.slice(0, 5);
    const topDegree = sortedByDegree.slice(0, 5);
    
    // Outliers are nodes in top 5 by betweenness but not in top 10 by degree
    const degreeTop10 = new Set(sortedByDegree.slice(0, 10).map(d => d.symbol));
    const outliersList = topBetweenness
      .filter(node => !degreeTop10.has(node.symbol))
      .slice(0, 5);
    
    setOutliers(outliersList);
  }, [networkGraph, loading]);

  // Color by sector
  const getColor = (sector?: string): string => {
    const colors: Record<string, string> = {
      "Information Technology": "#3b82f6",
      "Banking": "#10b981",
      "Automotive": "#f59e0b",
      "Pharmaceuticals": "#8b5cf6",
      "FMCG": "#ec4899",
      "Energy": "#ef4444",
      "Financial Services": "#06b6d4",
      "Realty": "#84cc16",
      "Metals": "#6366f1",
      "PSU Banking": "#14b8a6",
      "Construction": "#f97316",
      "Telecommunications": "#a855f7"
    };
    return colors[sector || ""] || "#6b7280";
  };

  if (loading || !networkGraph) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  if (scatterData.length === 0) {
    return (
      <Card className="p-4">
        <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Bridge vs Degree Scatter Plot</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    High betweenness + low degree = critical bridge with few connections.
                    High degree + low betweenness = well-connected but not a bridge.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          {outliers.length > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-semibold">{outliers.length}</span> outliers identified
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                dataKey="degree" 
                name="Degree"
                stroke="#666"
                tick={{ fontSize: 12 }}
                label={{ value: 'Degree Centrality', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
              />
              <YAxis 
                type="number" 
                dataKey="betweenness" 
                name="Betweenness"
                stroke="#666"
                tick={{ fontSize: 12 }}
                label={{ value: 'Betweenness Centrality', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    const isOutlier = outliers.some(o => o.symbol === data.symbol);
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 border-gray-200">
                        <p className="text-sm font-semibold">{data.symbol}</p>
                        <p className="text-xs text-gray-600">
                          Degree: {data.degree}
                        </p>
                        <p className="text-xs text-gray-600">
                          Betweenness: {data.betweenness.toFixed(3)}
                        </p>
                        {data.sector && (
                          <p className="text-xs text-gray-600">
                            Sector: {data.sector}
                          </p>
                        )}
                        {isOutlier && (
                          <p className="text-xs text-orange-600 font-medium mt-1">
                            ⚠ Outlier: High betweenness, low degree
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter dataKey="betweenness" fill="#3b82f6">
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry.sector)}
                    stroke={outliers.some(o => o.symbol === entry.symbol) ? "#ef4444" : "none"}
                    strokeWidth={outliers.some(o => o.symbol === entry.symbol) ? 2 : 0}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Outliers list */}
        {outliers.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-orange-900 mb-2">
              Top Outliers (High Betweenness, Low Degree):
            </p>
            <div className="space-y-1">
              {outliers.map((outlier, idx) => {
                const fullNode = networkGraph.nodes.find(n => n.label === outlier.symbol);
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-orange-800 font-medium">{idx + 1}. {outlier.symbol}</span>
                    <div className="flex gap-3 text-gray-600">
                      <span>Degree: {outlier.degree}</span>
                      <span>Betweenness: {outlier.betweenness.toFixed(3)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-orange-700 mt-2">
              These stocks are critical bridges despite having fewer direct connections.
            </p>
          </div>
        )}
        
        {/* Interpretation */}
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Quadrant Analysis:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li><strong>Top-Right:</strong> High degree + high betweenness = Super-connectors</li>
            <li><strong>Top-Left:</strong> Low degree + high betweenness = Critical bridges (outliers)</li>
            <li><strong>Bottom-Right:</strong> High degree + low betweenness = Well-connected but not bridges</li>
            <li><strong>Bottom-Left:</strong> Low degree + low betweenness = Peripheral nodes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BridgeDegreeScatter;

