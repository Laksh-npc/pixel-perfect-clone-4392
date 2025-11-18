import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ReferenceLine,
  Cell,
  Rectangle,
} from "recharts";
import { format } from "date-fns";
import { BarChart3, Undo2, Redo2, Calendar } from "lucide-react";

interface CandlestickChartProps {
  symbol: string;
  stockDetails: any;
}

const timeframes = [
  { label: "1D", value: "1d" },
  { label: "1M", value: "1m" },
  { label: "1Y", value: "1y" },
  { label: "3Y", value: "3y" },
  { label: "5Y", value: "5y" },
];

// Custom Candlestick Shape Component - Improved version
const CandlestickShape = (props: any) => {
  const { x, y, width, payload } = props;
  if (!payload || payload.high === undefined || payload.low === undefined || payload.open === undefined || payload.close === undefined) {
    return null;
  }

  const isUp = payload.close >= payload.open;
  const color = isUp ? "#10b981" : "#ef4444";
  
  // Get the Y scale from the chart context
  // The y value passed is for the high price (since we're using high as dataKey)
  // We need to calculate positions for low, open, and close relative to the chart domain
  
  // For proper candlestick rendering, we need to use the actual Y scale
  // Since Recharts doesn't expose the scale directly, we'll use a different approach:
  // Render separate elements for wick and body using calculated positions
  
  // The y position represents where the HIGH price is on the chart
  // We need to calculate where LOW, OPEN, and CLOSE should be
  // This requires knowing the price range and chart height
  
  // Get price range from payload context (we'll pass it)
  const priceRange = payload.high - payload.low;
  if (priceRange === 0) {
    // Single price point
    const candleWidth = Math.max(width * 0.6, 3);
    const candleX = x + (width - candleWidth) / 2;
    const centerX = x + width / 2;
    return (
      <g>
        <line x1={centerX} y1={y} x2={centerX} y2={y} stroke={color} strokeWidth={2} />
        <rect x={candleX} y={y - 1.5} width={candleWidth} height={3} fill={color} />
      </g>
    );
  }
  
  // Calculate relative positions
  // We'll use the chart's Y scale by accessing it through the payload's context
  // For now, we'll estimate based on typical chart dimensions
  // The actual implementation should use the Y scale from Recharts
  
  // Better approach: Use multiple Bar components or calculate using the actual scale
  // For this implementation, we'll render using the high Y position and calculate others
  
  const candleWidth = Math.max(width * 0.6, 3);
  const candleX = x + (width - candleWidth) / 2;
  const centerX = x + width / 2;
  
  // Calculate body positions
  // Since we only have the high Y position, we need to estimate
  // In a proper implementation, we'd use the Y scale to convert prices to pixels
  const bodyTopY = y; // This will be adjusted by the actual scale
  const bodyBottomY = y; // This will be adjusted by the actual scale
  
  // For now, render a simplified version
  // The actual positions will be calculated by Recharts when we use proper dataKeys
  return (
    <g>
      {/* High-Low wick - will be rendered separately */}
      {/* Candle body - will be rendered separately */}
    </g>
  );
};

// Better approach: Use separate components for wick and body
const CandlestickWick = (props: any) => {
  const { x, y, width, payload, yScale } = props;
  if (!payload || !yScale) return null;
  
  const isUp = payload.close >= payload.open;
  const color = isUp ? "#10b981" : "#ef4444";
  const centerX = x + width / 2;
  
  // Use the Y scale to get actual pixel positions
  const highY = yScale(payload.high);
  const lowY = yScale(payload.low);
  
  return (
    <line
      x1={centerX}
      y1={highY}
      x2={centerX}
      y2={lowY}
      stroke={color}
      strokeWidth={1.5}
    />
  );
};

