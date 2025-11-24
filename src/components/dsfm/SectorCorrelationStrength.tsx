/**
 * Sector Correlation Strength Plot
 * Bar chart of each sector's average correlation with all other sectors
 */

import { Card } from "@/components/ui/card";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface SectorCorrelationStrengthProps {
  correlationMatrix: CorrelationMatrix | null;
  loading?: boolean;
  mode: "stock" | "sector";
}

const SectorCorrelationStrength = ({ correlationMatrix, loading, mode }: SectorCorrelationStrengthProps) => {
  const getData = () => {
    if (!correlationMatrix) return [];
    
    const n = correlationMatrix.symbols.length;
    const data = correlationMatrix.symbols.map((symbol, idx) => {
      let sumCorr = 0;
      let count = 0;
      
      for (let j = 0; j < n; j++) {
        if (j !== idx) {
          sumCorr += Math.abs(correlationMatrix.matrix[idx][j]);
          count++;
        }
      }
      
      const avgCorr = count > 0 ? sumCorr / count : 0;
      
      return {
        sector: symbol.replace('.NS', ''),
        avgCorrelation: avgCorr,
        connectivity: avgCorr > 0.6 ? "High" : avgCorr > 0.4 ? "Medium" : "Low"
      };
    });
    
    return data.sort((a, b) => b.avgCorrelation - a.avgCorrelation);
  };

  const data = getData();
  
  const getColor = (connectivity: string) => {
    switch (connectivity) {
      case "High": return "#ef4444"; // red
      case "Medium": return "#f59e0b"; // orange
      default: return "#6b7280"; // gray
    }
  };

  if (loading || !correlationMatrix) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Sector External Connectivity</h3>
        <p className="text-xs text-gray-500">
          High connectivity = shock transmitter. Average correlation with all other {mode === "sector" ? "sectors" : "stocks"}.
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 1]} />
          <YAxis dataKey="sector" type="category" width={90} tick={{ fontSize: 11 }} />
          <Tooltip 
            formatter={(value: number) => value.toFixed(3)}
            labelStyle={{ color: '#000' }}
          />
          <Bar dataKey="avgCorrelation" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.connectivity)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SectorCorrelationStrength;

