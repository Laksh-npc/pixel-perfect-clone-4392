// Helper functions for step-by-step betweenness centrality explanation
// Exposes intermediate calculations for educational visualization

import { StockData } from "./dataFetcher";
import { CorrelationMatrix, buildCorrelationMatrix } from "./correlationEngine";
import { NetworkGraph, NetworkEdge } from "./networkEngine";

export interface BFSTreeData {
  source: string;
  dist: Map<string, number>;
  sigma: Map<string, number>;
  predecessors: Map<string, string[]>;
  layers: Map<number, string[]>; // level -> nodes at that level
}

export interface DeltaAccumulation {
  node: string;
  delta: number;
  source: string;
  step: number; // Step in back-propagation
}

export interface BCStepData {
  node: string;
  betweenness: number;
  degree: number;
  sector?: string;
}

/**
 * Step 1: Calculate log returns from price data
 */
export function calculateLogReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }
  return returns;
}

/**
 * Step 3: Convert correlation to distance
 */
export function correlationToDistance(correlation: number): number {
  return Math.sqrt(2 * (1 - correlation));
}

/**
 * Calculate distance matrix from correlation matrix
 */
export function calculateDistanceMatrix(matrix: CorrelationMatrix): number[][] {
  const n = matrix.symbols.length;
  const distanceMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distanceMatrix[i][j] = 0;
      } else {
        const corr = matrix.matrix[i][j];
        distanceMatrix[i][j] = correlationToDistance(corr);
      }
    }
  }
  
  return distanceMatrix;
}

/**
 * Step 5: Perform BFS and collect intermediate data for Brandes algorithm
 */
export function performBFSForBrandes(
  source: string,
  graph: NetworkGraph,
  correlationMatrix: CorrelationMatrix
): BFSTreeData {
  const n = correlationMatrix.symbols.length;
  const sourceIdx = correlationMatrix.symbols.indexOf(source);
  
  if (sourceIdx === -1) {
    throw new Error(`Source node ${source} not found in correlation matrix`);
  }

  // Build adjacency list from edges
  const adjacencyList: Map<number, number[]> = new Map();
  for (let i = 0; i < n; i++) {
    adjacencyList.set(i, []);
  }

  graph.edges.forEach(edge => {
    const fromIdx = correlationMatrix.symbols.indexOf(edge.from);
    const toIdx = correlationMatrix.symbols.indexOf(edge.to);
    if (fromIdx !== -1 && toIdx !== -1) {
      adjacencyList.get(fromIdx)!.push(toIdx);
      adjacencyList.get(toIdx)!.push(fromIdx);
    }
  });

  // BFS initialization
  const dist: Map<string, number> = new Map();
  const sigma: Map<string, number> = new Map();
  const predecessors: Map<string, string[]> = new Map();
  const layers: Map<number, string[]> = new Map();

  // Initialize all nodes
  correlationMatrix.symbols.forEach(symbol => {
    dist.set(symbol, -1);
    sigma.set(symbol, 0);
    predecessors.set(symbol, []);
  });

  // Initialize source
  dist.set(source, 0);
  sigma.set(source, 1);
  layers.set(0, [source]);

  const queue: number[] = [sourceIdx];
  const visited = new Set<number>([sourceIdx]);

  // BFS traversal
  while (queue.length > 0) {
    const v = queue.shift()!;
    const vSymbol = correlationMatrix.symbols[v];
    const vDist = dist.get(vSymbol)!;

    const neighbors = adjacencyList.get(v) || [];
    for (const w of neighbors) {
      const wSymbol = correlationMatrix.symbols[w];
      const wDist = dist.get(wSymbol)!;

      if (wDist < 0) {
        // First time reaching w
        dist.set(wSymbol, vDist + 1);
        sigma.set(wSymbol, sigma.get(vSymbol)!);
        predecessors.set(wSymbol, [vSymbol]);
        
        const level = vDist + 1;
        if (!layers.has(level)) {
          layers.set(level, []);
        }
        layers.get(level)!.push(wSymbol);
        
        if (!visited.has(w)) {
          queue.push(w);
          visited.add(w);
        }
      } else if (wDist === vDist + 1) {
        // Another shortest path to w
        sigma.set(wSymbol, sigma.get(wSymbol)! + sigma.get(vSymbol)!);
        if (!predecessors.get(wSymbol)!.includes(vSymbol)) {
          predecessors.get(wSymbol)!.push(vSymbol);
        }
      }
    }
  }

  return {
    source,
    dist,
    sigma,
    predecessors,
    layers
  };
}

