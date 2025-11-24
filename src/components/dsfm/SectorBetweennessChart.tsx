import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SectorBetweennessChartProps {
  networkGraph: NetworkGraph | null;
  loading?: boolean;
}

interface SectorData {
  sector: string;
  totalBetweenness: number;
  stockCount: number;
  stocks: Array<{ symbol: string; betweenness: number }>;
}

const SectorBetweennessChart = ({ networkGraph, loading }: SectorBetweennessChartProps) => {
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [chartData, setChartData] = useState<Array<Record<string, any>>>([]);
  const [interpretation, setInterpretation] = useState("");

  useEffect(() => {
    if (!networkGraph || loading) {
      setSectorData([]);
      setChartData([]);
      return;
    }

    // Group by sector
    const sectorMap = new Map<string, Array<{ symbol: string; betweenness: number }>>();
    
    networkGraph.nodes.forEach(node => {
      const sector = node.sector || "Unknown";
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, []);
      }
      sectorMap.get(sector)!.push({
        symbol: node.label,
        betweenness: node.betweenness
      });
    });

    // Calculate totals and prepare data
    const sectors: SectorData[] = Array.from(sectorMap.entries()).map(([sector, stocks]) => ({
      sector,
      totalBetweenness: stocks.reduce((sum, s) => sum + s.betweenness, 0),
      stockCount: stocks.length,
      stocks: stocks.sort((a, b) => b.betweenness - a.betweenness)
    })).sort((a, b) => b.totalBetweenness - a.totalBetweenness);

    setSectorData(sectors);

    // Prepare chart data - stacked by individual stocks
    const chartDataArray: Array<Record<string, any>> = [];
    const maxStocks = Math.max(...sectors.map(s => s.stocks.length));
    
    // Create a row for each "position" in the stack
    for (let i = 0; i < maxStocks; i++) {
      const row: Record<string, any> = { position: i };
      sectors.forEach(sector => {
        if (i < sector.stocks.length) {
          row[sector.sector] = sector.stocks[i].betweenness;
        } else {
          row[sector.sector] = 0;
        }
      });
      chartDataArray.push(row);
    }

    setChartData(chartDataArray);

    // Generate interpretation
    if (sectors.length > 0) {
      const topSector = sectors[0];
      const interpretationText = `The ${topSector.sector} sector contributes the highest total betweenness (${topSector.totalBetweenness.toFixed(3)}) with ${topSector.stockCount} ${topSector.stockCount === 1 ? 'stock' : 'stocks'}, indicating it plays a critical bridging role in the market network.`;
      setInterpretation(interpretationText);
    }
  }, [networkGraph, loading]);

  // Color palette for sectors
  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#ef4444", "#06b6d4", "#84cc16", "#6366f1", "#14b8a6",
    "#f97316", "#a855f7"
  ];

  if (loading || !networkGraph) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  if (sectorData.length === 0) {
    return (
      <Card className="p-4">
        <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
          No sector data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">Sector Betweenness Contribution</CardTitle>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Stacked bar showing total betweenness per sector. Each segment represents a stock's contribution.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sectorData.map(s => ({
                sector: s.sector,
                totalBetweenness: s.totalBetweenness,
                stockCount: s.stockCount
              }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#666" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="sector" 
                stroke="#666" 
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    const sectorInfo = sectorData.find(s => s.sector === data.sector);
                    return (
                      <div className="bg-white border rounded-lg shadow-lg p-3 border-gray-200">
                        <p className="text-sm font-semibold">{data.sector}</p>
                        <p className="text-xs text-gray-600">
                          Total Betweenness: {data.totalBetweenness.toFixed(3)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Stocks: {data.stockCount}
                        </p>
                        {sectorInfo && sectorInfo.stocks.length > 0 && (
                          <div className="mt-2 pt-2 border-t text-xs">
                            <p className="font-medium mb-1">Top Contributors:</p>
                            {sectorInfo.stocks.slice(0, 3).map((stock, idx) => (
                              <p key={idx} className="text-gray-600">
                                {stock.symbol}: {stock.betweenness.toFixed(3)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="totalBetweenness" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Sector-wise interpretation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 leading-relaxed">{interpretation}</p>
        </div>
        
        {/* Top sectors table */}
        <div className="text-xs">
          <p className="font-semibold mb-2">Top Contributing Sectors:</p>
          <div className="space-y-1">
            {sectorData.slice(0, 5).map((sector, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-700">{idx + 1}. {sector.sector}</span>
                <span className="font-medium text-gray-900">
                  {sector.totalBetweenness.toFixed(3)} ({sector.stockCount} stocks)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorBetweennessChart;

