/**
 * Influence vs Stability Scatter Plot
 * X-axis: Degree Centrality, Y-axis: Betweenness Centrality
 * Bubble Size: Avg correlation
 */

import { Card } from "@/components/ui/card";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InfluenceStabilityScatterProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  loading?: boolean;
  mode: "stock" | "sector";
}

const InfluenceStabilityScatter = ({ 
  networkGraph, 
  correlationMatrix, 
  loading, 
  mode 
}: InfluenceStabilityScatterProps) => {
  const getData = () => {
    if (!networkGraph || !correlationMatrix) return [];
    
    return networkGraph.nodes.map(node => {
      // Calculate average correlation for this node
      const nodeIdx = correlationMatrix.symbols.indexOf(node.id);
      let avgCorr = 0;
      if (nodeIdx !== -1) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < correlationMatrix.symbols.length; j++) {
          if (j !== nodeIdx) {
            sum += Math.abs(correlationMatrix.matrix[nodeIdx][j]);
            count++;
          }
        }
        avgCorr = count > 0 ? sum / count : 0;
      }
      
      // Determine quadrant
      const degree = node.degree || node.centrality;
      const betweenness = node.betweenness;
      const maxDegree = Math.max(...networkGraph.nodes.map(n => n.degree || n.centrality));
      const maxBetweenness = Math.max(...networkGraph.nodes.map(n => n.betweenness));
      
      let quadrant = "Peripheral";
      if (degree > maxDegree * 0.5 && betweenness > maxBetweenness * 0.5) {
        quadrant = "Super Connector";
      } else if (degree <= maxDegree * 0.5 && betweenness > maxBetweenness * 0.5) {
        quadrant = "Critical Bridge";
      } else if (degree > maxDegree * 0.5 && betweenness <= maxBetweenness * 0.5) {
        quadrant = "Well Connected";
      }
      
      return {
        symbol: node.label,
        degree: degree,
        betweenness: betweenness,
        avgCorrelation: avgCorr,
        size: Math.max(50, Math.min(300, avgCorr * 300)),
        quadrant,
        sector: node.sector
      };
    });
  };

  const data = getData();
  
  const getColor = (quadrant: string) => {
    switch (quadrant) {
      case "Super Connector": return "#ef4444"; // red
      case "Critical Bridge": return "#8b5cf6"; // purple
      case "Well Connected": return "#10b981"; // green
      default: return "#6b7280"; // gray
    }
  };

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[500px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold">Influence vs Stability Scatter Plot</h3>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  <strong>Top-right:</strong> Super connectors (high degree & betweenness)<br/>
                  <strong>Top-left:</strong> Critical bridges (low degree, high betweenness)<br/>
                  <strong>Bottom-right:</strong> Well connected but not bridges<br/>
                  <strong>Bottom-left:</strong> Peripheral sectors
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-gray-500">
          Bubble size represents average correlation. X: Degree Centrality, Y: Betweenness Centrality
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="degree" 
            name="Degree Centrality"
            label={{ value: 'Degree Centrality', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number" 
            dataKey="betweenness" 
            name="Betweenness Centrality"
            label={{ value: 'Betweenness Centrality', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: number, name: string) => [value.toFixed(4), name]}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-2 border rounded shadow-lg">
                    <p className="font-medium">{data.symbol}</p>
                    <p className="text-xs">Degree: {data.degree.toFixed(2)}</p>
                    <p className="text-xs">Betweenness: {data.betweenness.toFixed(4)}</p>
                    <p className="text-xs">Avg Corr: {data.avgCorrelation.toFixed(3)}</p>
                    <p className="text-xs font-medium text-purple-600">{data.quadrant}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Sectors" data={data} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.quadrant)} />
            ))}
          </Scatter>
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            payload={[
              { value: 'Super Connector', type: 'circle', color: '#ef4444' },
              { value: 'Critical Bridge', type: 'circle', color: '#8b5cf6' },
              { value: 'Well Connected', type: 'circle', color: '#10b981' },
              { value: 'Peripheral', type: 'circle', color: '#6b7280' }
            ]}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default InfluenceStabilityScatter;

