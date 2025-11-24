/**
 * Sector-Level Network Computation
 * Optimized functions for sector-level analysis with caching and memoization
 */

import { CorrelationMatrix } from "../correlationEngine";
import { NetworkGraph, NetworkEdge, NetworkNode, EdgeConstructionMode } from "../networkEngine";
import { calculateDistanceMatrix } from "../networkEngine";

// Cache for computed networks
const networkCache = new Map<string, NetworkGraph>();
const distanceMatrixCache = new Map<string, number[][]>();

/**
 * Compute sector network with optimized edge construction
 * Supports: threshold, topk, mst modes
 */
export function computeSectorNetwork(
  matrix: CorrelationMatrix,
  edgeMode: EdgeConstructionMode,
  threshold: number = 0.5,
  topK: number = 3,
  sectorMap?: Map<string, string>
): NetworkGraph {
  // Create cache key
  const cacheKey = `${matrix.symbols.join(',')}_${edgeMode}_${threshold}_${topK}`;
  
  // Check cache
  if (networkCache.has(cacheKey)) {
    return networkCache.get(cacheKey)!;
  }

  const edges = buildSectorEdges(matrix, edgeMode, threshold, topK);
  const distanceMatrix = calculateDistanceMatrix(matrix);
  
  // Check for sparsity issues
  const nodes = matrix.symbols.length;
  const minDegree = Math.min(...Array.from({ length: nodes }, (_, i) => 
    edges.filter(e => e.from === matrix.symbols[i] || e.to === matrix.symbols[i]).length
  ));
  
  const isSparse = minDegree === 0 && edgeMode === "threshold";
  const warning = isSparse && threshold > 0.2 
    ? "Graph too sparse, consider lowering threshold or using Top-K/MST mode."
    : undefined;

  // Calculate betweenness with weighted algorithm
  const betweenness = calculateWeightedBetweenness(
    matrix,
    edges,
    distanceMatrix
  );

  // Calculate degree from edges
  const degreeMap = new Map<string, number>();
  matrix.symbols.forEach(s => degreeMap.set(s, 0));
  edges.forEach(edge => {
    degreeMap.set(edge.from, (degreeMap.get(edge.from) || 0) + 1);
    degreeMap.set(edge.to, (degreeMap.get(edge.to) || 0) + 1);
  });

  // Build nodes
  const networkNodes: NetworkNode[] = matrix.symbols.map((symbol, idx) => ({
    id: symbol,
    label: symbol.replace('.NS', ''),
    centrality: degreeMap.get(symbol) || 0,
    betweenness: betweenness.get(symbol) || 0,
    degree: degreeMap.get(symbol) || 0,
    sector: sectorMap?.get(symbol)
  }));

  // Calculate metadata
  const density = nodes > 1 ? (2 * edges.length) / (nodes * (nodes - 1)) : 0;
  const avgCorrelation = calculateAvgCorrelation(matrix);

  const graph: NetworkGraph = {
    nodes: networkNodes,
    edges,
    distanceMatrix,
    metadata: {
      edgeMode,
      density,
      avgShortestPath: 0, // Will be calculated separately if needed
      avgCorrelation,
      warning
    }
  };

  // Cache result
  networkCache.set(cacheKey, graph);
  return graph;
}

/**
 * Build edges based on construction mode with improved sparsity handling
 */
function buildSectorEdges(
  matrix: CorrelationMatrix,
  mode: EdgeConstructionMode,
  threshold: number,
  topK: number
): NetworkEdge[] {
  const edges: NetworkEdge[] = [];
  const n = matrix.symbols.length;

  if (mode === "threshold") {
    // Threshold-based with minimum degree guarantee
    for (let i = 0; i < n; i++) {
      const correlations: Array<{ j: number; corr: number }> = [];
      
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const corr = matrix.matrix[i][j];
          if (Math.abs(corr) >= threshold) {
            correlations.push({ j, corr: Math.abs(corr) });
          }
        }
      }
      
      // Ensure minimum degree: if no edges above threshold, take strongest
      if (correlations.length === 0) {
        const allCorr: Array<{ j: number; corr: number }> = [];
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            allCorr.push({ j, corr: Math.abs(matrix.matrix[i][j]) });
          }
        }
        allCorr.sort((a, b) => b.corr - a.corr);
        const strongest = allCorr[0];
        if (strongest && strongest.corr >= 0.2) {
          correlations.push(strongest);
        }
      }
      
      // Add edges
      for (const { j } of correlations) {
        const correlation = matrix.matrix[i][j];
        const edgeExists = edges.some(
          e => (e.from === matrix.symbols[i] && e.to === matrix.symbols[j]) ||
               (e.from === matrix.symbols[j] && e.to === matrix.symbols[i])
        );
        
        if (!edgeExists) {
          const distance = Math.sqrt(2 * (1 - correlation));
          edges.push({
            from: matrix.symbols[i],
            to: matrix.symbols[j],
            weight: Math.abs(correlation),
            correlation,
            distance
          });
        }
      }
    }
  } else if (mode === "topk") {
    // Top-K strongest correlations per node
    for (let i = 0; i < n; i++) {
      const correlations: Array<{ j: number; corr: number }> = [];
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          correlations.push({ j, corr: Math.abs(matrix.matrix[i][j]) });
        }
      }
      correlations.sort((a, b) => b.corr - a.corr);
      const topKCorrelations = correlations.slice(0, topK);
      
      for (const { j } of topKCorrelations) {
        const correlation = matrix.matrix[i][j];
        const edgeExists = edges.some(
          e => (e.from === matrix.symbols[i] && e.to === matrix.symbols[j]) ||
               (e.from === matrix.symbols[j] && e.to === matrix.symbols[i])
        );
        
        if (!edgeExists) {
          const distance = Math.sqrt(2 * (1 - correlation));
          edges.push({
            from: matrix.symbols[i],
            to: matrix.symbols[j],
            weight: Math.abs(correlation),
            correlation,
            distance
          });
        }
      }
    }
  } else if (mode === "mst") {
    // Minimum Spanning Tree using Kruskal's algorithm
    edges.push(...buildMST(matrix));
  }

  return edges;
}

