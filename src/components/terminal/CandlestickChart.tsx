import { useEffect, useState, useMemo, useCallback, useRef, memo } from "react";
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
} from "recharts";
import { format } from "date-fns";
import { BarChart3, Undo2, Redo2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface CandlestickChartProps {
  symbol: string;
  stockDetails: any;
}

const timeframes = [
  { label: "5Y", value: "5y" },
  { label: "1Y", value: "1y" },
  { label: "3M", value: "3m" },
  { label: "1M", value: "1m" },
  { label: "5D", value: "5d" },
  { label: "1D", value: "1d" },
];

// Custom Cursor - Returns SVG props for vertical line matching Groww
const getCustomCursor = (theme: string) => {
  return {
    fill: "none",
  };
};

// Memoized custom tooltip - now simplified to just track hover without causing renders
const CustomTooltip = memo(({ active, payload }: any) => {
  // Return null - we're handling hover via mouse events instead
  return null;
});

CustomTooltip.displayName = "CustomTooltip";

// Memoized candlestick shape component - Simplified to use Recharts coordinate system correctly
const CandlestickShape = memo((props: any) => {
  const { x, y, width, payload } = props;
  
  if (!payload || payload.high === undefined || payload.low === undefined || 
      payload.open === undefined || payload.close === undefined) return null;

  const isUp = payload.close >= payload.open;
  const theme = payload.theme || "light";
  
  // Groww exact colors
  const color = isUp 
    ? (theme === "dark" ? "#00C46A" : "#22C55E")
    : (theme === "dark" ? "#FF5F5F" : "#EF4444");
  
  const centerX = x + width / 2;
  // Thick candles matching Groww - 85% width for thick appearance
  const candleWidth = Math.max(width * 0.85, 2);
  const candleX = x + (width - candleWidth) / 2;

  const domainMin = payload.domainMin;
  const domainMax = payload.domainMax;
  
  if (!domainMin || !domainMax || domainMax === domainMin) return null;
  
  const domainRange = domainMax - domainMin;
  const highPrice = payload.high;
  const lowPrice = payload.low;
  const openPrice = payload.open;
  const closePrice = payload.close;
  
  // Single price point - flat line
  if (Math.abs(highPrice - lowPrice) < 0.001 && Math.abs(openPrice - closePrice) < 0.001) {
    return (
      <g style={{ shapeRendering: "geometricPrecision" }}>
        <line 
          x1={centerX} 
          y1={y} 
          x2={centerX} 
          y2={y} 
          stroke={color} 
          strokeWidth={1}
          strokeLinecap="round"
        />
        <rect 
          x={candleX} 
          y={y - 1} 
          width={candleWidth} 
          height={2} 
          fill={color}
          style={{ shapeRendering: "geometricPrecision" }}
        />
      </g>
    );
  }
  
  // Calculate positions using Recharts coordinate system
  // In Recharts, y-axis is inverted: smaller price values = higher y position (closer to top)
  // The 'y' prop is the pixel position for the 'high' price value
  
  // Calculate the scale factor: pixels per price unit
  // We know: highPrice maps to y position
  // We also know the domain range, so we can calculate the scale
  
  // Get chart area dimensions (margins: top=10, bottom=100, from ComposedChart)
  const marginTop = 10;
  const marginBottom = 100;
  
  // Calculate normalized positions in domain (0 = domainMin, 1 = domainMax)
  // In Recharts YAxis: higher prices = lower y pixel values (visually at top)
  // The coordinate system is inverted: y = marginTop + (1 - normalizedValue) * chartAreaHeight
  
  const highNorm = (highPrice - domainMin) / domainRange;
  const lowNorm = (lowPrice - domainMin) / domainRange;
  const openNorm = (openPrice - domainMin) / domainRange;
  const closeNorm = (closePrice - domainMin) / domainRange;
  
  // The 'y' prop from Recharts is the pixel position for 'high'
  // Use this to calibrate the chart area height
  const highY = y;
  
  // Reverse-engineer chartAreaHeight from the known highY position
  // Formula: y = marginTop + (1 - norm) * chartAreaHeight
  // Therefore: chartAreaHeight = (y - marginTop) / (1 - norm)
  let chartAreaHeight: number;
  if (highNorm < 1 && highNorm > 0 && highY > marginTop) {
    chartAreaHeight = (highY - marginTop) / (1 - highNorm);
  } else {
    // Fallback calculation - estimate based on typical chart dimensions
    chartAreaHeight = 310; // Estimated: 400px total - 10px top - 80px bottom
  }
  
  // Calculate pixel positions for all values using the calibrated chartAreaHeight
  // Higher normalized values (higher prices) = lower y positions (visually higher on chart)
  const lowY = marginTop + (1 - lowNorm) * chartAreaHeight;
  const openY = marginTop + (1 - openNorm) * chartAreaHeight;
  const closeY = marginTop + (1 - closeNorm) * chartAreaHeight;
  
  // Calculate body bounds (open and close form the body)
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(bodyBottom - bodyTop, 0.5);

  return (
    <g style={{ shapeRendering: "geometricPrecision" }}>
      {/* Wick - thin line matching candle color */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {/* Candle body - crisp rectangle, no borders */}
      <rect
        x={candleX}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        style={{ shapeRendering: "geometricPrecision" }}
      />
    </g>
  );
});

CandlestickShape.displayName = "CandlestickShape";

// Memoized volume bar shape component - Groww style
const VolumeBarShape = memo((props: any) => {
  const { x, y, width, height, payload } = props;
  const theme = payload?.theme || "light";
  
  if (!payload || payload.volume === undefined || payload.volume === 0 || height <= 0) return null;
  
  const isUp = payload.close >= payload.open;
  // Same colors as candles
  const color = isUp 
    ? (theme === "dark" ? "#00C46A" : "#22C55E")
    : (theme === "dark" ? "#FF5F5F" : "#EF4444");
  
  // Opacity: 30% light mode, 40% dark mode (matching Groww)
  const opacity = theme === "dark" ? 0.4 : 0.3;
  
  // Thick bars matching Groww - 85% width for thick appearance
  const barWidth = Math.max(width * 0.85, 2);
  const barX = x + (width - barWidth) / 2;
  
  // In Recharts, for volume bars at bottom with domain starting at 0:
  // - y is the bottom coordinate (base of the bar)
  // - height is the bar height (already calculated by Recharts)
  // - Bars grow upward, so render from (y - height) to y
  const barTop = y - height;
  
  return (
    <rect
      x={barX}
      y={Math.max(0, barTop)} // Ensure bar doesn't go above chart
      width={barWidth}
      height={height}
      fill={color}
      fillOpacity={opacity}
      rx={1}
      ry={1}
      style={{ shapeRendering: "geometricPrecision" }}
    />
  );
});

VolumeBarShape.displayName = "VolumeBarShape";

const CandlestickChartComponent = ({ symbol, stockDetails }: CandlestickChartProps) => {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("1d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track state without triggering re-renders
  const hoveredDataRef = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<any>(null);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const isMouseInChartRef = useRef<boolean>(false);
  
  // Separate state for OHLC display - only for header update
  const [displayOHLC, setDisplayOHLC] = useState<any>(null);
  
  // Overlay state - kept separate to minimize re-renders
  const [overlayState, setOverlayState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
    date: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    price: 0,
    date: "",
  });

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Memoize data fetching to prevent multiple calls
  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      let formatted: any[] = [];

      switch (selectedPeriod) {
        case "1d":
          // For 1d, fetch 3 days of data (previous 3 trading days)
          try {
            // Get today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Calculate previous 3 trading days (skip weekends)
            const tradingDays: Date[] = [];
            let checkDate = new Date(today);
            let daysBack = 0;
            
            while (tradingDays.length < 3 && daysBack < 10) {
              checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() - daysBack);
              const dayOfWeek = checkDate.getDay();
              // Skip weekends (0 = Sunday, 6 = Saturday)
              if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                tradingDays.push(new Date(checkDate));
              }
              daysBack++;
            }
            
            // Sort trading days (oldest first)
            tradingDays.sort((a, b) => a.getTime() - b.getTime());
            
            // Fetch historical data for these 3 days
            const oldestDate = tradingDays[0];
            const newestDate = tradingDays[tradingDays.length - 1];
            
            const historicalStart = format(oldestDate, "yyyy-MM-dd");
            const historicalEnd = format(newestDate, "yyyy-MM-dd");
            
            try {
              const historicalData = await api.getStockHistoricalData(symbol, historicalStart, historicalEnd);
              
              // Process historical data to extract intraday-like timestamps
              const historicalPoints: any[] = [];
              
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
                      
                      if (timestamp) {
                        const ts = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
                        historicalPoints.push({
                          timestamp: ts,
                          price: close || open || high || low,
                          volume: volume,
                          open: open !== undefined && open !== null ? open : close,
                          high: high !== undefined && high !== null ? high : close,
                          low: low !== undefined && low !== null ? low : close,
                          close: close !== undefined && close !== null ? close : open,
                        });
                      }
                    });
                  }
                });
              }
              
              // Generate intraday timestamps for each trading day (9:15 AM - 4:00 PM, 5-minute intervals)
              tradingDays.forEach((tradingDay) => {
                const marketOpen = new Date(tradingDay);
                marketOpen.setHours(9, 15, 0, 0);
                const marketClose = new Date(tradingDay);
                marketClose.setHours(16, 0, 0, 0);
                
                // Generate 5-minute intervals
                let currentTime = new Date(marketOpen);
                while (currentTime <= marketClose) {
                  const dayData = historicalPoints.find(p => {
                    const pDate = new Date(p.timestamp);
                    return pDate.toDateString() === tradingDay.toDateString();
                  });
                  
                  if (dayData) {
                    formatted.push({
                      timestamp: currentTime.getTime(),
                      price: dayData.close,
                      volume: dayData.volume || 0,
                      open: dayData.open,
                      high: dayData.high,
                      low: dayData.low,
                      close: dayData.close,
                    });
                  }
                  
                  currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000); // Add 5 minutes
                }
              });
              
              // Also try to get today's intraday data if available
              try {
                const intradayData = await api.getStockIntradayData(symbol);
                const graphDataArray = intradayData?.graphData || intradayData?.grapthData;
                
                if (graphDataArray && Array.isArray(graphDataArray) && graphDataArray.length > 0) {
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
                    
                    // Only add if it's from one of our trading days
                    const dataDate = new Date(timestamp);
                    const isInRange = tradingDays.some(day => 
                      dataDate.toDateString() === day.toDateString()
                    );
                    
                    if (isInRange) {
                      formatted.push({
                        timestamp: timestamp,
                        price: price,
                        volume: volume,
                        open: price,
                        high: price,
                        low: price,
                        close: price,
                      });
                    }
                  });
                }
              } catch (intradayError) {
                // Intraday data not available, continue with historical
              }
              
              // Group into 5-minute intervals for candlesticks
              const grouped: { [key: number]: any } = {};
              
              formatted.forEach((point: any) => {
                const date = new Date(point.timestamp);
                const minutes = date.getMinutes();
                const roundedMinutes = Math.floor(minutes / 5) * 5;
                const groupKey = new Date(date);
                groupKey.setMinutes(roundedMinutes, 0, 0);
                const key = groupKey.getTime();

                if (!grouped[key]) {
                  grouped[key] = {
                    date: key,
                    open: point.open || point.price,
                    high: point.high || point.price,
                    low: point.low || point.price,
                    close: point.close || point.price,
                    volume: point.volume || 0,
                    timeframe: selectedPeriod,
                  };
                } else {
                  grouped[key].high = Math.max(grouped[key].high, point.high || point.price);
                  grouped[key].low = Math.min(grouped[key].low, point.low || point.price);
                  grouped[key].close = point.close || point.price;
                  grouped[key].volume += (point.volume || 0);
                }
              });

              formatted = Object.values(grouped)
                .sort((a: any, b: any) => a.date - b.date);

              if (formatted.length > 0) {
                setChartData(formatted);
                setLoading(false);
                return;
              }
            } catch (histError) {
              console.warn("Historical data fetch failed for 1d:", histError);
            }
          } catch (error: any) {
            console.warn("Error fetching 1d data:", error?.message);
          }
          // Fallback: try just today's intraday data
          try {
            const intradayData = await api.getStockIntradayData(symbol);
            const graphDataArray = intradayData?.graphData || intradayData?.grapthData;
            
            if (graphDataArray && Array.isArray(graphDataArray) && graphDataArray.length > 0) {
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
                    timeframe: selectedPeriod,
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
        case "5d":
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
                    timeframe: selectedPeriod,
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
          startDate.setDate(startDate.getDate() - 5);
          break;
        case "1m":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3m":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "1y":
          startDate.setFullYear(startDate.getFullYear() - 1);
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
                    timeframe: selectedPeriod,
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
                    timeframe: selectedPeriod,
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
                  timeframe: selectedPeriod,
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
            timeframe: selectedPeriod,
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
          timeframe: selectedPeriod,
        }]);
        setError("Limited data: Showing current price only.");
      } else {
        setError(errorMessage);
        setChartData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, selectedPeriod, open, high, low, close]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

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

  // Calculate yAxisDomain
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

