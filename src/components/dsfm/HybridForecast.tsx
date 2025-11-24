import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { NIFTY50_TICKERS } from "@/services/dsfm/dataFetcher";
import { runHybridForecast, ForecastResult } from "@/services/dsfm/forecastService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

interface HybridForecastProps {
  stockData?: any[]; // Optional: can use pre-loaded data
}

const HybridForecast = ({ stockData }: HybridForecastProps) => {
  const [selectedStock, setSelectedStock] = useState<string>(NIFTY50_TICKERS[0]);
  const [p, setP] = useState<number>(1);
  const [d, setD] = useState<number>(0);
  const [q, setQ] = useState<number>(1);
  const [arch, setArch] = useState<number>(1);
  const [garch, setGarch] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunForecast = async () => {
    setLoading(true);
    setError(null);
    setForecastResult(null);

    try {
      const result = await runHybridForecast({
        symbol: selectedStock,
        p,
        d,
        q,
        arch,
        garch,
        days: 90,
      });
      setForecastResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to run forecast");
      console.error("Forecast error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare plot data
  const plotData = useMemo(() => {
    if (!forecastResult) return [];

    const chartData = forecastResult.historical_returns.map((r, i) => ({
      date: r.date,
      return: r.return,
      garchVol: forecastResult.garch_volatility[i]?.volatility || 0,
      arimaMean: forecastResult.arima_mean_series[i]?.mean || 0,
      ciLower: forecastResult.ci_lower,
      ciUpper: forecastResult.ci_upper,
      predictedReturn: null,
      predictedVol: null,
    }));

    // Add forecast point
    chartData.push({
      date: forecastResult.forecast_date,
      return: null,
      garchVol: null,
      arimaMean: null,
      ciLower: forecastResult.ci_lower,
      ciUpper: forecastResult.ci_upper,
      predictedReturn: forecastResult.arima_mean,
      predictedVol: forecastResult.garch_vol,
    });

    return chartData;
  }, [forecastResult]);

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Hybrid Forecast (ARIMA + GARCH)</h3>
        <p className="text-sm text-gray-600">
          Forecast next-day returns using ARIMA for mean prediction and GARCH for volatility estimation.
        </p>
      </div>

      {/* Controls - Compact horizontal layout */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Stock Selection */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-gray-600 mb-1 block">Ticker</Label>
          <Select value={selectedStock} onValueChange={setSelectedStock}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NIFTY50_TICKERS.map((ticker) => (
                <SelectItem key={ticker} value={ticker}>
                  {ticker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ARIMA Parameters */}
        <div className="flex gap-2">
          <div className="w-16">
            <Label className="text-xs text-gray-600 mb-1 block">p</Label>
            <Input
              type="number"
              min="0"
              max="5"
              value={p}
              onChange={(e) => setP(parseInt(e.target.value) || 0)}
              className="h-9 text-sm text-center"
            />
          </div>
          <div className="w-16">
            <Label className="text-xs text-gray-600 mb-1 block">d</Label>
            <Input
              type="number"
              min="0"
              max="2"
              value={d}
              onChange={(e) => setD(parseInt(e.target.value) || 0)}
              className="h-9 text-sm text-center"
            />
          </div>
          <div className="w-16">
            <Label className="text-xs text-gray-600 mb-1 block">q</Label>
            <Input
              type="number"
              min="0"
              max="5"
              value={q}
              onChange={(e) => setQ(parseInt(e.target.value) || 0)}
              className="h-9 text-sm text-center"
            />
          </div>
        </div>

        {/* GARCH Parameters */}
        <div className="flex gap-2">
          <div className="w-16">
            <Label className="text-xs text-gray-600 mb-1 block">ARCH</Label>
            <Input
              type="number"
              min="1"
              max="3"
              value={arch}
              onChange={(e) => setArch(parseInt(e.target.value) || 1)}
              className="h-9 text-sm text-center"
            />
          </div>
          <div className="w-16">
            <Label className="text-xs text-gray-600 mb-1 block">GARCH</Label>
            <Input
              type="number"
              min="1"
              max="3"
              value={garch}
              onChange={(e) => setGarch(parseInt(e.target.value) || 1)}
              className="h-9 text-sm text-center"
            />
          </div>
        </div>
      </div>

      {/* Run Button */}
      <Button
        onClick={handleRunForecast}
        disabled={loading}
        className="w-full md:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Running Forecast...
          </>
        ) : (
          "Run Hybrid Forecast"
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {/* Forecast Results */}
      {forecastResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="text-xs font-semibold text-blue-900 mb-1">ARIMA Predicted Return</h4>
              <div className="text-2xl font-bold text-blue-700">
                {forecastResult.arima_mean.toFixed(2)}%
              </div>
              <p className="text-xs text-blue-600 mt-1">Next-day mean return</p>
            </Card>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <h4 className="text-xs font-semibold text-yellow-900 mb-1">GARCH Predicted Volatility</h4>
              <div className="text-2xl font-bold text-yellow-700">
                {forecastResult.garch_vol.toFixed(2)}%
              </div>
              <p className="text-xs text-yellow-600 mt-1">Next-day volatility (σ)</p>
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <h4 className="text-xs font-semibold text-purple-900 mb-1">95% Confidence Interval</h4>
              <div className="text-sm font-medium text-purple-700">
                [{forecastResult.ci_lower.toFixed(2)}%, {forecastResult.ci_upper.toFixed(2)}%]
              </div>
              <p className="text-xs text-purple-600 mt-1">Expected range</p>
            </Card>
          </div>

          {/* Forecast Plot */}
          {plotData.length > 0 && (
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-4">Forecast Visualization</h4>
              <div style={{ width: '100%', height: '500px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={plotData} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                    <defs>
                      <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{ value: 'Returns (%)', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Volatility σ(t) (%)', angle: 90, position: 'insideRight' }}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'isForecast') return null;
                        return [`${Number(value).toFixed(2)}%`, name];
                      }}
                    />
                    <Legend />
                    {/* 95% CI Region (Area) */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="ciUpper"
                      stroke="none"
                      fill="url(#ciGradient)"
                      name="95% CI"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="ciLower"
                      stroke="none"
                      fill="url(#ciGradient)"
                    />
                    {/* Historical Returns (blue line) */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="return"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Historical Returns"
                      dot={false}
                      connectNulls
                    />
                    {/* GARCH Volatility (yellow line) */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="garchVol"
                      stroke="#eab308"
                      strokeWidth={2}
                      name="GARCH σ(t)"
                      dot={false}
                      connectNulls
                    />
                    {/* ARIMA Mean (purple dashed) */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="arimaMean"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="ARIMA Mean"
                      dot={false}
                      connectNulls
                    />
                    {/* Forecast point - Return (purple dot) */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="predictedReturn"
                      stroke="none"
                      dot={{ fill: '#a855f7', r: 8, strokeWidth: 2, stroke: '#fff' }}
                      name="Predicted Return"
                      connectNulls
                    />
                    {/* Forecast point - Volatility (red dot) */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="predictedVol"
                      stroke="none"
                      dot={{ fill: '#ef4444', r: 8, strokeWidth: 2, stroke: '#fff' }}
                      name="Predicted Volatility"
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>• Blue line: Historical returns</p>
                <p>• Yellow line: GARCH volatility σ(t)</p>
                <p>• Purple dashed line: ARIMA mean</p>
                <p>• Purple shaded region: 95% confidence interval</p>
                <p>• Purple dot: Predicted next-day return</p>
                <p>• Red dot: Predicted next-day volatility</p>
              </div>
            </Card>
          )}

          {/* Textual Summary */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h4 className="text-sm font-semibold mb-3">Forecast Interpretation</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>ARIMA Model:</strong> Predicts the directional move (mean return) by modeling
                autoregressive and moving average components of the return series.
              </p>
              <p>
                <strong>GARCH Model:</strong> Predicts risk/volatility by modeling time-varying variance,
                capturing volatility clustering effects.
              </p>
              <p>
                <strong>Hybrid Approach:</strong> Combines ARIMA's mean forecast with GARCH's volatility
                estimate to provide both expected return and uncertainty band.
              </p>
              <div className="mt-4 p-3 bg-white border border-gray-300 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  <strong>Example:</strong> For the next trading day ({forecastResult.forecast_date}),{" "}
                  <strong>{selectedStock.replace('.NS', '')}</strong> has an expected return of{" "}
                  <strong>{forecastResult.arima_mean.toFixed(2)}%</strong> with volatility{" "}
                  <strong>{forecastResult.garch_vol.toFixed(2)}%</strong>. The 95% confidence interval
                  implies the stock may move between{" "}
                  <strong className="text-red-600">{forecastResult.ci_lower.toFixed(2)}%</strong> and{" "}
                  <strong className="text-green-600">{forecastResult.ci_upper.toFixed(2)}%</strong>.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </Card>
  );
};

export default HybridForecast;

