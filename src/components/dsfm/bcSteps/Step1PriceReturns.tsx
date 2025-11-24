import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { StockData } from "@/services/dsfm/dataFetcher";
import { Info } from "lucide-react";

interface Step1PriceReturnsProps {
  stockData: StockData[];
  loading: boolean;
}

const Step1PriceReturns = ({ stockData, loading }: Step1PriceReturnsProps) => {
  const [selectedStock, setSelectedStock] = useState<string>("");

  // Initialize selection
  useEffect(() => {
    if (stockData.length > 0 && !selectedStock) {
      setSelectedStock(stockData[0].symbol);
    }
  }, [stockData, selectedStock]);

  // Prepare price chart data
  const priceChartData = useMemo(() => {
    if (!selectedStock || !stockData.length) return [];
    
    const stock = stockData.find(s => s.symbol === selectedStock);
    if (!stock) return [];

    return stock.prices.map((price, idx) => ({
      date: price.date,
      price: price.close,
      index: idx
    }));
  }, [selectedStock, stockData]);

  // Prepare returns histogram data
  const returnsHistogramData = useMemo(() => {
    if (!selectedStock || !stockData.length) return [];
    
    const stock = stockData.find(s => s.symbol === selectedStock);
    if (!stock || stock.returns.length === 0) return [];

    // Bin returns into histogram
    const bins: { [key: string]: number } = {};
    const binSize = 0.01; // 1% bins
    
    stock.returns.forEach(ret => {
      const bin = Math.floor(ret / binSize) * binSize;
      const binKey = bin.toFixed(3);
      bins[binKey] = (bins[binKey] || 0) + 1;
    });

    return Object.entries(bins)
      .map(([bin, count]) => ({
        return: parseFloat(bin),
        count
      }))
      .sort((a, b) => a.return - b.return);
  }, [selectedStock, stockData]);

  if (loading || stockData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 1: Price & Returns Visualization</h3>
        <p className="text-sm text-gray-500">Loading data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 1: Price & Returns Visualization</h3>
        <p className="text-sm text-gray-600 mb-4">
          We start by fetching NIFTY50 price data and computing log returns from historical prices.
        </p>
      </div>

      {/* Explanation Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Log Returns Calculation:</strong> We compute log returns using the formula{" "}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">r_t = ln(P_t / P_t-1)</code>.
            These returns are used to construct the correlation matrix in Step 2.
          </div>
        </div>
      </Card>

      {/* Stock Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Select Stock:</label>
        <Select value={selectedStock} onValueChange={setSelectedStock}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stockData.map(stock => (
              <SelectItem key={stock.symbol} value={stock.symbol}>
                {stock.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Chart (Optional) */}
      {selectedStock && priceChartData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Historical Price Chart</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={priceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#a5b4fc" 
                strokeWidth={2}
                name="Close Price"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Returns Histogram (Mandatory) */}
      {selectedStock && returnsHistogramData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Log Returns Distribution (Histogram)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={returnsHistogramData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="return" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Log Return', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#c4b5fd" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">
            This histogram shows the distribution of log returns. Most returns cluster around zero, with tails indicating 
            larger price movements. This distribution is used to calculate correlations between stocks.
          </p>
        </div>
      )}
    </Card>
  );
};

export default Step1PriceReturns;