const CandlestickBody = (props: any) => {
  const { x, y, width, payload, yScale } = props;
  if (!payload || !yScale) return null;
  
  const isUp = payload.close >= payload.open;
  const color = isUp ? "#10b981" : "#ef4444";
  
  const openY = yScale(payload.open);
  const closeY = yScale(payload.close);
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  
  const candleWidth = Math.max(width * 0.6, 3);
  const candleX = x + (width - candleWidth) / 2;
  
  return (
    <rect
      x={candleX}
      y={bodyTop}
      width={candleWidth}
      height={bodyHeight}
      fill={color}
      stroke={color}
      strokeWidth={0.5}
    />
  );
};

const CandlestickChartComponent = ({ symbol, stockDetails }: CandlestickChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("1d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredData, setHoveredData] = useState<any>(null);

  const priceInfo = stockDetails?.priceInfo || {};
  const info = stockDetails?.info || {};
  const currentPrice = priceInfo.lastPrice || 0;
  const change = priceInfo.change || 0;
  const percentChange = priceInfo.pChange || 0;
  const open = priceInfo.open || 0;
  const high = priceInfo.intraDayHighLow?.max || priceInfo.high || 0;
  const low = priceInfo.intraDayHighLow?.min || priceInfo.low || 0;
  const close = priceInfo.lastPrice || priceInfo.close || 0;
  const isPositive = change >= 0;

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDate = new Date();
        const startDate = new Date();
        let formatted: any[] = [];

        switch (selectedPeriod) {
          case "1d":
            try {
              const intradayData = await api.getStockIntradayData(symbol);
              const graphDataArray = intradayData?.graphData || intradayData?.grapthData;
              
              if (graphDataArray && Array.isArray(graphDataArray) && graphDataArray.length > 0) {
                // Group into 5-minute intervals for candlesticks
                const grouped: { [key: number]: any } = {};
                
                graphDataArray.forEach((dataPoint: any) => {
                  let timestamp: number;
                  let price: number;
                  let volume: number = 0;
                  
                  if (Array.isArray(dataPoint)) {
                    [timestamp, price] = dataPoint;
                  } else if (dataPoint.timestamp && dataPoint.price) {
                    timestamp = dataPoint.timestamp;
                    price = dataPoint.price;
                    volume = dataPoint.volume || 0;
                  } else {
                    return;
                  }
                  
                  if (!timestamp || !price || price <= 0) return;
                  
                  const date = new Date(timestamp);
                  const minutes = date.getMinutes();
                  const roundedMinutes = Math.floor(minutes / 5) * 5;
                  const groupKey = new Date(date);
                  groupKey.setMinutes(roundedMinutes, 0, 0);
                  const key = groupKey.getTime();

                  if (!grouped[key]) {
                    grouped[key] = {
                      date: key,
                      open: price,
                      high: price,
                      low: price,
                      close: price,
                      volume: volume,
                    };
                  } else {
                    grouped[key].high = Math.max(grouped[key].high, price);
                    grouped[key].low = Math.min(grouped[key].low, price);
                    grouped[key].close = price;
                    grouped[key].volume += volume;
                  }
                });

                formatted = Object.values(grouped)
                  .sort((a: any, b: any) => a.date - b.date);

                if (formatted.length > 0) {
                  setChartData(formatted);
                  setLoading(false);
                  return;
                }
              }
            } catch (intradayError: any) {
              console.warn("Intraday data not available:", intradayError?.message);
            }
            startDate.setDate(startDate.getDate() - 1);
            break;
          case "1m":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case "1y":
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case "3y":
            startDate.setFullYear(startDate.getFullYear() - 3);
            break;
          case "5y":
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
        }

        // Fetch historical data
        const dateStart = format(startDate, "yyyy-MM-dd");
        const dateEnd = format(endDate, "yyyy-MM-dd");

        try {
          const historicalData = await api.getStockHistoricalData(symbol, dateStart, dateEnd);

          if (Array.isArray(historicalData)) {
            historicalData.forEach((period: any) => {
              if (period?.data && Array.isArray(period.data)) {
                period.data.forEach((item: any) => {
                  const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp;
                  const open = item.CH_OPENING_PRICE || item.OPEN || item.open || item.o;
                  const high = item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || item.h;
                  const low = item.CH_TRADE_LOW_PRICE || item.LOW || item.low || item.l;
                  const close = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || item.c;
                  const volume = item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || item.v || 0;

                  if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                    const ts = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
                    formatted.push({
                      date: ts,
                      open: open !== undefined && open !== null ? open : (close || high || low || 0),
                      high: high !== undefined && high !== null ? high : (close || open || low || 0),
                      low: low !== undefined && low !== null ? low : (close || open || high || 0),
                      close: close !== undefined && close !== null ? close : (open || high || low || 0),
                      volume: volume,
                    });
                  }
                });
              } else if (Array.isArray(period)) {
                period.forEach((item: any) => {
                  const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp;
                  const open = item.CH_OPENING_PRICE || item.OPEN || item.open || item.o;
                  const high = item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || item.h;
                  const low = item.CH_TRADE_LOW_PRICE || item.LOW || item.low || item.l;
                  const close = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || item.c;
                  const volume = item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || item.v || 0;

                  if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                    const ts = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
                    formatted.push({
                      date: ts,
                      open: open !== undefined && open !== null ? open : (close || high || low || 0),
                      high: high !== undefined && high !== null ? high : (close || open || low || 0),
                      low: low !== undefined && low !== null ? low : (close || open || high || 0),
                      close: close !== undefined && close !== null ? close : (open || high || low || 0),
                      volume: volume,
                    });
                  }
                });
              }
            });
          } else if (historicalData && typeof historicalData === 'object' && !Array.isArray(historicalData)) {
            if (historicalData.data && Array.isArray(historicalData.data)) {
              historicalData.data.forEach((item: any) => {
                const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp;
                const open = item.CH_OPENING_PRICE || item.OPEN || item.open || item.o;
                const high = item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || item.h;
                const low = item.CH_TRADE_LOW_PRICE || item.LOW || item.low || item.l;
                const close = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || item.c;
                const volume = item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || item.v || 0;

                if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                  const ts = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
                  formatted.push({
                    date: ts,
                    open: open !== undefined && open !== null ? open : (close || high || low || 0),
                    high: high !== undefined && high !== null ? high : (close || open || low || 0),
                    low: low !== undefined && low !== null ? low : (close || open || high || 0),
                    close: close !== undefined && close !== null ? close : (open || high || low || 0),
                    volume: volume,
                  });
                }
              });
            }
          }

          formatted.sort((a, b) => a.date - b.date);
          // For longer timeframes, limit data points for performance
          const maxPoints = selectedPeriod === "5y" ? 1500 : selectedPeriod === "3y" ? 1200 : selectedPeriod === "1y" ? 800 : 500;
          const limitedData = formatted.length > maxPoints
            ? formatted.filter((_, i) => i % Math.ceil(formatted.length / maxPoints) === 0)
            : formatted;

          if (limitedData.length > 0) {
            setChartData(limitedData);
            setError(null);
          } else {
            throw new Error("No chart data available");
          }
        } catch (historicalError: any) {
          console.error("Error fetching historical data:", historicalError);
          if ((open > 0 || high > 0 || low > 0 || close > 0) && formatted.length === 0) {
            const now = new Date();
            formatted = [{
              date: now.getTime(),
              open: open || close || high || low,
              high: high || close || open || low,
              low: low || close || open || high,
              close: close || open || high || low,
              volume: 0,
            }];
            setChartData(formatted);
            setError("Limited data: Showing current price only.");
          } else {
            throw historicalError;
          }
        }
      } catch (err: any) {
        console.error("Error fetching chart data:", err);
        const errorMessage = err?.message || "Failed to load chart data";
        
        if (open > 0 || high > 0 || low > 0 || close > 0) {
          const now = new Date();
          setChartData([{
            date: now.getTime(),
            open: open || close || high || low,
            high: high || close || open || low,
            low: low || close || open || high,
            close: close || open || high || low,
            volume: 0,
          }]);
          setError("Limited data: Showing current price only.");
        } else {
          setError(errorMessage);
          setChartData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, selectedPeriod, open, high, low, close]);

  const priceRange = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 0, range: 1 };
    }
    const allPrices = chartData.flatMap((d) => [d.high || 0, d.low || 0, d.open || 0, d.close || 0]).filter(p => p > 0);
    if (allPrices.length === 0) {
      return { min: 0, max: 0, range: 1 };
    }
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const range = max - min;
    return { min: min || 1, max: max || 100, range: range || 1 };
  }, [chartData]);

  const averageVolume = useMemo(() => {
    if (chartData.length === 0) return 0;
    const volumes = chartData.map(item => item.volume || 0).filter(v => v > 0);
    if (volumes.length === 0) return 0;
    return volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  }, [chartData]);

  const maxVolume = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map(item => item.volume || 0), 1);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      setHoveredData(data);
      const dateValue = typeof label === 'number' ? new Date(label) : new Date(label);
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 pointer-events-none">
          <p className="text-xs text-gray-600 mb-2 font-semibold">
            {format(dateValue, selectedPeriod === "1d" ? "MMM dd, HH:mm" : "MMM dd, yyyy")}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">O:</span>
              <span className="text-xs font-semibold">₹{data.open?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">H:</span>
              <span className="text-xs font-semibold text-green-600">₹{data.high?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">L:</span>
              <span className="text-xs font-semibold text-red-600">₹{data.low?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-600">C:</span>
              <span className="text-xs font-semibold">₹{data.close?.toFixed(2) || "0.00"}</span>
            </div>
            {data.volume !== undefined && (
              <div className="flex justify-between gap-4 pt-1 border-t mt-1">
                <span className="text-xs text-gray-600">Volume:</span>
                <span className="text-xs font-semibold">
                  {data.volume >= 1000000
                    ? `${(data.volume / 1000000).toFixed(2)}M`
                    : data.volume >= 1000
                    ? `${(data.volume / 1000).toFixed(2)}K`
                    : data.volume.toFixed(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    setHoveredData(null);
    return null;
  };


  // Calculate yAxisDomain before early returns to avoid hooks issues
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) {
      return [0, 100] as [number, number];
    }
    return [
      priceRange.min - priceRange.range * 0.02,
      priceRange.max + priceRange.range * 0.02,
    ] as [number, number];
  }, [priceRange, chartData.length]);

  // Prepare chart data with proper formatting
  const chartDataFormatted = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((item) => ({
      ...item,
      isUp: item.close >= item.open,
    }));
  }, [chartData]);

  // Custom candlestick rendering - memoized to avoid recreation on every render
  const CandlestickBar = useMemo(() => {
    return (props: any) => {
      const { x, y, width, payload } = props;
      if (!payload || payload.high === undefined) return null;
      
      const isUp = payload.close >= payload.open;
      const color = isUp ? "#10b981" : "#ef4444";
      const centerX = x + width / 2;
      const candleWidth = Math.max(width * 0.6, 3);
      const candleX = x + (width - candleWidth) / 2;
      
      // Get the domain range
      const domainMin = yAxisDomain[0];
      const domainMax = yAxisDomain[1];
      const domainRange = domainMax - domainMin;
      
      if (domainRange === 0) return null;
      
      // Calculate price differences
      const priceDiff = payload.high - payload.low;
      const openDiff = payload.high - payload.open;
      const closeDiff = payload.high - payload.close;
      
      // Estimate chart height from typical chart dimensions
      const estimatedChartHeight = 500;
      const marginTop = 10;
      const marginBottom = 80;
      const availableHeight = estimatedChartHeight - marginTop - marginBottom;
      const priceToPixelRatio = availableHeight / domainRange;
      
      // Calculate Y positions relative to high
      const lowY = y + (priceDiff * priceToPixelRatio);
      const openY = y + (openDiff * priceToPixelRatio);
      const closeY = y + (closeDiff * priceToPixelRatio);
      
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
      
      return (
        <g>
          {/* High-Low wick */}
          <line
            x1={centerX}
            y1={y}
            x2={centerX}
            y2={lowY}
            stroke={color}
            strokeWidth={1.5}
          />
          {/* Candle body */}
          <rect
            x={candleX}
            y={bodyTop}
            width={candleWidth}
            height={bodyHeight}
            fill={color}
            stroke={color}
            strokeWidth={0.5}
          />
        </g>
      );
    };
  }, [yAxisDomain]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (error && chartData.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-2xl px-4">
          <p className="text-xl font-semibold text-gray-900 mb-2">Chart data not available</p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              setChartData([]);
            }}
            className="mt-2"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No chart data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Stock Info Header */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{info.companyName || symbol}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                <span className="font-medium">5m</span>
                <span>·</span>
                <span>{info.symbol || symbol}</span>
                <span>·</span>
                <span>NSE</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                fx Indicators
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Undo2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Redo2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">O:{open.toFixed(2)}</span>
            <span className="text-green-600 font-medium">H:{high.toFixed(2)}</span>
            <span className="text-red-600 font-medium">L:{low.toFixed(2)}</span>
            <span className="text-gray-900 font-medium">C:{close.toFixed(2)}</span>
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive ? "+" : ""}
              {change.toFixed(2)} ({isPositive ? "+" : ""}
              {percentChange.toFixed(2)}%)
            </span>
          </div>
          <div className="text-gray-600">
            Volume SMA 9{" "}
            {averageVolume >= 1000000
              ? `${(averageVolume / 1000000).toFixed(2)}M`
              : averageVolume >= 1000
              ? `${(averageVolume / 1000).toFixed(2)}K`
              : averageVolume.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative" style={{ minHeight: "500px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartDataFormatted}
            margin={{ top: 10, right: 30, left: 10, bottom: 80 }}
          >
            <defs>
              <linearGradient id="volumeGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="volumeGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tick={{ fontSize: 11, fill: "#666" }}
              tickFormatter={(value) => {
                try {
                  return format(new Date(value), selectedPeriod === "1d" ? "HH:mm" : selectedPeriod === "1m" ? "MMM dd" : "MMM yyyy");
                } catch {
                  return "";
                }
              }}
              axisLine={false}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fontSize: 11, fill: "#666" }}
              axisLine={false}
              domain={yAxisDomain}
              width={60}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={false}
              axisLine={false}
              domain={[0, maxVolume * 1.2]}
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            {hoveredData && (
              <ReferenceLine
                yAxisId="price"
                x={hoveredData.date}
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="5 5"
                opacity={0.5}
              />
            )}
            <ReferenceLine
              yAxisId="price"
              y={currentPrice}
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            {/* Candlesticks - using high for positioning, then rendering custom shape */}
            <Bar
              yAxisId="price"
              dataKey="high"
              fill="transparent"
              shape={CandlestickBar}
            >
              {chartDataFormatted.map((entry, index) => (
                <Cell key={`candle-${index}`} />
              ))}
            </Bar>
            {/* Volume histogram */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#10b981"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
            >
              {chartDataFormatted.map((entry, index) => (
                <Cell
                  key={`volume-${index}`}
                  fill={entry.isUp ? "url(#volumeGradientUp)" : "url(#volumeGradientDown)"}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPeriod(tf.value)}
              className={`h-7 px-3 text-xs ${
                selectedPeriod === tf.value
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tf.label}
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Calendar className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>{format(new Date(), "HH:mm:ss 'UTC+5:30'")}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              %
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              log
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              auto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandlestickChartComponent;
