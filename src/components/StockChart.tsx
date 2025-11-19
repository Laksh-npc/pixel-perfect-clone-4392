import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";

// Custom formatter for time-based X-axis
const formatXAxis = (tickItem: any, selectedPeriod: string) => {
  if (!tickItem) return "";
  try {
    const date = tickItem instanceof Date ? tickItem : new Date(tickItem);
    if (isNaN(date.getTime())) return "";
    
    if (selectedPeriod === "1D") {
      return format(date, "HH:mm");
    } else if (selectedPeriod === "1W" || selectedPeriod === "1M") {
      return format(date, "MMM dd");
    } else {
      return format(date, "MMM yyyy");
    }
  } catch {
    return "";
  }
};

interface StockChartProps {
  symbol: string;
}

const timePeriods = [
  { label: "NSE", value: "NSE" },
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "3Y", value: "3Y" },
  { label: "5Y", value: "5Y" },
];

const StockChart = ({ symbol }: StockChartProps) => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("6M");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        let dateStart: string | undefined;
        const endDate = new Date();
        const startDate = new Date();

        // Calculate date range based on selected period
        switch (selectedPeriod) {
          case "NSE":
            // NSE typically shows 1 day data, same as 1D
            startDate.setDate(startDate.getDate() - 1);
            break;
          case "1D":
            // Use intraday data for 1D
            try {
              const intradayData = await api.getStockIntradayData(symbol);
              // Handle both graphData and grapthData (API typo)
              const graphDataArray = intradayData?.graphData || intradayData?.grapthData;
              
              if (graphDataArray && Array.isArray(graphDataArray) && graphDataArray.length > 0) {
                // Map actual timestamp-price pairs without interpolation
                const formatted = graphDataArray
                  .map((dataPoint: any) => {
                    // Handle both [timestamp, price] and {timestamp, price} formats
                    let timestamp: number;
                    let price: number;
                    
                    if (Array.isArray(dataPoint)) {
                      [timestamp, price] = dataPoint;
                    } else if (dataPoint.timestamp && dataPoint.price) {
                      timestamp = dataPoint.timestamp;
                      price = dataPoint.price;
                    } else {
                      return null;
                    }
                    
                    if (!timestamp || !price || price <= 0) return null;
                    
                    return {
                      date: timestamp, // Use numeric timestamp for proper time scale
                      price,
                      timestamp, // Keep original timestamp for sorting
                      displayDate: new Date(timestamp), // For display purposes
                    };
                  })
                  .filter((item: any) => item !== null) // Remove invalid entries
                  .sort((a: any, b: any) => a.timestamp - b.timestamp); // Sort by timestamp
                
                if (formatted.length > 0) {
                  setChartData(formatted);
                  setLoading(false);
                  return;
                }
              }
            } catch (intradayError: any) {
              console.warn("Intraday data not available, trying historical data:", intradayError?.message);
            }
            // Fallback to historical if intraday not available
            startDate.setDate(startDate.getDate() - 1);
            break;
          case "1W":
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "1M":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case "3M":
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case "6M":
            startDate.setMonth(startDate.getMonth() - 6);
            break;
          case "1Y":
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case "3Y":
            startDate.setFullYear(startDate.getFullYear() - 3);
            break;
          case "5Y":
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
          default:
            startDate.setDate(startDate.getDate() - 1);
        }

        dateStart = format(startDate, "yyyy-MM-dd");
        const dateEnd = format(endDate, "yyyy-MM-dd");

        const historicalData = await api.getStockHistoricalData(symbol, dateStart, dateEnd);
        
        // Format historical data for chart
        const formattedData: any[] = [];
        if (Array.isArray(historicalData)) {
          historicalData.forEach((period: any) => {
            if (period?.data && Array.isArray(period.data)) {
              period.data.forEach((item: any) => {
                const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp;
                if (!timestamp) return;
                
                // Convert to numeric timestamp
                const dateValue = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
                if (isNaN(dateValue)) return;
                
                const price = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || 0;
                if (!price || price <= 0) return;
                
                formattedData.push({
                  date: dateValue, // Use numeric timestamp for consistency
                  price: price,
                  timestamp: dateValue, // Keep for sorting
                  open: item.CH_OPENING_PRICE || item.OPEN || item.open || 0,
                  high: item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || 0,
                  low: item.CH_TRADE_LOW_PRICE || item.LOW || item.low || 0,
                  volume: item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || 0,
                });
              });
            } else if (Array.isArray(period)) {
              // Handle case where period is directly an array
              period.forEach((item: any) => {
                const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp;
                if (!timestamp) return;
                
                const dateValue = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
                if (isNaN(dateValue)) return;
                
                const price = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || 0;
                if (!price || price <= 0) return;
                
                formattedData.push({
                  date: dateValue,
                  price: price,
                  timestamp: dateValue,
                  open: item.CH_OPENING_PRICE || item.OPEN || item.open || 0,
                  high: item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || 0,
                  low: item.CH_TRADE_LOW_PRICE || item.LOW || item.low || 0,
                  volume: item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || 0,
                });
              });
            }
          });
        } else if (historicalData && typeof historicalData === 'object' && !Array.isArray(historicalData)) {
          // Handle case where historicalData is an object with a data property
          if (historicalData.data && Array.isArray(historicalData.data)) {
            historicalData.data.forEach((item: any) => {
              const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.date || item.timestamp;
              if (!timestamp) return;
              
              const dateValue = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
              if (isNaN(dateValue)) return;
              
              const price = item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || item.CLOSE || item.close || 0;
              if (!price || price <= 0) return;
              
              formattedData.push({
                date: dateValue,
                price: price,
                timestamp: dateValue,
                open: item.CH_OPENING_PRICE || item.OPEN || item.open || 0,
                high: item.CH_TRADE_HIGH_PRICE || item.HIGH || item.high || 0,
                low: item.CH_TRADE_LOW_PRICE || item.LOW || item.low || 0,
                volume: item.CH_TOT_TRADED_QTY || item.VOLUME || item.volume || 0,
              });
            });
          }
        }

        // Sort by timestamp and limit data points for better performance
        formattedData.sort((a, b) => a.timestamp - b.timestamp);
        const limitedData = formattedData.length > 500 
          ? formattedData.filter((_, i) => i % Math.ceil(formattedData.length / 500) === 0)
          : formattedData;

        if (limitedData.length > 0) {
          setChartData(limitedData);
        } else {
          throw new Error("No historical data available for the selected period");
        }
      } catch (err: any) {
        const errorMessage = err?.message || "Failed to load chart data";
        setError(errorMessage);
        console.error("Error fetching chart data:", err);
        setChartData([]); // Clear chart data on error
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, selectedPeriod]);

  // Determine if price is going up or down - calculate before early returns
  const isPositive = useMemo(() => {
    if (chartData.length === 0) return true;
    const firstPrice = chartData[0]?.price || 0;
    const lastPrice = chartData[chartData.length - 1]?.price || 0;
    return lastPrice >= firstPrice;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateFormat = selectedPeriod === "1D" ? "MMM dd, HH:mm:ss" : "MMM dd, yyyy";
      // Handle both numeric timestamp and Date object
      const dateValue = typeof label === 'number' ? new Date(label) : (label instanceof Date ? label : new Date(label));
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-xs text-gray-600 mb-1">{format(dateValue, dateFormat)}</p>
          <p className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            ₹{Number(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomActiveDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={isPositive ? "#10b981" : "#ef4444"} className="drop-shadow-lg" />
        <circle cx={cx} cy={cy} r={3} fill="white" />
      </g>
    );
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chart data not available: {error}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="border border-gray-200 rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5 flex-wrap">
            {timePeriods.map((period) => (
              <Button
                key={period.value}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
                className={`h-8 px-3 text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === period.value
                    ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-gray-600 hover:bg-gray-100 transition-colors duration-200">
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => navigate(`/terminal/${symbol}`)}
            >
              Terminal
            </Button>
          </div>
        </div>
      </div>

      <div className="h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tick={selectedPeriod === "1D" ? { fontSize: 11, fill: "#666" } : { fontSize: 11, fill: "#666" }}
              tickFormatter={(value) => formatXAxis(value, selectedPeriod)}
              axisLine={false}
            />
            <YAxis
              tick={false}
              axisLine={false}
              domain={['dataMin - dataMin * 0.02', 'dataMax + dataMax * 0.02']}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: isPositive ? "#10b981" : "#ef4444", strokeWidth: 1, strokeDasharray: "5 5" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={selectedPeriod === "1D" ? 2 : 2.5}
              dot={false}
              activeDot={<CustomActiveDot />}
              animationDuration={300}
              connectNulls={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;

