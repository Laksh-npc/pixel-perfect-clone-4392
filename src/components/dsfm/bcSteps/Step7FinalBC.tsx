import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, FileDown } from "lucide-react";
import { Info } from "lucide-react";

interface Step7FinalBCProps {
  networkGraph: NetworkGraph | null;
  loading: boolean;
}

const Step7FinalBC = ({ networkGraph, loading }: Step7FinalBCProps) => {
  // Prepare BC ranking data
  const bcRanking = useMemo(() => {
    if (!networkGraph) return [];
    return networkGraph.nodes
      .map(node => ({
        symbol: node.label,
        betweenness: node.betweenness,
        degree: node.degree
      }))
      .sort((a, b) => b.betweenness - a.betweenness);
  }, [networkGraph]);

  // Prepare bar chart data (top 15)
  const barChartData = useMemo(() => {
    return bcRanking.slice(0, 15).map((node, idx) => ({
      symbol: node.symbol,
      betweenness: node.betweenness,
      rank: idx + 1
    }));
  }, [bcRanking]);

  // Calculate max BC for conditional coloring
  const maxBC = useMemo(() => {
    return bcRanking.length > 0 ? bcRanking[0].betweenness : 1;
  }, [bcRanking]);

  const COLORS = ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#fbcfe8', '#fed7aa', '#fde68a', '#a7f3d0', '#bae6fd', '#ddd6fe', '#fce7f3'];

  // Export to CSV
  const exportToCSV = () => {
    if (!bcRanking.length) return;

    const csvContent = [
      ["Rank", "Symbol", "Betweenness Centrality", "Degree"].join(","),
      ...bcRanking.map((node, idx) => [
        idx + 1,
        node.symbol,
        node.betweenness.toFixed(6),
        node.degree
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `betweenness_centrality_ranking_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !networkGraph) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 7: Final Betweenness Centrality</h3>
        <p className="text-sm text-gray-500">Loading data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 7: Final Betweenness Centrality</h3>
        <Card className="p-3 bg-blue-50 border-blue-200 rounded-lg shadow-sm mb-3">
          <div className="flex items-start gap-2">
            <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              This ranking is computed by aggregating all delta contributions (from Step-6) and normalizing across all nodes.
            </div>
          </div>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={exportToCSV} 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <Download className="w-3 h-3 mr-1.5" />
          Export BC Ranking (CSV)
        </Button>
      </div>

      {/* BC Ranking Table */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Betweenness Centrality Ranking</h4>
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50">
                <TableRow>
                  <TableHead className="w-[50px] text-xs font-semibold">Rank</TableHead>
                  <TableHead className="text-xs font-semibold">Symbol</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Betweenness</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Degree</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bcRanking.map((node, idx) => {
                  const isHighBC = node.betweenness > maxBC * 0.3;
                  const isLowBC = node.betweenness < maxBC * 0.1;
                  
                  return (
                    <TableRow 
                      key={node.symbol} 
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-medium text-xs">{idx + 1}</TableCell>
                      <TableCell className={`font-medium text-xs ${isLowBC ? 'text-gray-500' : ''}`}>
                        {node.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          isHighBC 
                            ? 'font-semibold text-blue-600 text-xs' 
                            : isLowBC 
                              ? 'text-gray-500 text-xs'
                              : 'text-xs'
                        }>
                          {node.betweenness.toFixed(6)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">{node.degree}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* BC Bar Chart */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Top 15 Betweenness Centrality (Bar Chart)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number"
              tick={{ fontSize: 10 }}
              label={{ value: 'Betweenness Centrality', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
            />
            <YAxis 
              type="category"
              dataKey="symbol"
              tick={{ fontSize: 10 }}
              width={80}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <Card className="p-2 bg-white border shadow-lg">
                      <p className="text-xs font-semibold">{data.symbol}</p>
                      <p className="text-xs">BC: {data.betweenness.toFixed(6)}</p>
                      <p className="text-xs text-gray-500">BC = share of all shortest paths passing through this node</p>
                    </Card>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="betweenness" radius={[0, 4, 4, 0]} barSize={20}>
              {barChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation Box */}
      <Card className="p-3 bg-green-50 border-green-200 rounded-lg shadow-sm">
        <div className="flex items-start gap-2">
          <Info className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-green-800">
            <strong>Interpretation:</strong> Nodes with high BC act as bridges and are crucial for shock transmission. 
            These nodes connect separated parts of the market network.
          </div>
        </div>
      </Card>
    </Card>
  );
};

export default Step7FinalBC;
