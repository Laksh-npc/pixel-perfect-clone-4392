/**
 * Sector-Level Centrality Computation
 * Optimized betweenness and centrality calculations for sectors
 */

import { CorrelationMatrix } from "../correlationEngine";
import { NetworkGraph, NetworkEdge } from "../networkEngine";

/**
 * Compute sector centrality metrics with verification
 * Ensures bridge sectors have non-zero values
 */
export function computeSectorCentrality(
  matrix: CorrelationMatrix,
  graph: NetworkGraph
): {
  betweenness: Map<string, number>;
  degree: Map<string, number>;
  verified: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const betweenness = new Map<string, number>();
  const degree = new Map<string, number>();
  
  // Initialize
  matrix.symbols.forEach(symbol => {
    betweenness.set(symbol, 0);
    degree.set(symbol, 0);
  });
  
  // Calculate degree from edges
  graph.edges.forEach(edge => {
    degree.set(edge.from, (degree.get(edge.from) || 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) || 0) + 1);
  });
  
  // Calculate weighted betweenness if distance matrix available
  if (graph.distanceMatrix) {
    const weightedBC = calculateWeightedBetweennessBrandes(
      matrix,
      graph.edges,
      graph.distanceMatrix
    );
    weightedBC.forEach((value, symbol) => betweenness.set(symbol, value));
  } else {
    // Fallback to unweighted
    const unweightedBC = calculateUnweightedBetweennessBrandes(
      matrix,
      graph.edges
    );
    unweightedBC.forEach((value, symbol) => betweenness.set(symbol, value));
  }
  
  // Verification
  const zeroBetweenness = Array.from(betweenness.entries())
    .filter(([_, value]) => value === 0)
    .map(([symbol]) => symbol);
  
  if (zeroBetweenness.length > matrix.symbols.length * 0.5) {
    issues.push(`Too many sectors with zero betweenness: ${zeroBetweenness.length}/${matrix.symbols.length}`);
  }
  
  // Check key sectors
  const keySectors = ["NIFTY BANK", "NIFTY IT", "NIFTY FINANCIAL SERVICES", "NIFTY ENERGY"];
  const keySectorBC = keySectors
    .map(sector => {
      const idx = matrix.symbols.indexOf(sector);
      return idx !== -1 ? betweenness.get(sector) || 0 : 0;
    })
    .filter(bc => bc > 0);
  
  if (keySectorBC.length === 0) {
    issues.push("Key sectors (Banking, IT, Financial Services, Energy) show no betweenness - check edge construction");
  }
  
  const verified = issues.length === 0;
  
  return { betweenness, degree, verified, issues };
}

/**
 * Weighted Brandes algorithm for betweenness
 */
function calculateWeightedBetweennessBrandes(
  matrix: CorrelationMatrix,
  edges: NetworkEdge[],
  distanceMatrix: number[][]
): Map<string, number> {
  const betweenness = new Map<string, number>();
  const n = matrix.symbols.length;
  
  matrix.symbols.forEach(symbol => betweenness.set(symbol, 0));
  
  // Build weighted adjacency
  const adj: Map<number, Array<{ node: number; dist: number }>> = new Map();
  for (let i = 0; i < n; i++) adj.set(i, []);
  
  edges.forEach(edge => {
    const fromIdx = matrix.symbols.indexOf(edge.from);
    const toIdx = matrix.symbols.indexOf(edge.to);
    if (fromIdx !== -1 && toIdx !== -1 && edge.distance !== undefined) {
      adj.get(fromIdx)!.push({ node: toIdx, dist: edge.distance });
      adj.get(toIdx)!.push({ node: fromIdx, dist: edge.distance });
    }
  });
  
  // Brandes for each source
  for (let s = 0; s < n; s++) {
    const dist: number[] = Array(n).fill(Infinity);
    const sigma: number[] = Array(n).fill(0);
    const paths: number[][] = Array(n).fill(0).map(() => []);
    const delta: number[] = Array(n).fill(0);
    const queue: number[] = [];
    const stack: number[] = [];
    
    dist[s] = 0;
    sigma[s] = 1;
    queue.push(s);
    
    // Priority queue simulation
    while (queue.length > 0) {
      queue.sort((a, b) => dist[a] - dist[b]);
      const v = queue.shift()!;
      stack.push(v);
      
      const neighbors = adj.get(v) || [];
      for (const { node: w, dist: edgeDist } of neighbors) {
        const alt = dist[v] + edgeDist;
        
        if (alt < dist[w] - 1e-10) {
          dist[w] = alt;
          sigma[w] = sigma[v];
          paths[w] = [v];
          if (!queue.includes(w)) queue.push(w);
        } else if (Math.abs(alt - dist[w]) < 1e-10) {
          sigma[w] += sigma[v];
          if (!paths[w].includes(v)) paths[w].push(v);
        }
      }
    }
    
    // Back propagation
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of paths[w]) {
        if (sigma[w] > 0) {
          delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
        }
      }
      if (w !== s) {
        const current = betweenness.get(matrix.symbols[w]) || 0;
        betweenness.set(matrix.symbols[w], current + delta[w]);
      }
    }
  }
  
  // Normalize: BC_norm(v) = BC(v) / ((n-1)(n-2)/2)
  const normFactor = (n - 1) * (n - 2) / 2;
  if (normFactor > 0) {
    matrix.symbols.forEach(symbol => {
      const value = betweenness.get(symbol) || 0;
      betweenness.set(symbol, value / normFactor);
    });
  }
  
  return betweenness;
}

/**
 * Unweighted Brandes algorithm (BFS-based)
 */
function calculateUnweightedBetweennessBrandes(
  matrix: CorrelationMatrix,
  edges: NetworkEdge[]
): Map<string, number> {
  const betweenness = new Map<string, number>();
  const n = matrix.symbols.length;
  
  matrix.symbols.forEach(symbol => betweenness.set(symbol, 0));
  
  // Build adjacency list
  const adj: Map<number, number[]> = new Map();
  for (let i = 0; i < n; i++) adj.set(i, []);
  
  edges.forEach(edge => {
    const fromIdx = matrix.symbols.indexOf(edge.from);
    const toIdx = matrix.symbols.indexOf(edge.to);
    if (fromIdx !== -1 && toIdx !== -1) {
      adj.get(fromIdx)!.push(toIdx);
      adj.get(toIdx)!.push(fromIdx);
    }
  });
  
  // Brandes BFS
  for (let s = 0; s < n; s++) {
    const stack: number[] = [];
    const paths: number[][] = Array(n).fill(0).map(() => []);
    const sigma: number[] = Array(n).fill(0);
    const dist: number[] = Array(n).fill(-1);
    const delta: number[] = Array(n).fill(0);
    const queue: number[] = [s];
    
    sigma[s] = 1;
    dist[s] = 0;
    
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      
      const neighbors = adj.get(v) || [];
      for (const w of neighbors) {
        if (dist[w] < 0) {
          queue.push(w);
          dist[w] = dist[v] + 1;
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          paths[w].push(v);
        }
      }
    }
    
    // Accumulation
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of paths[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) {
        const current = betweenness.get(matrix.symbols[w]) || 0;
        betweenness.set(matrix.symbols[w], current + delta[w]);
      }
    }
  }
  
  // Normalize
  const normFactor = (n - 1) * (n - 2) / 2;
  if (normFactor > 0) {
    matrix.symbols.forEach(symbol => {
      const value = betweenness.get(symbol) || 0;
      betweenness.set(symbol, value / normFactor);
    });
  }
  
  return betweenness;
}