// Memoized timeframe change handler
  const handleTimeframeChange = useCallback((timeframe: string) => {
    setSelectedPeriod(timeframe);
    setDisplayOHLC(null);
    setOverlayState(prev => ({ ...prev, visible: false }));
  }, []);

  // Mouse event handlers with requestAnimationFrame for performance
  const handleChartMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current) return;
    
    // Cancel any pending animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      if (!chartContainerRef.current) return;
      
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Get chart boundaries (accounting for margins in ResponsiveContainer)
      const chartHeight = rect.height;
      const chartWidth = rect.width;
      
      const leftMargin = 10;
      const rightMargin = 60;
      const topMargin = 10;
      const bottomMargin = 80;
      
      const chartArea = {
        left: leftMargin,
        right: chartWidth - rightMargin,
        top: topMargin,
        bottom: chartHeight - bottomMargin,
      };
      
      // Check if cursor is in chart area - use strict boundaries
      const isInChartArea = (
        x >= chartArea.left &&
        x <= chartArea.right &&
        y >= chartArea.top &&
        y <= chartArea.bottom
      );
      
      if (!isInChartArea) {
        // Only hide if we were previously inside
        if (isMouseInChartRef.current) {
          isMouseInChartRef.current = false;
          setOverlayState(prev => {
            if (prev.visible) {
              return { ...prev, visible: false };
            }
            return prev;
          });
          setDisplayOHLC(null);
        }
        return;
      }
      
      // We're inside the chart area
      isMouseInChartRef.current = true;
      
      // Calculate position in chart coordinates (0 to 1)
      const normalizedX = (x - chartArea.left) / (chartArea.right - chartArea.left);
      const chartDataIndex = Math.max(
        0,
        Math.min(
          chartDataFormatted.length - 1,
          Math.round(normalizedX * (chartDataFormatted.length - 1))
        )
      );
      
      if (chartDataIndex >= 0 && chartDataIndex < chartDataFormatted.length) {
        const dataPoint = chartDataFormatted[chartDataIndex];
        hoveredDataRef.current = dataPoint;
        
        // Only update state if data actually changed
        setDisplayOHLC(prev => {
          if (prev?.date === dataPoint.date) return prev;
          return dataPoint;
        });
        
        // Update overlay with EXACT cursor position - crosshair follows cursor
        setOverlayState(prev => ({
          visible: true,
          x, // Exact cursor X position
          y, // Exact cursor Y position
          price: dataPoint.close || dataPoint.high || 0,
          date: new Date(dataPoint.date).toISOString(),
        }));
      }
    });
  }, [chartDataFormatted]);

  const handleChartMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Cancel any pending animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Check if we're actually leaving the container
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    
    // Only hide if we're truly leaving (not moving to a child element)
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      isMouseInChartRef.current = false;
      setOverlayState(prev => ({ ...prev, visible: false }));
      setDisplayOHLC(null);
      hoveredDataRef.current = null;
    }
  }, []);

  // Grid color based on theme - matching Groww exactly
  const gridColor = theme === "dark" ? "#3A3F45" : "#E5E7EB";
  const textColor = theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)";

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
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
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-2xl px-4">
          <p className="text-xl font-semibold text-foreground mb-2">Chart data not available</p>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              setChartData([]);
              fetchChartData();
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

  // Get current OHLC from display state or latest data point
  const displayData = displayOHLC || chartDataFormatted[chartDataFormatted.length - 1] || {
    open, high, low, close, volume: 0
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden" ref={chartContainerRef}>
      {/* Stock Info Header - Matching Groww layout exactly */}
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{info.companyName || symbol}</h2>
              <button className="text-muted-foreground hover:text-foreground">
                <span className="text-lg">⊕</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="font-medium">{selectedPeriod === '1d' ? '5m' : selectedPeriod === '5d' ? '1d' : selectedPeriod}</span>
              <span>·</span>
              <span>{info.symbol || symbol}</span>
              <span>·</span>
              <span>NSE</span>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Indicators
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* OHLC Display - Always visible, matching Groww - Updates on hover */}
      <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center gap-6 text-xs font-medium">
        <div className="flex items-center gap-4">
          {displayOHLC ? (
            // Hover mode: Show full OHLC like Groww's format
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-foreground font-semibold">{info.symbol || symbol}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{selectedPeriod === '1d' ? '5' : selectedPeriod === '5d' ? '1' : '60'}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">NSE</span>
              <span className="text-muted-foreground ml-2">O<span className="ml-1 font-semibold text-foreground">{displayData.open?.toFixed(2) || open.toFixed(2)}</span></span>
              <span className="text-green-500 dark:text-green-400">H<span className="ml-1 font-semibold">{displayData.high?.toFixed(2) || high.toFixed(2)}</span></span>
              <span className="text-red-500 dark:text-red-400">L<span className="ml-1 font-semibold">{displayData.low?.toFixed(2) || low.toFixed(2)}</span></span>
              <span className="text-muted-foreground">C<span className="ml-1 font-semibold text-foreground">{displayData.close?.toFixed(2) || close.toFixed(2)}</span></span>
              {(() => {
                const hoverOpen = displayData.open || open;
                const hoverClose = displayData.close || close;
                const hoverChange = hoverClose - hoverOpen;
                const hoverPercent = hoverOpen > 0 ? ((hoverChange / hoverOpen) * 100) : 0;
                const hoverIsPositive = hoverChange >= 0;
                return (
                  <span className={`font-semibold ${hoverIsPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    {hoverIsPositive ? "+" : ""}{hoverChange.toFixed(2)} ({hoverIsPositive ? "+" : ""}{hoverPercent.toFixed(2)}%)
                  </span>
                );
              })()}
            </div>
          ) : (
            // Default mode: Show separated OHLC values
            <>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">O</span>
                <span className="font-semibold text-foreground">{open.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 dark:text-green-400">H</span>
                <span className="font-semibold text-green-500 dark:text-green-400">{high.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 dark:text-red-400">L</span>
                <span className="font-semibold text-red-500 dark:text-red-400">{low.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">C</span>
                <span className="font-semibold text-foreground">{close.toFixed(2)}</span>
              </div>
              <div className={`font-semibold ${isPositive ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                {isPositive ? "+" : ""}
                {change.toFixed(2)} ({isPositive ? "+" : ""}
                {percentChange.toFixed(2)}%)
              </div>
            </>
          )}
        </div>
        <div className="text-muted-foreground ml-auto flex items-center gap-2">
          <span>Volume</span>
          {displayOHLC && displayData.volume !== undefined && displayData.volume > 0 ? (
            <span className="font-semibold">
              {displayData.volume >= 1000000
                ? `${(displayData.volume / 1000000).toFixed(2)}M`
                : displayData.volume >= 1000
                ? `${(displayData.volume / 1000).toFixed(2)}K`
                : displayData.volume.toFixed(0)}
            </span>
          ) : (
            <>
              <span>SMA 9</span>
              <span className="font-semibold">
                {averageVolume >= 1000000
                  ? `${(averageVolume / 1000000).toFixed(2)}M`
                  : averageVolume >= 1000
                  ? `${(averageVolume / 1000).toFixed(2)}K`
                  : averageVolume.toFixed(0)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Chart Area - Using ResponsiveContainer for smooth resize */}
      <div 
        className="flex-1 relative min-h-[500px]" 
        style={{ minHeight: "500px" }}
        ref={chartContainerRef}
        onMouseMove={handleChartMouseMove}
        onMouseLeave={handleChartMouseLeave}
        onMouseEnter={(e) => {
          // Only set to true if we're actually entering from outside
          if (!isMouseInChartRef.current) {
            isMouseInChartRef.current = true;
          }
        }}
      >
        {/* Crosshair and overlay - rendered with transform for performance */}
        {overlayState.visible && (
          <>
            {/* Crosshair lines - using absolute positioning for smoothness, positioned relative to container */}
            <div
              className="absolute inset-0 pointer-events-none z-30"
              style={{ overflow: "visible" }}
            >
              {/* Vertical line - dashed like Groww */}
              <div
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: `${overlayState.x}px`,
                  background: `repeating-linear-gradient(
                    to bottom,
                    ${theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"} 0px,
                    ${theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"} 4px,
                    transparent 4px,
                    transparent 8px
                  )`,
                }}
              />
              
              {/* Horizontal line - dashed like Groww */}
              <div
                className="absolute left-0 right-0 h-px"
                style={{
                  top: `${overlayState.y}px`,
                  background: `repeating-linear-gradient(
                    to right,
                    ${theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"} 0px,
                    ${theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"} 4px,
                    transparent 4px,
                    transparent 8px
                  )`,
                }}
              />
              
              {/* Center plus icon - positioned exactly at cursor */}
              <div
                className="absolute"
                style={{
                  left: `${overlayState.x}px`,
                  top: `${overlayState.y}px`,
                  transform: "translate(-50%, -50%)",
                  width: "10px",
                  height: "10px",
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
                    border: `1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)"}`,
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "8px",
                    height: "2px",
                    backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
                    borderRadius: "1px",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "2px",
                    height: "8px",
                    backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
                    borderRadius: "1px",
                  }}
                />
              </div>
            </div>

            {/* Price overlay box - Moves with horizontal line (y position) */}
            <div
              className="absolute bg-black/90 dark:bg-white/90 px-3 py-1.5 rounded text-xs font-bold text-white dark:text-black shadow-xl border border-white/20 dark:border-black/20 z-40 whitespace-nowrap"
              style={{
                pointerEvents: "none",
                top: `${Math.max(10, Math.min(overlayState.y - 15, window.innerHeight - 100))}px`,
                right: "15px",
                backdropFilter: "blur(4px)",
                transform: "translateZ(0)",
                willChange: "top",
              }}
            >
              + {overlayState.price.toFixed(2)}
            </div>

            {/* Date/Time overlay box - Moves with vertical line (x position) */}
            <div
              className="absolute bg-black/90 dark:bg-white/90 px-3 py-1.5 rounded text-xs font-semibold text-white dark:text-black shadow-xl border border-white/20 dark:border-black/20 z-40 text-center whitespace-nowrap"
              style={{
                pointerEvents: "none",
                bottom: "85px",
                left: `${Math.max(10, Math.min(overlayState.x - 60, window.innerWidth - 130))}px`,
                transform: "translateZ(0)",
                willChange: "left",
              }}
            >
              {(() => {
                try {
                  const date = new Date(overlayState.date);
                  const day = date.getDate();
                  const month = format(date, "MMM");
                  const year = format(date, "yy");
                  const time = format(date, "HH:mm");
                  return `${day} ${month} '${year} · ${time}`;
                } catch {
                  return format(new Date(overlayState.date), "dd MMM 'yy · HH:mm");
                }
              })()}
            </div>
          </>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartDataFormatted}
            margin={{ top: 10, right: 60, left: 10, bottom: 100 }}
            onMouseMove={(state: any) => {
              // Capture SVG reference from Recharts
              if (state?.chartX !== undefined && state?.chartY !== undefined) {
                mousePositionRef.current = { x: state.chartX, y: state.chartY };
              }
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={gridColor} 
              vertical={false}
              strokeWidth={1}
            />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tick={{ 
                fontSize: 11, 
                fill: textColor,
                fontWeight: 400,
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}
              tickFormatter={(value) => {
                try {
                  return format(new Date(value), selectedPeriod === "1d" || selectedPeriod === "5d" ? "HH:mm" : selectedPeriod === "1m" || selectedPeriod === "3m" ? "MMM dd" : "MMM yyyy");
                } catch {
                  return "";
                }
              }}
              axisLine={false}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ 
                fontSize: 11, 
                fill: textColor,
                fontWeight: 400,
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}
              axisLine={false}
              domain={yAxisDomain}
              width={60}
            />
            {/* Volume axis - positioned at bottom for histogram */}
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={false}
              axisLine={false}
              domain={[0, maxVolume * 1.2]}
              hide={true}
              width={0}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={false}
              animationDuration={0}
              trigger="hover"
              active={false}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            {/* Current price reference line - only one reference line */}
            <ReferenceLine
              yAxisId="price"
              y={currentPrice}
              stroke={theme === "dark" ? "rgba(76, 175, 80, 0.5)" : "rgba(76, 175, 80, 0.3)"}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            {/* Candlesticks */}
            <Bar
              yAxisId="price"
              dataKey="high"
              fill="transparent"
              shape={(props: any) => {
                // Add domain info and theme to payload for proper rendering
                if (props?.payload) {
                  props.payload.domainMin = yAxisDomain[0];
                  props.payload.domainMax = yAxisDomain[1];
                  props.payload.theme = theme;
                }
                return <CandlestickShape {...props} />;
              }}
            >
              {chartDataFormatted.map((entry, index) => (
                <Cell key={`candle-${index}`} />
              ))}
            </Bar>
            {/* Volume histogram - Groww style: flat colors, proper opacity */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="transparent"
              shape={(props: any) => {
                // Add theme to payload for proper rendering
                if (props?.payload) {
                  props.payload.theme = theme;
                }
                return <VolumeBarShape {...props} />;
              }}
            >
              {chartDataFormatted.map((entry, index) => (
                <Cell key={`volume-${index}`} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Controls - Matching Groww layout */}
      <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant="ghost"
              size="sm"
              onClick={() => handleTimeframeChange(tf.value)}
              className={`h-8 px-4 text-xs font-medium transition-all ${
                selectedPeriod === tf.value
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tf.label}
            </Button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-muted-foreground">
            <span>{format(new Date(), "HH:mm:ss")} (UTC+5:30)</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              %
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              log
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
            >
              auto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CandlestickChartComponent);
