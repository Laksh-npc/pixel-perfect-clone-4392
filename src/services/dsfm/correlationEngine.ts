// Correlation Engine for DSFM Analysis
// Computes correlation matrices from stock returns

import { StockData } from "./dataFetcher";

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

// Calculate correlation coefficient between two return series
export function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length === 0) {
    return 0;
  }
  
  const n = returns1.length;
  const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
  const mean2 = returns2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2);
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

// Build correlation matrix from stock data
export function buildCorrelationMatrix(stocks: StockData[]): CorrelationMatrix {
  const symbols = stocks.map(s => s.symbol);
  const n = symbols.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        // Align return series by length (take minimum length)
        const minLength = Math.min(stocks[i].returns.length, stocks[j].returns.length);
        const returns1 = stocks[i].returns.slice(-minLength);
        const returns2 = stocks[j].returns.slice(-minLength);
        matrix[i][j] = calculateCorrelation(returns1, returns2);
      }
    }
  }
  
  return { symbols, matrix };
}

// Get correlation between two specific symbols
export function getCorrelation(
  matrix: CorrelationMatrix,
  symbol1: string,
  symbol2: string
): number {
  const idx1 = matrix.symbols.indexOf(symbol1);
  const idx2 = matrix.symbols.indexOf(symbol2);
  
  if (idx1 === -1 || idx2 === -1) return 0;
  return matrix.matrix[idx1][idx2];
}

// Get top correlated pairs
export function getTopCorrelatedPairs(
  matrix: CorrelationMatrix,
  topN: number = 10
): Array<{ symbol1: string; symbol2: string; correlation: number }> {
  const pairs: Array<{ symbol1: string; symbol2: string; correlation: number }> = [];
  
  for (let i = 0; i < matrix.symbols.length; i++) {
    for (let j = i + 1; j < matrix.symbols.length; j++) {
      pairs.push({
        symbol1: matrix.symbols[i],
        symbol2: matrix.symbols[j],
        correlation: matrix.matrix[i][j]
      });
    }
  }
  
  return pairs
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, topN);
}

