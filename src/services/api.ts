const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Helper to check if error is a network/connection error
function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("NetworkError") ||
    error?.message?.includes("ERR_CONNECTION_REFUSED") ||
    error?.message?.includes("ENOTFOUND") ||
    error?.name === "TypeError"
  );
}

async function graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
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
      // Don't throw for 500 errors, return empty data instead
      if (response.status >= 500) {
        console.warn(`GraphQL server error (${response.status}): Backend may be unavailable`);
        return {} as T;
      }
      throw new Error(`API ${response.status}: ${text || response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      // Log but don't throw for GraphQL errors
      console.warn("GraphQL errors:", result.errors);
      return {} as T;
    }

    return result.data as T;
  } catch (error: any) {
    if (isNetworkError(error)) {
      console.warn("Network error connecting to GraphQL API. Backend may be unavailable.");
      return {} as T;
    }
    throw error;
  }
}

export const api = {
  // Get all indices (NIFTY, SENSEX, BANKNIFTY, etc.)
  getIndices: async () => {
    try {
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
      return data.indices || [];
    } catch (error) {
      console.warn("Failed to fetch indices:", error);
      return [];
    }
  },

  // Fetch equities for a list of symbols
  getEquitiesBySymbols: async (symbols: string[]) => {
    // If empty symbols array, directly use fallback
    if (symbols.length === 0) {
      const FALLBACK_SYMBOLS = ["RELIANCE", "EICHERMOT", "BAJFINANCE", "BAJAJFINSV", "INFY", "TCS", "HDFCBANK"];
      const fallbackPromises = FALLBACK_SYMBOLS.map(async (symbol) => {
        try {
          const stockDetails = await api.getStockDetails(symbol);
          if (stockDetails && stockDetails.info && stockDetails.priceInfo) {
            return {
              symbol: symbol,
              details: {
                info: { companyName: stockDetails.info.companyName || symbol },
                price: {
                  last: stockDetails.priceInfo.lastPrice || 0,
                  previousClose: (stockDetails.priceInfo.lastPrice || 0) - (stockDetails.priceInfo.change || 0),
                  tradedQuantity: stockDetails.priceInfo.tradedQuantity || 0
                }
              }
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });
      
      const fallbackResults = await Promise.all(fallbackPromises);
      return fallbackResults.filter((e): e is any => e !== null);
    }
    
    try {
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
      const equities = data.equities || [];
      
      // If API returns empty, use fallback symbols
      if (equities.length === 0) {
        const FALLBACK_SYMBOLS = ["RELIANCE", "EICHERMOT", "BAJFINANCE", "BAJAJFINSV", "INFY", "TCS", "HDFCBANK"];
        // Fetch details for fallback symbols using REST API
        const fallbackPromises = FALLBACK_SYMBOLS.map(async (symbol) => {
          try {
            const stockDetails = await api.getStockDetails(symbol);
            if (stockDetails && stockDetails.info && stockDetails.priceInfo) {
              return {
                symbol: symbol,
                details: {
                  info: { companyName: stockDetails.info.companyName || symbol },
                  price: {
                    last: stockDetails.priceInfo.lastPrice || 0,
                    previousClose: (stockDetails.priceInfo.lastPrice || 0) - (stockDetails.priceInfo.change || 0),
                    tradedQuantity: stockDetails.priceInfo.tradedQuantity || 0
                  }
                }
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        });
        
        const fallbackResults = await Promise.all(fallbackPromises);
        return fallbackResults.filter((e): e is any => e !== null);
      }
      
      return equities;
    } catch (error) {
      console.warn("Failed to fetch equities, using fallback:", error);
      // Use fallback symbols when API fails
      const FALLBACK_SYMBOLS = ["RELIANCE", "EICHERMOT", "BAJFINANCE", "BAJAJFINSV", "INFY", "TCS", "HDFCBANK"];
      const fallbackPromises = FALLBACK_SYMBOLS.map(async (symbol) => {
        try {
          const stockDetails = await api.getStockDetails(symbol);
          if (stockDetails && stockDetails.info && stockDetails.priceInfo) {
            return {
              symbol: symbol,
              details: {
                info: { companyName: stockDetails.info.companyName || symbol },
                price: {
                  last: stockDetails.priceInfo.lastPrice || 0,
                  previousClose: (stockDetails.priceInfo.lastPrice || 0) - (stockDetails.priceInfo.change || 0),
                  tradedQuantity: stockDetails.priceInfo.tradedQuantity || 0
                }
              }
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });
      
      const fallbackResults = await Promise.all(fallbackPromises);
      return fallbackResults.filter((e): e is any => e !== null);
    }
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
    try {
      // Get all indices and filter for sector-related indices
      const indices = await api.getIndices();
      // Filter indices that look like sectors (e.g., contain sector keywords)
      const sectorKeywords = ['AUTO', 'BANK', 'FMCG', 'IT', 'MEDIA', 'METAL', 'PHARMA', 'REALTY', 'ENERGY', 'INFRASTRUCTURE'];
      const sectors = indices.filter(idx => 
        sectorKeywords.some(keyword => idx.index.toUpperCase().includes(keyword))
      );
      return sectors;
    } catch (error) {
      console.warn("Failed to fetch sectors:", error);
      return [];
    }
  },

  // REST API endpoints for stock details
  async fetchFromRest<T>(endpoint: string, options?: { silent?: boolean }): Promise<T> {
    const url = `${DEFAULT_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        // For 404 and 400 errors, throw but allow caller to handle
        // For 500 errors, return null to indicate server error
        if (response.status >= 500) {
          if (!options?.silent) {
            console.warn(`API server error (${response.status}) for ${endpoint}: Backend may be unavailable`);
          }
          throw new Error(`API ${response.status}: Server error`);
        }
        // Try to parse JSON error if possible
        let errorMessage = text || response.statusText;
        try {
          const jsonError = JSON.parse(text);
          errorMessage = jsonError.message || jsonError.error || errorMessage;
        } catch {
          // Not JSON, use text as is
        }
        throw new Error(`API ${response.status}: ${errorMessage}`);
      }
      return response.json();
    } catch (error: any) {
      if (isNetworkError(error)) {
        if (!options?.silent) {
          console.warn(`Network error for ${endpoint}: Backend may be unavailable`);
        }
        throw new Error(`Network error: Unable to connect to backend`);
      }
      // Re-throw with more context
      if (error.message && error.message.startsWith('API ')) {
        throw error;
      }
      throw new Error(`Network error: ${error.message || 'Failed to fetch'}`);
    }
  },

  // Get stock details (equity details)
  getStockDetails: async (symbol: string) => {
    try {
      return await api.fetchFromRest<any>(`/api/equity/${encodeURIComponent(symbol)}`, { silent: true });
    } catch (error: any) {
      // Return null for errors instead of throwing
      if (error?.message?.includes("Network error") || error?.message?.includes("API 400") || error?.message?.includes("API 500")) {
        return null;
      }
      throw error;
    }
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
  // Falls back to empty array if API is unavailable
  getStockNews: async (limit = 10) => {
    try {
      const data = await api.fetchFromRest<any>(`/api/news?limit=${limit}`, { silent: true });
      return data.results || [];
    } catch (error: any) {
      // Return empty array if news API is not available
      // Don't log error as it's expected when backend doesn't have this endpoint
      if (error?.message?.includes("404") || error?.message?.includes("Network error")) {
        return [];
      }
      // For other errors, still return empty array
      return [];
    }
  },

  // Fetch news from Finnhub API (primary source)
  getFinnhubNews: async () => {
    try {
      const FINNHUB_API_KEY = "d4eqen1r01qlhj14v520d4eqen1r01qlhj14v52g";
      const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.warn("Failed to fetch from Finnhub:", error.message);
      return [];
    }
  },

  // Fetch news from NewsAPI (fallback source)
  getNewsAPINews: async () => {
    try {
      const NEWSAPI_API_KEY = "07e428f73d03408aa5f5096d5351452d";
      const url = `https://newsapi.org/v2/everything?q=stocks OR nifty OR sensex&language=en&sortBy=publishedAt&apiKey=${NEWSAPI_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data.articles) ? data.articles : [];
    } catch (error: any) {
      console.warn("Failed to fetch from NewsAPI:", error.message);
      return [];
    }
  },

  // Get merged news from both sources with fallback
  getMergedNews: async (limit = 20) => {
    // Try Finnhub first
    let news = await api.getFinnhubNews();
    
    // If Finnhub fails or returns empty, try NewsAPI
    if (!news || news.length === 0) {
      news = await api.getNewsAPINews();
    }
    
    // Normalize and merge news items
    const normalizedNews = news.map((item: any) => {
      // Finnhub format
      if (item.headline || item.summary) {
        return {
          id: item.id || Math.random().toString(),
          title: item.headline || item.title || "",
          description: item.summary || item.description || "",
          image: item.image || item.urlToImage || null,
          url: item.url || item.link || "",
          publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : (item.publishedAt || item.pubDate || new Date().toISOString()),
          source: item.source || (item.source_id ? item.source_id : "News"),
          category: item.category || "general",
        };
      }
      
      // NewsAPI format
      return {
        id: item.url || Math.random().toString(),
        title: item.title || "",
        description: item.description || "",
        image: item.urlToImage || null,
        url: item.url || "",
        publishedAt: item.publishedAt || new Date().toISOString(),
        source: item.source?.name || "News",
        category: "general",
      };
    });
    
    // Sort by published date (newest first)
    normalizedNews.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });
    
    // Return limited results
    return normalizedNews.slice(0, limit);
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


