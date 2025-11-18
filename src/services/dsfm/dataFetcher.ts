// Data fetcher for DSFM Analysis
// Fetches historical price data for NIFTY50 stocks and sector indices

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface StockData {
  symbol: string;
  name: string;
  prices: PriceData[];
  returns: number[];
}

// NIFTY50 tickers (sample - full list should be scraped from Wikipedia)
export const NIFTY50_TICKERS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS",
  "ICICIBANK.NS", "BHARTIARTL.NS", "SBIN.NS", "BAJFINANCE.NS", "LICI.NS",
  "ITC.NS", "LT.NS", "HCLTECH.NS", "AXISBANK.NS", "MARUTI.NS",
  "SUNPHARMA.NS", "ONGC.NS", "TITAN.NS", "NTPC.NS", "ULTRACEMCO.NS",
  "WIPRO.NS", "POWERGRID.NS", "NESTLEIND.NS", "M&M.NS", "TATAMOTORS.NS",
  "ADANIENT.NS", "JSWSTEEL.NS", "TATASTEEL.NS", "COALINDIA.NS", "DIVISLAB.NS",
  "BAJAJFINSV.NS", "HINDALCO.NS", "APOLLOHOSP.NS", "DRREDDY.NS", "GODREJCP.NS",
  "TECHM.NS", "BRITANNIA.NS", "HEROMOTOCO.NS", "CIPLA.NS", "GRASIM.NS",
  "EICHERMOT.NS", "SBILIFE.NS", "ADANIPORTS.NS", "TATACONSUM.NS", "BPCL.NS",
  "INDUSINDBK.NS", "HDFCLIFE.NS", "VEDL.NS", "DABUR.NS", "PIDILITIND.NS"
];

// Sector indices (use official NSE index names for historical endpoint)
export const SECTOR_INDICES = [
  "NIFTY IT",
  "NIFTY BANK",
  "NIFTY AUTO",
  "NIFTY PHARMA",
  "NIFTY FMCG",
  "NIFTY ENERGY",
  "NIFTY FINANCIAL SERVICES",
  "NIFTY REALTY",
  "NIFTY METAL",
  "NIFTY PSU BANK"
];

