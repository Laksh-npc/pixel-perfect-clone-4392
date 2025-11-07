import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

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
  const [selectedPeriod, setSelectedPeriod] = useState("1D");
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
          case "1D":
            // Use intraday data for 1D
            const intradayData = await api.getStockIntradayData(symbol);
            if (intradayData?.graphData) {
              const formatted = intradayData.graphData.map(([timestamp, price]: [number, number]) => ({
                date: new Date(timestamp),
                price,
              }));
              setChartData(formatted);
              setLoading(false);
              return;
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
            if (period?.data) {
              period.data.forEach((item: any) => {
                formattedData.push({
                  date: new Date(item.CH_TIMESTAMP || item.TIMESTAMP),
                  price: item.CH_LAST_TRADED_PRICE || item.CH_CLOSING_PRICE || 0,
                  open: item.CH_OPENING_PRICE || 0,
                  high: item.CH_TRADE_HIGH_PRICE || 0,
                  low: item.CH_TRADE_LOW_PRICE || 0,
                  volume: item.CH_TOT_TRADED_QTY || 0,
                });
              });
            }
          });
        }

        // Sort by date and limit data points for better performance
        formattedData.sort((a, b) => a.date.getTime() - b.date.getTime());
        const limitedData = formattedData.length > 500 
          ? formattedData.filter((_, i) => i % Math.ceil(formattedData.length / 500) === 0)
          : formattedData;

        setChartData(limitedData);
      } catch (err: any) {
        setError(err?.message || "Failed to load chart data");
        console.error("Error fetching chart data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, selectedPeriod]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || chartData.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chart data not available</p>
        </div>
      </div>
    );
  }

  // Determine if price is going up or down
  const firstPrice = chartData[0]?.price || 0;
  const lastPrice = chartData[chartData.length - 1]?.price || 0;
  const isPositive = lastPrice >= firstPrice;

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {timePeriods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
                className={selectedPeriod === period.value ? "bg-primary" : ""}
              >
                {period.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Button>
            <Button variant="outline" size="sm">
              Terminal
            </Button>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="date"
              tick={false}
              axisLine={false}
            />
            <YAxis
              tick={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
              formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Price"]}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;

