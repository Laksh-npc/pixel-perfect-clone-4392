// API service for Shock Simulator backend endpoints

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface CorrelationMatrixResponse {
  symbols: string[];
  correlation_matrix: number[][];
}

export interface DistanceMatrixResponse {
  symbols: string[];
  distance_matrix: number[][];
}

export interface CentralityResponse {
  symbols: string[];
  centrality: number[];
}

export interface ShockSimulationRequest {
  sources: string[];
  initial_shock_pct: number;
  decay_factor: number;
  use_signed_corr?: boolean;
  hub_boost_enabled?: boolean;
}

export interface ShockSimulationResponse {
  final_effects: Record<string, number>;
  per_source_contrib: Record<string, Record<string, number>>;
  summary: {
    total_affected: number;
    max_impact: number;
    avg_impact: number;
  };
  time_series: Array<{
    t: number;
    impacts: Record<string, number>;
  }>;
}

async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${DEFAULT_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      if (response.status >= 500) {
        throw new Error(`API ${response.status}: Server error`);
      }
      throw new Error(`API ${response.status}: ${text || response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    if (error?.message?.includes("Failed to fetch") || 
        error?.message?.includes("NetworkError") ||
        error?.name === "TypeError") {
      throw new Error(`Network error: Unable to connect to backend`);
    }
    throw error;
  }
}

export const shockApi = {
  /**
   * GET /api/dsfm/correlation?window=1y
   * Returns correlation matrix for the specified time window
   */
  getCorrelationMatrix: async (window: string = "1y"): Promise<CorrelationMatrixResponse> => {
    return fetchFromApi<CorrelationMatrixResponse>(`/api/dsfm/correlation?window=${encodeURIComponent(window)}`);
  },

  /**
   * GET /api/dsfm/distance?threshold=0.5
   * Returns distance matrix (shortest path hops) for the specified threshold
   */
  getDistanceMatrix: async (threshold: number = 0.5): Promise<DistanceMatrixResponse> => {
    return fetchFromApi<DistanceMatrixResponse>(`/api/dsfm/distance?threshold=${threshold}`);
  },

  /**
   * GET /api/dsfm/centrality?window=1y
   * Returns betweenness centrality vector
   */
  getCentrality: async (window: string = "1y"): Promise<CentralityResponse> => {
    return fetchFromApi<CentralityResponse>(`/api/dsfm/centrality?window=${encodeURIComponent(window)}`);
  },

  /**
   * POST /api/dsfm/simulate-shock
   * Simulates shock propagation through the network
   */
  simulateShock: async (request: ShockSimulationRequest): Promise<ShockSimulationResponse> => {
    return fetchFromApi<ShockSimulationResponse>('/api/dsfm/simulate-shock', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