// Calculate date range from time period
export function getDateRange(period: string): { start: Date; end: Date } {
  const today = new Date();
  const end = new Date(today);
  
  // Set end date to yesterday if today is weekend (markets are closed)
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0) { // Sunday
    end.setDate(today.getDate() - 2); // Go to Friday
  } else if (dayOfWeek === 6) { // Saturday
    end.setDate(today.getDate() - 1); // Go to Friday
  }
  
  // Calculate start date based on period (always go backward from end date)
  const start = new Date(end);
  const daysBack = {
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "3Y": 365 * 3,
    "5Y": 365 * 5,
  }[period] || 30;
  
  start.setTime(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  // Ensure start is before end
  if (start >= end) {
    start.setTime(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return { start, end };
}

// Format date for API
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Fetch historical data for a symbol from the real API
export async function fetchHistoricalData(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<PriceData[]> {
  // Validate dates first
  if (startDate >= endDate || startDate > new Date()) {
    throw new Error("Invalid date range");
  }
  
  try {
    const { api } = await import("../api");
    const cleanSymbol = symbol.replace('.NS', '');
    
    // Check if it's a sector index (starts with NIFTY)
    const isSectorIndex = cleanSymbol.startsWith('NIFTY');
    
    let data: any;
    
    if (isSectorIndex) {
      // For sector indices, try index historical endpoint first
      try {
        data = await api.getIndexHistoricalData(
          cleanSymbol,
          formatDate(startDate),
          formatDate(endDate)
        );
      } catch (error) {
        // Fallback to equity endpoint if index endpoint fails
        data = await api.getStockHistoricalData(
          cleanSymbol,
          formatDate(startDate),
          formatDate(endDate)
        );
      }
    } else {
      // For stocks, use equity historical endpoint
      data = await api.getStockHistoricalData(
        cleanSymbol,
        formatDate(startDate),
        formatDate(endDate)
      );
    }
    
    // Transform API response to PriceData format
    // API returns array of { data: EquityHistoricalInfo[], meta: {...} } for equity
    // or { data: { indexCloseOnlineRecords: [...], ... }, meta: {...} } for indices
    if (Array.isArray(data) && data.length > 0) {
      const allPriceData: PriceData[] = [];
      
      // Iterate through each period in the response
      data.forEach((period: any) => {
        if (isSectorIndex && period?.data?.indexCloseOnlineRecords) {
          // Handle index historical data format
          period.data.indexCloseOnlineRecords.forEach((item: any) => {
            const timestamp = item.EOD_TIMESTAMP || item.TIMESTAMP;
            if (!timestamp) return;
            
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return;
            
            const open = Number(item.EOD_OPEN_INDEX_VAL || 0);
            const high = Number(item.EOD_HIGH_INDEX_VAL || 0);
            const low = Number(item.EOD_LOW_INDEX_VAL || 0);
            const close = Number(item.EOD_CLOSE_INDEX_VAL || 0);
            
            if (close > 0) {
              allPriceData.push({
                date: formatDate(date),
                open: open || close,
                high: high || close,
                low: low || close,
                close: close,
                volume: 0 // Indices don't have volume
              });
            }
          });
        } else if (period?.data && Array.isArray(period.data)) {
          // Handle equity historical data format
          period.data.forEach((item: any) => {
            const timestamp = item.CH_TIMESTAMP || item.TIMESTAMP || item.mTIMESTAMP;
            if (!timestamp) return;
            
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return;
            
            const open = Number(item.CH_OPENING_PRICE || 0);
            const high = Number(item.CH_TRADE_HIGH_PRICE || 0);
            const low = Number(item.CH_TRADE_LOW_PRICE || 0);
            const close = Number(item.CH_CLOSING_PRICE || item.CH_LAST_TRADED_PRICE || 0);
            const volume = Number(item.CH_TOT_TRADED_QTY || 0);
            
            // Only add if we have valid price data
            if (close > 0) {
              allPriceData.push({
                date: formatDate(date),
                open: open || close,
                high: high || close,
                low: low || close,
                close: close,
                volume: volume
              });
            }
          });
        }
      });
      
      // Sort by date
      allPriceData.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
      if (allPriceData.length > 0) {
        return allPriceData;
      }
    }
    
    // If no data found, throw error to fallback
    throw new Error("No historical data found");
  } catch (error: any) {
    console.warn(`Failed to fetch historical data for ${symbol}:`, error.message);
    // Re-throw to let caller handle (they can use mock data if needed)
    throw error;
  }
}

// Generate mock price data for development/testing
function generateMockData(startDate: Date, endDate: Date): PriceData[] {
  const data: PriceData[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure we have valid dates
  if (current >= end) {
    // If dates are invalid, generate last 30 days
    end.setTime(new Date().getTime());
    current.setTime(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  // Start with a realistic base price
  let basePrice = 500 + Math.random() * 2000;
  
  // Generate data for each trading day
  while (current <= end) {
    // Skip weekends
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    
    // Generate realistic price movement (±2% daily change)
    const change = (Math.random() - 0.5) * 0.04;
    basePrice = Math.max(10, basePrice * (1 + change)); // Ensure price doesn't go below 10
    
    const open = basePrice * (1 + (Math.random() - 0.5) * 0.005);
    const close = basePrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);
    
    data.push({
      date: formatDate(new Date(current)),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000 + 100000)
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
}

// Calculate log returns from price data
export function calculateReturns(prices: PriceData[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prevClose = prices[i - 1].close;
    const currClose = prices[i].close;
    if (prevClose > 0) {
      returns.push(Math.log(currClose / prevClose));
    }
  }
  return returns;
}

// Fetch data for multiple symbols with progress tracking
export async function fetchMultipleStocks(
  symbols: string[],
  startDate: Date,
  endDate: Date,
  onProgress?: (loaded: number, total: number) => void
): Promise<StockData[]> {
  console.log(`Fetching real-time data for ${symbols.length} symbols from ${formatDate(startDate)} to ${formatDate(endDate)}`);
  
  // Fetch data for all symbols in parallel, but handle errors gracefully
  let loadedCount = 0;
  const stockDataPromises = symbols.map(async (symbol, index) => {
    try {
      const prices = await fetchHistoricalData(symbol, startDate, endDate);
      
      if (prices.length === 0) {
        console.warn(`No price data returned for ${symbol}`);
        return null;
      }
      
      const returns = calculateReturns(prices);
      
      if (returns.length === 0) {
        console.warn(`No returns calculated for ${symbol} (insufficient price data)`);
        return null;
      }
      
      loadedCount++;
      if (onProgress) {
        onProgress(loadedCount, symbols.length);
      }
      
      console.log(`✓ Loaded ${symbol}: ${prices.length} data points, ${returns.length} returns`);
      
      return {
        symbol,
        name: symbol.replace('.NS', ''),
        prices,
        returns
      };
    } catch (error: any) {
      // If API fails for a symbol, skip it (don't use mock data)
      console.warn(`✗ Skipping ${symbol} due to API error:`, error?.message || error);
      return null;
    }
  });
  
  const results = await Promise.all(stockDataPromises);
  
  // Filter out null results (failed API calls)
  const validResults = results.filter((stock): stock is StockData => stock !== null);
  
  console.log(`Successfully loaded ${validResults.length} out of ${symbols.length} symbols`);
  
  return validResults;
}

