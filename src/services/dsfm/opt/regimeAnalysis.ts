/**
 * Regime Switch Analyzer
 * Analyzes correlation regimes across different time ranges
 */

import { CorrelationMatrix } from "../correlationEngine";

export interface RegimeBand {
  band: "high" | "medium" | "low";
  count: number;
  percentage: number;
}

export interface RegimeAnalysis {
  timeRange: string;
  bands: RegimeBand[];
  totalPairs: number;
  avgCorrelation: number;
}

// Cache for regime analysis
const regimeCache = new Map<string, RegimeAnalysis>();

/**
 * Compute regime matrix for correlation bands
 * High: > 0.7, Medium: 0.4-0.7, Low: < 0.4
 */
export function computeRegimeMatrix(
  matrix: CorrelationMatrix,
  timeRange: string
): RegimeAnalysis {
  const cacheKey = `${matrix.symbols.join(',')}_${timeRange}`;
  
  if (regimeCache.has(cacheKey)) {
    return regimeCache.get(cacheKey)!;
  }
  
  const bands: RegimeBand[] = [
    { band: "high", count: 0, percentage: 0 },
    { band: "medium", count: 0, percentage: 0 },
    { band: "low", count: 0, percentage: 0 }
  ];
  
  let totalPairs = 0;
  let sumCorrelation = 0;
  
  const n = matrix.symbols.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const corr = Math.abs(matrix.matrix[i][j]);
      totalPairs++;
      sumCorrelation += corr;
      
      if (corr > 0.7) {
        bands[0].count++;
      } else if (corr >= 0.4) {
        bands[1].count++;
      } else {
        bands[2].count++;
      }
    }
  }
  
  // Calculate percentages
  bands.forEach(band => {
    band.percentage = totalPairs > 0 ? (band.count / totalPairs) * 100 : 0;
  });
  
  const avgCorrelation = totalPairs > 0 ? sumCorrelation / totalPairs : 0;
  
  const analysis: RegimeAnalysis = {
    timeRange,
    bands,
    totalPairs,
    avgCorrelation
  };
  
  regimeCache.set(cacheKey, analysis);
  return analysis;
}

/**
 * Compare regimes across multiple time ranges
 */
export function compareRegimes(
  analyses: RegimeAnalysis[]
): {
  regimeShift: Array<{ from: string; to: string; shift: number }>;
  stability: number;
} {
  const regimeShift: Array<{ from: string; to: string; shift: number }> = [];
  
  for (let i = 0; i < analyses.length - 1; i++) {
    const current = analyses[i];
    const next = analyses[i + 1];
    
    // Calculate shift in high correlation band
    const currentHigh = current.bands.find(b => b.band === "high")?.percentage || 0;
    const nextHigh = next.bands.find(b => b.band === "high")?.percentage || 0;
    const shift = nextHigh - currentHigh;
    
    regimeShift.push({
      from: current.timeRange,
      to: next.timeRange,
      shift
    });
  }
  
  // Calculate stability (variance in high correlation percentage)
  const highPercentages = analyses.map(a => 
    a.bands.find(b => b.band === "high")?.percentage || 0
  );
  const mean = highPercentages.reduce((a, b) => a + b, 0) / highPercentages.length;
  const variance = highPercentages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / highPercentages.length;
  const stability = 100 - Math.min(100, Math.sqrt(variance) * 10); // Invert and scale
  
  return { regimeShift, stability };
}

/**
 * Clear regime cache
 */
export function clearRegimeCache(): void {
  regimeCache.clear();
}