/**
 * Step 6: Perform dependency accumulation (back-propagation)
 */
export function performDeltaAccumulation(
  bfsData: BFSTreeData,
  correlationMatrix: CorrelationMatrix
): DeltaAccumulation[] {
  const delta: Map<string, number> = new Map();
  const accumulationSteps: DeltaAccumulation[] = [];

  // Initialize delta
  correlationMatrix.symbols.forEach(symbol => {
    delta.set(symbol, 0);
  });

  // Get nodes in reverse order of distance (from leaves to root)
  const nodesByLevel: string[] = [];
  const maxLevel = Math.max(...Array.from(bfsData.layers.keys()));
  
  for (let level = maxLevel; level >= 0; level--) {
    const nodesAtLevel = bfsData.layers.get(level) || [];
    nodesByLevel.push(...nodesAtLevel);
  }

  let step = 0;
  // Back-propagation from leaves to root
  for (const w of nodesByLevel) {
    if (w === bfsData.source) continue;

    const wDelta = delta.get(w) || 0;
    const wSigma = bfsData.sigma.get(w) || 1;
    const preds = bfsData.predecessors.get(w) || [];

    for (const v of preds) {
      const vSigma = bfsData.sigma.get(v) || 1;
      const vDelta = delta.get(v) || 0;
      
      if (wSigma > 0) {
        const contribution = (vSigma / wSigma) * (1 + wDelta);
        delta.set(v, vDelta + contribution);
        
        accumulationSteps.push({
          node: v,
          delta: delta.get(v)!,
          source: bfsData.source,
          step: step++
        });
      }
    }
  }

  return accumulationSteps;
}

/**
 * Calculate betweenness centrality step-by-step for all nodes
 */
export function calculateBCStepByStep(
  graph: NetworkGraph,
  correlationMatrix: CorrelationMatrix
): Map<string, number> {
  const betweenness = new Map<string, number>();
  const n = correlationMatrix.symbols.length;

  // Initialize
  correlationMatrix.symbols.forEach(symbol => {
    betweenness.set(symbol, 0);
  });

  // For each source node
  for (const source of correlationMatrix.symbols) {
    const bfsData = performBFSForBrandes(source, graph, correlationMatrix);
    const deltaSteps = performDeltaAccumulation(bfsData, correlationMatrix);

    // Accumulate betweenness
    for (const node of correlationMatrix.symbols) {
      if (node === source) continue;

      const nodeDelta = deltaSteps
        .filter(s => s.node === node && s.source === source)
        .reduce((max, s) => Math.max(max, s.delta), 0);

      if (nodeDelta > 0) {
        const current = betweenness.get(node) || 0;
        betweenness.set(node, current + nodeDelta);
      }
    }
  }

  // Normalize
  const normalizationFactor = (n - 1) * (n - 2) / 2;
  if (normalizationFactor > 0) {
    correlationMatrix.symbols.forEach(symbol => {
      const value = betweenness.get(symbol) || 0;
      betweenness.set(symbol, value / normalizationFactor);
    });
  }

  return betweenness;
}

/**
 * Get rolling correlation over time
 */
export function calculateRollingCorrelation(
  returns1: number[],
  returns2: number[],
  window: number = 30
): Array<{ date: number; correlation: number }> {
  const correlations: Array<{ date: number; correlation: number }> = [];
  const minLength = Math.min(returns1.length, returns2.length);

  for (let i = window; i < minLength; i++) {
    const window1 = returns1.slice(i - window, i);
    const window2 = returns2.slice(i - window, i);
    
    const mean1 = window1.reduce((a, b) => a + b, 0) / window;
    const mean2 = window2.reduce((a, b) => a + b, 0) / window;
    
    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;
    
    for (let j = 0; j < window; j++) {
      const diff1 = window1[j] - mean1;
      const diff2 = window2[j] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sumSq1 * sumSq2);
    const correlation = denominator > 0 ? numerator / denominator : 0;
    
    correlations.push({ date: i, correlation });
  }

  return correlations;
}

