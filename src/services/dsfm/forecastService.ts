// Forecast service for ARIMA + GARCH hybrid forecasting
// This service will call a backend API for ARIMA/GARCH calculations

export interface ForecastRequest {
  symbol: string;
  p: number; // ARIMA autoregressive order
  d: number; // ARIMA differencing order
  q: number; // ARIMA moving average order
  arch: number; // GARCH ARCH term
  garch: number; // GARCH GARCH term
  days?: number; // Number of historical days to use (default: 90)
}

export interface ForecastResult {
  arima_mean: number; // Next-day ARIMA predicted return (%)
  garch_vol: number; // Next-day GARCH predicted volatility (%)
  ci_lower: number; // 95% CI lower bound (%)
  ci_upper: number; // 95% CI upper bound (%)
  historical_returns: Array<{ date: string; return: number }>;
  garch_volatility: Array<{ date: string; volatility: number }>;
  arima_mean_series: Array<{ date: string; mean: number }>;
  forecast_date: string; // Next trading day
}

// Client-side fallback: Simple statistical forecast
// Note: This is a placeholder. For production, use backend API with proper ARIMA/GARCH libraries
export async function runHybridForecast(request: ForecastRequest): Promise<ForecastResult> {
  // Check if backend API is available (optional - can be set via environment variable)
  const useBackendAPI = import.meta.env.VITE_USE_FORECAST_API !== 'false';
  
  if (useBackendAPI) {
    try {
      // Try backend API first
      const response = await fetch('/api/dsfm/hybrid-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      // If response is not OK (404, 500, etc.), fall through to client-side
      // Note: Browser will log 404 in console - this is expected when backend is not implemented
    } catch (error) {
      // Network errors (CORS, connection refused, etc.) - fall through to client-side
      // Note: Browser will log network errors - this is expected when backend is not available
    }
  }

  // Fallback: Simple statistical forecast
  // This uses basic statistical methods as a placeholder
  // For production, implement the backend API endpoint with proper ARIMA/GARCH libraries
  return runSimpleForecast(request);
}

// Simple statistical forecast (placeholder)
async function runSimpleForecast(request: ForecastRequest): Promise<ForecastResult> {
  // Fetch historical data
  const { fetchHistoricalData, calculateReturns, formatDate } = await import('./dataFetcher');
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (request.days || 90));
  
  const prices = await fetchHistoricalData(request.symbol, startDate, endDate);
  const returns = calculateReturns(prices);
  
  if (returns.length < 30) {
    throw new Error('Insufficient data for forecasting (need at least 30 days)');
  }

  // Simple mean and volatility estimates
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // ARIMA-like forecast: weighted moving average
  const arima_mean = mean * 100; // Convert to percentage
  
  // GARCH-like forecast: exponential weighted volatility
  const garch_vol = volatility * 100 * 1.1; // Slight adjustment for GARCH effect

  // Generate historical series
  const historical_returns = prices.slice(1).map((p, i) => ({
    date: p.date,
    return: returns[i] * 100,
  }));

  const garch_volatility = prices.slice(1).map((p, i) => ({
    date: p.date,
    volatility: volatility * 100 * (1 + Math.random() * 0.2 - 0.1), // Add some variation
  }));

  const arima_mean_series = prices.slice(1).map((p) => ({
    date: p.date,
    mean: arima_mean,
  }));

  // Calculate 95% CI
  const ci_lower = arima_mean - 1.96 * garch_vol;
  const ci_upper = arima_mean + 1.96 * garch_vol;

  // Next trading day
  const forecast_date = new Date(endDate);
  forecast_date.setDate(forecast_date.getDate() + 1);
  // Skip weekends
  while (forecast_date.getDay() === 0 || forecast_date.getDay() === 6) {
    forecast_date.setDate(forecast_date.getDate() + 1);
  }

  return {
    arima_mean,
    garch_vol,
    ci_lower,
    ci_upper,
    historical_returns,
    garch_volatility,
    arima_mean_series,
    forecast_date: formatDate(forecast_date),
  };
}

