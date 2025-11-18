const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const url = `${DEFAULT_BASE_URL}/graphql`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL Error: ${result.errors.map((e: any) => e.message).join(", ")}`);
  }

  return result.data as T;
}

export const api = {
  // Get all indices (NIFTY, SENSEX, BANKNIFTY, etc.)
  getIndices: async () => {
    const query = `
      query {
        indices {
          index
          last
          variation
          percentChange
        }
      }
    `;
    const data = await graphqlRequest<{ indices: Array<{ index: string; last: number; variation: number; percentChange: number }> }>(query);
    return data.indices;
  },

  // Fetch equities for a list of symbols
  getEquitiesBySymbols: async (symbols: string[]) => {
    const query = `
      query Movers($symbols: [String!]!) {
        equities(symbolFilter: { symbols: $symbols }) {
          symbol
          details {
            info { companyName }
            price { last previousClose tradedQuantity }
          }
        }
      }
    `;
    const data = await graphqlRequest<{ equities: any[] }>(query, { symbols });
    return data.equities;
  },

  // Get top gainers - query equities with positive change, sorted
  getTopGainers: async () => {
    // Note: This API may not have a direct gainers endpoint
    // For now, we'll return an empty array or query equities
    // You may need to implement this based on the actual API capabilities
    const query = `
      query {
        equities(symbolFilter: { symbols: [] }) {
          symbol
        }
      }
    `;
    // Since there's no direct gainers query, return empty for now
    // This can be enhanced if the API supports filtering/sorting
    return [];
  },

  // Get top losers - similar to gainers
  getTopLosers: async () => {
    // Similar to gainers - may need to be implemented based on API capabilities
    return [];
  },

  // Get sectors - filter indices by sector names
  getSectors: async () => {
    // Get all indices and filter for sector-related indices
    const indices = await api.getIndices();
    // Filter indices that look like sectors (e.g., contain sector keywords)
    const sectorKeywords = ['AUTO', 'BANK', 'FMCG', 'IT', 'MEDIA', 'METAL', 'PHARMA', 'REALTY', 'ENERGY', 'INFRASTRUCTURE'];
    const sectors = indices.filter(idx => 
      sectorKeywords.some(keyword => idx.index.toUpperCase().includes(keyword))
    );
    return sectors;
  },

  // REST API endpoints for stock details
  async fetchFromRest<T>(endpoint: string): Promise<T> {
    const url = `${DEFAULT_BASE_URL}${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`API ${response.status}: ${text || response.statusText}`);
    }
    return response.json();
  },

  // Get stock details (equity details)
  getStockDetails: async (symbol: string) => {
    return api.fetchFromRest<any>(`/api/equity/${encodeURIComponent(symbol)}`);
  },

  // Get stock trade info (volume, market depth, etc.)
  getStockTradeInfo: async (symbol: string) => {
    return api.fetchFromRest<any>(`/api/equity/tradeInfo/${encodeURIComponent(symbol)}`);
  },

  // Get stock corporate info (financials, announcements)
  getStockCorporateInfo: async (symbol: string) => {
    return api.fetchFromRest<any>(`/api/equity/corporateInfo/${encodeURIComponent(symbol)}`);
  },

  // Get stock historical data
  getStockHistoricalData: async (symbol: string, dateStart?: string, dateEnd?: string) => {
    let endpoint = `/api/equity/historical/${encodeURIComponent(symbol)}`;
    const params = new URLSearchParams();
    if (dateStart) params.append('dateStart', dateStart);
    if (dateEnd) params.append('dateEnd', dateEnd);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return api.fetchFromRest<any>(endpoint);
  },

  // Get index historical data (for sector indices)
  getIndexHistoricalData: async (indexSymbol: string, dateStart?: string, dateEnd?: string) => {
    let endpoint = `/api/index/historical/${encodeURIComponent(indexSymbol)}`;
    const params = new URLSearchParams();
    if (dateStart) params.append('dateStart', dateStart);
    if (dateEnd) params.append('dateEnd', dateEnd);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return api.fetchFromRest<any>(endpoint);
  },

  // Get stock intraday data
  getStockIntradayData: async (symbol: string, preOpen = false) => {
    const endpoint = `/api/equity/intraday/${encodeURIComponent(symbol)}${preOpen ? '?preOpen=true' : ''}`;
    return api.fetchFromRest<any>(endpoint);
  },

  // Get stock news from newsdata.io (via backend proxy)
  getStockNews: async (limit = 10) => {
    try {
      const data = await api.fetchFromRest<any>(`/api/news?limit=${limit}`);
      return data.results || [];
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  },

  // Get similar stocks (stocks in the same industry/sector)
  getSimilarStocks: async (symbol: string, limit = 10) => {
    // First get the stock details to know the industry
    const stockDetails = await api.getStockDetails(symbol);
    const industry = stockDetails?.info?.industry;
    if (!industry) return [];
    
    // Get all stocks and filter by industry
    // This is a simplified approach - in production, you might want a better way
    const allSymbols = await api.fetchFromRest<string[]>('/api/allSymbols');
    const industryStocks = allSymbols.filter(s => s !== symbol.toUpperCase()).slice(0, limit * 3);
    
    // Fetch details for industry stocks in batches
    const similarStocks = [];
    for (const stockSymbol of industryStocks.slice(0, limit)) {
      try {
        const details = await api.getStockDetails(stockSymbol);
        if (details?.info?.industry === industry) {
          similarStocks.push(details);
          if (similarStocks.length >= limit) break;
        }
      } catch (e) {
        // Skip if error fetching
        continue;
      }
    }
    return similarStocks;
  },
};

export function getApiBaseUrl(): string {
  return DEFAULT_BASE_URL;
}