/**
 * Build Minimum Spanning Tree using Kruskal's algorithm
 * Ensures always-connected structure
 */
function buildMST(matrix: CorrelationMatrix): NetworkEdge[] {
  const n = matrix.symbols.length;
  const edges: Array<{ from: number; to: number; distance: number; correlation: number }> = [];
  
  // Create all possible edges with distance
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const correlation = matrix.matrix[i][j];
      const distance = Math.sqrt(2 * (1 - correlation));
      edges.push({ from: i, to: j, distance, correlation });
    }
  }
  
  // Sort by distance (ascending)
  edges.sort((a, b) => a.distance - b.distance);
  
  // Union-Find for cycle detection
  const parent: number[] = Array(n).fill(0).map((_, i) => i);
  const rank: number[] = Array(n).fill(0);
  
  const find = (x: number): number => {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  };
  
  const union = (x: number, y: number): boolean => {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX === rootY) return false;
    
    if (rank[rootX] < rank[rootY]) {
      parent[rootX] = rootY;
    } else if (rank[rootX] > rank[rootY]) {
      parent[rootY] = rootX;
    } else {
      parent[rootY] = rootX;
      rank[rootX]++;
    }
    return true;
  };
  
  // Kruskal's algorithm
  const mstEdges: NetworkEdge[] = [];
  for (const edge of edges) {
    if (union(edge.from, edge.to)) {
      mstEdges.push({
        from: matrix.symbols[edge.from],
        to: matrix.symbols[edge.to],
        weight: Math.abs(edge.correlation),
        correlation: edge.correlation,
        distance: edge.distance
      });
      
      if (mstEdges.length === n - 1) break; // MST has n-1 edges
    }
  }
  
  return mstEdges;
}

/**
 * Calculate weighted betweenness centrality using Brandes algorithm
 * Uses distance matrix for weighted shortest paths
 */
function calculateWeightedBetweenness(
  matrix: CorrelationMatrix,
  edges: NetworkEdge[],
  distanceMatrix: number[][]
): Map<string, number> {
  const betweenness = new Map<string, number>();
  const n = matrix.symbols.length;
  
  // Initialize
  matrix.symbols.forEach(symbol => betweenness.set(symbol, 0));
  
  // Build adjacency list from edges with distances
  const adjacencyList: Map<number, Array<{ node: number; distance: number }>> = new Map();
  for (let i = 0; i < n; i++) {
    adjacencyList.set(i, []);
  }
  
  edges.forEach(edge => {
    const fromIdx = matrix.symbols.indexOf(edge.from);
    const toIdx = matrix.symbols.indexOf(edge.to);
    if (fromIdx !== -1 && toIdx !== -1 && edge.distance !== undefined) {
      adjacencyList.get(fromIdx)!.push({ node: toIdx, distance: edge.distance });
      adjacencyList.get(toIdx)!.push({ node: fromIdx, distance: edge.distance });
    }
  });
  
  // Brandes algorithm with weighted paths
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
    
    // Dijkstra-like BFS
    while (queue.length > 0) {
      queue.sort((a, b) => dist[a] - dist[b]);
      const v = queue.shift()!;
      stack.push(v);
      
      const neighbors = adjacencyList.get(v) || [];
      for (const { node: w, distance: edgeDist } of neighbors) {
        const alt = dist[v] + edgeDist;
        
        if (alt < dist[w] - 1e-10) {
          // New shortest path
          dist[w] = alt;
          sigma[w] = sigma[v];
          paths[w] = [v];
          if (!queue.includes(w)) queue.push(w);
        } else if (Math.abs(alt - dist[w]) < 1e-10) {
          // Equal distance - multiple shortest paths
          sigma[w] += sigma[v];
          if (!paths[w].includes(v)) {
            paths[w].push(v);
          }
        }
      }
    }
    
    // Accumulation phase
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
  const normalizationFactor = (n - 1) * (n - 2) / 2;
  if (normalizationFactor > 0) {
    matrix.symbols.forEach(symbol => {
      const value = betweenness.get(symbol) || 0;
      betweenness.set(symbol, value / normalizationFactor);
    });
  }
  
  return betweenness;
}

/**
 * Calculate average correlation
 */
function calculateAvgCorrelation(matrix: CorrelationMatrix): number {
  const n = matrix.symbols.length;
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      sum += Math.abs(matrix.matrix[i][j]);
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

/**
 * Clear caches (useful for testing or memory management)
 */
export function clearSectorNetworkCache(): void {
  networkCache.clear();
  distanceMatrixCache.clear();
}

