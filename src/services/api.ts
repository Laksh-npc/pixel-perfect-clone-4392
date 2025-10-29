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
};

export function getApiBaseUrl(): string {
  return DEFAULT_BASE_URL;
}


