/**
 * Regime Switch Analyzer
 * Divides correlations into bands and shows pie chart for each time range
 */

import { Card } from "@/components/ui/card";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { computeRegimeMatrix, RegimeAnalysis } from "@/services/dsfm/opt/regimeAnalysis";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";

interface RegimeSwitchAnalyzerProps {
  correlationMatrix: CorrelationMatrix | null;
  timeRange: string;
  loading?: boolean;
  mode: "stock" | "sector";
}

const RegimeSwitchAnalyzer = ({ 
  correlationMatrix, 
  timeRange, 
  loading, 
  mode 
}: RegimeSwitchAnalyzerProps) => {
  const [regimeAnalysis, setRegimeAnalysis] = useState<RegimeAnalysis | null>(null);

  useEffect(() => {
    if (!correlationMatrix || loading) {
      setRegimeAnalysis(null);
      return;
    }

    const analysis = computeRegimeMatrix(correlationMatrix, timeRange);
    setRegimeAnalysis(analysis);
  }, [correlationMatrix, timeRange, loading]);

  const COLORS = {
    high: "#ef4444",    // red
    medium: "#f59e0b",  // orange
    low: "#6b7280"      // gray
  };

  const data = regimeAnalysis ? regimeAnalysis.bands.map(band => ({
    name: `${band.band.charAt(0).toUpperCase() + band.band.slice(1)} (${band.percentage.toFixed(1)}%)`,
    value: band.count,
    percentage: band.percentage,
    band: band.band
  })) : [];

  if (loading || !correlationMatrix) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  if (!regimeAnalysis) {
    return (
      <Card className="p-4">
        <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm">
          Computing regime analysis...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Regime Switch Analyzer</h3>
        <p className="text-xs text-gray-500">
          Correlation bands: High (&gt;0.7), Medium (0.4-0.7), Low (&lt;0.4). Time range: {timeRange}
        </p>
      </div>

      <div className="space-y-4">
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.band as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${value} pairs (${props.payload.percentage.toFixed(1)}%)`,
                name
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-red-50 rounded-md text-center">
            <div className="text-xs text-red-600 mb-1">High Correlation</div>
            <div className="text-lg font-bold text-red-900">
              {regimeAnalysis.bands.find(b => b.band === "high")?.count || 0}
            </div>
            <div className="text-xs text-red-700">
              ({regimeAnalysis.bands.find(b => b.band === "high")?.percentage.toFixed(1) || 0}%)
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded-md text-center">
            <div className="text-xs text-orange-600 mb-1">Medium Correlation</div>
            <div className="text-lg font-bold text-orange-900">
              {regimeAnalysis.bands.find(b => b.band === "medium")?.count || 0}
            </div>
            <div className="text-xs text-orange-700">
              ({regimeAnalysis.bands.find(b => b.band === "medium")?.percentage.toFixed(1) || 0}%)
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-md text-center">
            <div className="text-xs text-gray-600 mb-1">Low Correlation</div>
            <div className="text-lg font-bold text-gray-900">
              {regimeAnalysis.bands.find(b => b.band === "low")?.count || 0}
            </div>
            <div className="text-xs text-gray-700">
              ({regimeAnalysis.bands.find(b => b.band === "low")?.percentage.toFixed(1) || 0}%)
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-md">
          <div className="text-xs text-blue-600 mb-1">Average Correlation</div>
          <div className="text-lg font-bold text-blue-900">
            {regimeAnalysis.avgCorrelation.toFixed(3)}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Total pairs: {regimeAnalysis.totalPairs}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RegimeSwitchAnalyzer;

