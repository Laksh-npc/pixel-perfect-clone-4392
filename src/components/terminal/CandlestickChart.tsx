import { useEffect, useState, useMemo } from "react";
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
  ErrorBar,
} from "recharts";
import { format } from "date-fns";
import { BarChart3, Undo2, Redo2, Calendar } from "lucide-react";

interface CandlestickChartProps {
  symbol: string;
  stockDetails: any;
}

const timeframes = [
  { label: "1d", value: "1d" },
  { label: "5d", value: "5d" },
  { label: "1m", value: "1m" },
  { label: "3m", value: "3m" },
  { label: "1y", value: "1y" },
  { label: "5y", value: "5y" },
];

const CandlestickChartComponent = ({ symbol, stockDetails }: CandlestickChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("1d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [retryKey, setRetryKey] = useState(0);

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
        console.log(`Fetching chart data for symbol: ${symbol}, period: ${selectedPeriod}`);

        const endDate = new Date();
        const startDate = new Date();
        let formatted: any[] = [];

        switch (selectedPeriod) {
          case "1d":
            // Use intraday data for 1 day
            try {
              console.log("Attempting to fetch intraday data from API...");
              const intradayData = await api.getStockIntradayData(symbol);
              console.log("Intraday data response from API:", intradayData);
              
              // Handle both graphData and grapthData (API typo)
              const graphDataArray = intradayData?.graphData || intradayData?.grapthData;
              
              if (graphDataArray && Array.isArray(graphDataArray) && graphDataArray.length > 0) {
                // Group into 5-minute intervals for candlesticks
                const grouped: { [key: string]: any } = {};
                
                graphDataArray.forEach((dataPoint: any) => {
                  // Handle both [timestamp, price] and {timestamp, price, volume} formats
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
                    return; // Skip invalid data
                  }
                  
                  if (!timestamp || !price || price <= 0) return; // Skip invalid data
                  
                  const date = new Date(timestamp);
                  // Round to 5-minute intervals
                  const minutes = date.getMinutes();
                  const roundedMinutes = Math.floor(minutes / 5) * 5;
                  const groupKey = new Date(date);
                  groupKey.setMinutes(roundedMinutes, 0, 0);
                  const key = groupKey.getTime();

                  if (!grouped[key]) {
                    grouped[key] = {
                      date: groupKey,
                      open: price,
                      high: price,
                      low: price,
                      close: price,
                      volume: volume,
                      prices: [price],
                    };
                  } else {
                    grouped[key].high = Math.max(grouped[key].high, price);
                    grouped[key].low = Math.min(grouped[key].low, price);
                    grouped[key].close = price;
                    grouped[key].volume += volume; // Accumulate volume
                    grouped[key].prices.push(price);
                  }
                });

                formatted = Object.values(grouped)
                  .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
                  .map((item: any) => ({
                    date: item.date,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume, // Use actual volume from API
                  }));

                console.log(`Processed ${formatted.length} intraday data points from API`);
                
                if (formatted.length > 0) {
                  setChartData(formatted);
                  setLoading(false);
                  return;
                }
              } else {
                console.log("Intraday data from API is invalid or empty, trying historical data");
              }
            } catch (intradayError: any) {
              console.warn("Intraday data not available from API, trying historical data:", intradayError?.message);
            }
            startDate.setDate(startDate.getDate() - 1);
            break;
          case "5d":
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
        console.log(`Fetching historical data from ${dateStart} to ${dateEnd}`);

        try {
          const historicalData = await api.getStockHistoricalData(symbol, dateStart, dateEnd);
          console.log("Historical data response:", historicalData);
          console.log("Historical data type:", typeof historicalData, "Is array:", Array.isArray(historicalData));
          
          // Log full response for debugging
          console.log("Full API response structure:", JSON.stringify(historicalData, null, 2).substring(0, 1000));

          if (Array.isArray(historicalData) && historicalData.length > 0) {
            console.log("First item structure:", Object.keys(historicalData[0] || {}));
            console.log("First item:", historicalData[0]);
          }

          // Handle different API response structures
          if (Array.isArray(historicalData)) {
            historicalData.forEach((period: any, periodIndex: number) => {
              console.log(`Processing period ${periodIndex}:`, period);
              console.log(`Period ${periodIndex} keys:`, period ? Object.keys(period) : 'null');
              
              // First try: period has a data array
              if (period?.data && Array.isArray(period.data)) {
                console.log(`Period ${periodIndex} has data array with ${period.data.length} items`);
                period.data.forEach((item: any, itemIndex: number) => {
                  const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp || item.time;
                  const open = item.CH_OPENING_PRICE || item.OPEN || item.open || item.o;
                  const high = item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || item.h;
                  const low = item.CH_TRADE_LOW_PRICE || item.LOW || item.low || item.l;
                  const close = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || item.c;
                  const volume = item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || item.v || 0;

                  // Only add if we have valid timestamp and at least one price value
                  if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                    formatted.push({
                      date: new Date(timestamp),
                      open: open !== undefined && open !== null ? open : (close || high || low || 0),
                      high: high !== undefined && high !== null ? high : (close || open || low || 0),
                      low: low !== undefined && low !== null ? low : (close || open || high || 0),
                      close: close !== undefined && close !== null ? close : (open || high || low || 0),
                      volume: volume,
                    });
                  } else if (itemIndex === 0) {
                    console.log(`Skipping item ${itemIndex} - missing data:`, { timestamp, open, high, low, close, item });
                  }
                });
              } else if (Array.isArray(period)) {
                // Case 2: Period is directly an array of data points
                console.log(`Period ${periodIndex} is an array with ${period.length} items`);
                period.forEach((item: any, itemIndex: number) => {
                  const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp || item.time;
                  const open = item.CH_OPENING_PRICE || item.OPEN || item.open || item.o;
                  const high = item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || item.h;
                  const low = item.CH_TRADE_LOW_PRICE || item.LOW || item.low || item.l;
                  const close = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || item.c;
                  const volume = item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || item.v || 0;

                  if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                    formatted.push({
                      date: new Date(timestamp),
                      open: open !== undefined && open !== null ? open : (close || high || low || 0),
                      high: high !== undefined && high !== null ? high : (close || open || low || 0),
                      low: low !== undefined && low !== null ? low : (close || open || high || 0),
                      close: close !== undefined && close !== null ? close : (open || high || low || 0),
                      volume: volume,
                    });
                  } else if (itemIndex === 0) {
                    console.log(`Skipping array item ${itemIndex} - missing data:`, { timestamp, open, high, low, close, item });
                  }
                });
              } else if (period && typeof period === 'object') {
                // Case 3: Period is a single data object
                console.log(`Period ${periodIndex} is a single object:`, Object.keys(period));
                const timestamp = period.CH_TIMESTAMP || period.TIMESTAMP || period.date || period.timestamp || period.time;
                const open = period.CH_OPENING_PRICE || period.OPEN || period.open || period.o;
                const high = period.CH_TRADE_HIGH_PRICE || period.HIGH || period.high || period.h;
                const low = period.CH_TRADE_LOW_PRICE || period.LOW || period.low || period.l;
                const close = period.CH_LAST_TRADED_PRICE || period.CH_CLOSING_PRICE || period.CLOSE || period.close || period.c;
                const volume = period.CH_TOT_TRADED_QTY || period.VOLUME || period.volume || period.v || 0;

                if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                  formatted.push({
                    date: new Date(timestamp),
                    open: open !== undefined && open !== null ? open : (close || high || low || 0),
                    high: high !== undefined && high !== null ? high : (close || open || low || 0),
                    low: low !== undefined && low !== null ? low : (close || open || high || 0),
                    close: close !== undefined && close !== null ? close : (open || high || low || 0),
                    volume: volume,
                  });
                } else {
                  console.log(`Skipping period object - missing data:`, { timestamp, open, high, low, close, period });
                }
              } else {
                // Last resort: Try to parse period as a data point itself
                console.log(`Period ${periodIndex} doesn't match expected formats, trying as data point`);
                const timestamp = period?.CH_TIMESTAMP || period?.TIMESTAMP || period?.date || period?.timestamp || period?.time || period?.CH_DATE;
                const open = period?.CH_OPENING_PRICE || period?.OPEN || period?.open || period?.o;
                const high = period?.CH_TRADE_HIGH_PRICE || period?.HIGH || period?.high || period?.h;
                const low = period?.CH_TRADE_LOW_PRICE || period?.LOW || period?.low || period?.l;
                const close = period?.CH_LAST_TRADED_PRICE || period?.CH_CLOSING_PRICE || period?.CLOSE || period?.close || period?.c;
                const volume = period?.CH_TOT_TRADED_QTY || period?.VOLUME || period?.volume || period?.v || 0;

                if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                  formatted.push({
                    date: new Date(timestamp),
                    open: open !== undefined && open !== null ? open : (close || high || low || 0),
                    high: high !== undefined && high !== null ? high : (close || open || low || 0),
                    low: low !== undefined && low !== null ? low : (close || open || high || 0),
                    close: close !== undefined && close !== null ? close : (open || high || low || 0),
                    volume: volume,
                  });
                  console.log(`Successfully parsed period ${periodIndex} as data point`);
                } else {
                  console.log(`Period ${periodIndex} is not in expected format and cannot be parsed:`, typeof period, period);
                }
              }
            });
          } else if (historicalData && typeof historicalData === 'object' && !Array.isArray(historicalData)) {
            // Case 4: Single object with data array
            console.log("Historical data is an object, checking for data array...");
            if (historicalData.data && Array.isArray(historicalData.data)) {
              console.log(`Found data array with ${historicalData.data.length} items`);
              historicalData.data.forEach((item: any, itemIndex: number) => {
                const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp || item.time;
                const open = item.CH_OPENING_PRICE || item.OPEN || item.open || item.o;
                const high = item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || item.h;
                const low = item.CH_TRADE_LOW_PRICE || item.LOW || item.low || item.l;
                const close = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || item.c;
                const volume = item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || item.v || 0;

                if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                  formatted.push({
                    date: new Date(timestamp),
                    open: open !== undefined && open !== null ? open : (close || high || low || 0),
                    high: high !== undefined && high !== null ? high : (close || open || low || 0),
                    low: low !== undefined && low !== null ? low : (close || open || high || 0),
                    close: close !== undefined && close !== null ? close : (open || high || low || 0),
                    volume: volume,
                  });
                } else if (itemIndex === 0) {
                  console.log(`Skipping data item ${itemIndex} - missing data:`, { timestamp, open, high, low, close, item });
                }
              });
            } else {
              // Try to parse the object itself as a data point
              console.log("No data array found, trying to parse object as single data point");
              const timestamp = historicalData.CH_TIMESTAMP || historicalData.TIMESTAMP || historicalData.date || historicalData.timestamp || historicalData.time;
              const open = historicalData.CH_OPENING_PRICE || historicalData.OPEN || historicalData.open || historicalData.o;
              const high = historicalData.CH_TRADE_HIGH_PRICE || historicalData.HIGH || historicalData.high || historicalData.h;
              const low = historicalData.CH_TRADE_LOW_PRICE || historicalData.LOW || historicalData.low || historicalData.l;
              const close = historicalData.CH_LAST_TRADED_PRICE || historicalData.CH_CLOSING_PRICE || historicalData.CLOSE || historicalData.close || historicalData.c;
              const volume = historicalData.CH_TOT_TRADED_QTY || historicalData.VOLUME || historicalData.volume || historicalData.v || 0;

              if (timestamp && (open !== undefined && open !== null || high !== undefined && high !== null || low !== undefined && low !== null || close !== undefined && close !== null)) {
                formatted.push({
                  date: new Date(timestamp),
                  open: open !== undefined && open !== null ? open : (close || high || low || 0),
                  high: high !== undefined && high !== null ? high : (close || open || low || 0),
                  low: low !== undefined && low !== null ? low : (close || open || high || 0),
                  close: close !== undefined && close !== null ? close : (open || high || low || 0),
                  volume: volume,
                });
              } else {
                console.log("Object doesn't contain valid data:", Object.keys(historicalData));
              }
            }
          }

          console.log(`Processed ${formatted.length} historical data points from API`);

          // If we still have no data, create fallback using current stock details
          if (formatted.length === 0 && (open > 0 || high > 0 || low > 0 || close > 0)) {
            console.log("No API data available, creating fallback from stock details");
            const now = new Date();
            const fallbackData = {
              date: now,
              open: open || close || high || low,
              high: high || close || open || low,
              low: low || close || open || high,
              close: close || open || high || low,
              volume: 0,
            };
            formatted = [fallbackData];
            console.log("Using fallback data:", fallbackData);
          }

          if (formatted.length === 0) {
            console.warn("API returned no historical data and no fallback available");
            throw new Error("No historical data available from API for this symbol");
          }
        } catch (historicalError: any) {
          console.error("Error fetching historical data from API:", historicalError);
          
          // Create fallback data from stock details as last resort
          if ((open > 0 || high > 0 || low > 0 || close > 0) && formatted.length === 0) {
            console.log("Creating fallback data from stock details due to API error");
            const now = new Date();
            formatted = [{
              date: now,
              open: open || close || high || low,
              high: high || close || open || low,
              low: low || close || open || high,
              close: close || open || high || low,
              volume: 0,
            }];
            console.log("Using fallback data after error:", formatted[0]);
          } else {
            throw historicalError; // Re-throw if we can't create fallback
          }
        }

        formatted.sort((a, b) => a.date.getTime() - b.date.getTime());
        const limitedData =
          formatted.length > 500
            ? formatted.filter((_, i) => i % Math.ceil(formatted.length / 500) === 0)
            : formatted;

        console.log(`Final chart data points: ${limitedData.length}`);
        
        if (limitedData.length > 0) {
          setChartData(limitedData);
          setError(null);
        } else {
          throw new Error("No chart data available for this symbol and time period");
        }
      } catch (err: any) {
        console.error("Error fetching chart data:", err);
        const errorMessage = err?.message || "Failed to load chart data";
        
        // Check if we have current stock data to display
        if (open > 0 || high > 0 || low > 0 || close > 0) {
          console.log("Using current stock data as fallback");
          const now = new Date();
          setChartData([{
            date: now,
            open: open || close || high || low,
            high: high || close || open || low,
            low: low || close || open || high,
            close: close || open || high || low,
            volume: 0,
          }]);
          setError("Limited data: Showing current price only. Historical data unavailable.");
        } else {
          setError(`${errorMessage}. Troubleshooting: 1) Verify symbol "${symbol}" is valid, 2) Check backend at ${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}, 3) Ensure API endpoint is accessible.`);
          setChartData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();

  }, [symbol, selectedPeriod, retryKey]); // Remove open, high, low, close from dependencies

  // Calculate price range and average volume from API data
  const priceRange = useMemo(() => {
    if (chartData.length === 0) {
      // If no data, return default range (will be used for error state)
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
    return chartData.reduce((sum, item) => sum + (item.volume || 0), 0) / chartData.length;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      setHoveredData(data);
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
          <p className="text-xs text-gray-600 mb-2">
            {format(new Date(label), selectedPeriod === "1d" ? "MMM dd, HH:mm" : "MMM dd, yyyy")}
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
            {data.volume && (
              <div className="flex justify-between gap-4 pt-1 border-t">
                <span className="text-xs text-gray-600">Volume:</span>
                <span className="text-xs font-semibold">
                  {data.volume >= 1000
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

  if (error && chartData.length > 0) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <p className="text-xs text-yellow-800">⚠️ {error}</p>
        </div>
        {/* Stock Info Header */}
        {/* ...existing header code... */}
        {/* ...existing chart code... */}
      </div>
    );
  }

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

  // Show error if API failed and we have no data
  if (error && chartData.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-2xl px-4">
          <p className="text-xl font-semibold text-gray-900 mb-2">Chart data not available</p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
            <p className="text-xs text-gray-600 mb-2 font-semibold">Troubleshooting:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Symbol: <span className="font-mono">{symbol}</span></li>
              <li>Backend URL: <span className="font-mono">{import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}</span></li>
              <li>Ensure the backend API is running</li>
              <li>Check if the symbol is valid and exists in the API</li>
              <li>Verify the API endpoint is accessible</li>
            </ul>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              setChartData([]);
              // Trigger re-fetch by incrementing retryKey
              setRetryKey(prev => prev + 1);
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
  
  // Show loading state
  if (loading && chartData.length === 0) {
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
  
  // If no data and no error, show loading
  if (chartData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading chart data from API...</p>
        </div>
      </div>
    );
  }

  // Prepare data for chart
  const chartDataWithOHLC = chartData.map((item) => ({
    ...item,
    value: item.close,
    isUp: item.close >= item.open,
    // Calculate range for error bar visualization
    highError: item.high - item.close,
    lowError: item.close - item.low,
  }));

  const yAxisDomain = [
    priceRange.min - priceRange.range * 0.02,
    priceRange.max + priceRange.range * 0.02,
  ];

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
            {averageVolume >= 1000 ? `${(averageVolume / 1000).toFixed(2)}K` : averageVolume.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Chart Area - Using bars with error bars to simulate candlesticks */}
      <div className="flex-1 relative" style={{ minHeight: "500px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartDataWithOHLC}
            margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
          >
            <defs>
              <linearGradient id="volumeGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="volumeGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={false}
              axisLine={false}
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) =>
                format(new Date(value), selectedPeriod === "1d" ? "HH:mm" : "MMM dd")
              }
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={false}
              axisLine={false}
              domain={yAxisDomain}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={false}
              axisLine={false}
              domain={[0, "dataMax * 1.2"]}
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
            {/* Reference line for current price */}
            <ReferenceLine
              yAxisId="price"
              y={currentPrice}
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            {/* Price line for reference */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={1}
              dot={false}
              strokeOpacity={0.3}
            />
            {/* Simplified price visualization - using line chart for now */}
            {/* In a production app, you'd use a proper candlestick library like lightweight-charts */}
            {/* Volume bars */}
            <Bar yAxisId="volume" dataKey="volume" fill="url(#volumeGradientUp)" opacity={0.6}>
              {chartDataWithOHLC.map((entry, index) => (
                <Cell
                  key={`volume-${index}`}
                  fill={entry.isUp ? "#10b981" : "#ef4444"}
                  fillOpacity={0.6}
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
