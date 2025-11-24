import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { StockData } from "@/services/dsfm/dataFetcher";
import { ShockImpact } from "@/services/dsfm/shockPropagation";
import { Info } from "lucide-react";

interface ShockPriceComparisonProps {
  stockData: StockData[];
  impactResults: Map<string, ShockImpact> | null;
  loading: boolean;
}

/**
 * Compute shocked price series from actual prices and shock impact
 * @param priceSeries - Array of actual close prices with dates
 * @param shockImpactPercent - Final shock impact as a percentage (e.g., -0.13 for -13%)
 * @returns Array of shocked prices with same dates
 */
function computeShockedSeries(
  priceSeries: Array<{ date: string; price: number }>,
  shockImpactPercent: number
): Array<{ date: string; price: number }> {
  return priceSeries.map(item => ({
    date: item.date,
    price: item.price * (1 + shockImpactPercent)
  }));
}

const ShockPriceComparison = ({ stockData, impactResults, loading }: ShockPriceComparisonProps) => {
  const [selectedStock, setSelectedStock] = useState<string>("");

  // Get top 5 most affected stocks from impact results
  const topAffectedStocks = useMemo(() => {
    if (!impactResults || impactResults.size === 0) return [];
    
    return Array.from(impactResults.values())
      .sort((a, b) => Math.abs(b.finalShock) - Math.abs(a.finalShock))
      .slice(0, 5)
      .map(impact => impact.symbol);
  }, [impactResults]);

  // Initialize selection with first top affected stock
  useEffect(() => {
    if (topAffectedStocks.length > 0 && !selectedStock) {
      setSelectedStock(topAffectedStocks[0]);
    }
  }, [topAffectedStocks, selectedStock]);

  // Get last 30 days of price data for selected stock
  const priceChartData = useMemo(() => {
    if (!selectedStock || !stockData.length || !impactResults) return [];
    
    const stock = stockData.find(s => s.symbol === selectedStock);
    if (!stock || !stock.prices || stock.prices.length === 0) return [];

    // Get last 30-60 data points (or all if less) - prioritize last 30 days
    const maxPoints = Math.min(60, stock.prices.length);
    const recentPrices = stock.prices.slice(-maxPoints).map((price, idx) => ({
      date: price.date,
      price: price.close,
      index: idx
    }));

    // Get shock impact for this stock
    const impact = impactResults.get(selectedStock);
    if (!impact) return [];

    const shockPercent = impact.finalShock; // Already a decimal (e.g., -0.13 for -13%)
    
    // Compute shocked prices
    const shockedPrices = computeShockedSeries(recentPrices, shockPercent);

    // Combine actual and shocked prices
    return recentPrices.map((actual, idx) => ({
      date: actual.date,
      actual: actual.price,
      shocked: shockedPrices[idx].price,
      index: idx
    }));
  }, [selectedStock, stockData, impactResults]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs font-semibold mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} className="text-xs" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> ₹{entry.value.toFixed(2)}
            </p>
          ))}
          {payload.length === 2 && (
            <p className="text-xs text-gray-600 mt-1 border-t pt-1">
              Difference: ₹{Math.abs(payload[0].value - payload[1].value).toFixed(2)} (
              {payload[0].value !== 0 
                ? (((payload[1].value - payload[0].value) / payload[0].value) * 100).toFixed(2)
                : '0.00'
              }%)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading || !impactResults || impactResults.size === 0) {
    return null; // Don't render if no impact results
  }

  if (topAffectedStocks.length === 0) {
    return null; // Don't render if no affected stocks
  }

  if (priceChartData.length === 0) {
    return (
      <Card className="p-6">
        <h4 className="text-sm font-semibold mb-2">Actual vs Shocked Price Projection</h4>
        <p className="text-xs text-gray-500">No price data available for selected stocks.</p>
      </Card>
    );
  }

  const selectedImpact = impactResults.get(selectedStock);
  const shockPercent = selectedImpact ? selectedImpact.finalShock * 100 : 0;

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-1">Actual vs Shocked Price Projection</h4>
        <p className="text-xs text-gray-600 mb-3">
          Shows how the simulated shock would have changed price movement.
        </p>
      </div>

      {/* Stock Selection */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Select Stock (Top 5 Most Affected):</Label>
        <Select value={selectedStock} onValueChange={setSelectedStock}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {topAffectedStocks.map(symbol => {
              const impact = impactResults.get(symbol);
              const impactPercent = impact ? (impact.finalShock * 100).toFixed(2) : '0.00';
              const displaySymbol = symbol.replace('.NS', '');
              return (
                <SelectItem key={symbol} value={symbol}>
                  {displaySymbol} (Impact: {impactPercent}%)
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      {priceChartData.length > 0 && (
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `₹${value.toFixed(0)}`}
                label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Actual Price"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="shocked" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Shocked Price"
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Info Card */}
          <Card className="mt-3 p-3 bg-blue-50 border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="mb-1">
                  <strong>Selected Stock:</strong> {selectedStock.replace('.NS', '')} | 
                  <strong> Shock Impact:</strong> {shockPercent > 0 ? '+' : ''}{shockPercent.toFixed(2)}%
                </p>
                <p>
                  The red dashed line shows projected prices if the shock had occurred. 
                  Formula: <code className="bg-blue-100 px-1 rounded">shocked_price = actual_price × (1 + {shockPercent > 0 ? '+' : ''}{shockPercent.toFixed(2)}%)</code>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default ShockPriceComparison;

