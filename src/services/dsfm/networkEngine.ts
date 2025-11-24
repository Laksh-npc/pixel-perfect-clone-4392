// Network Engine for DSFM Analysis
// Computes network metrics using graph theory

import { CorrelationMatrix } from "./correlationEngine";

export interface NetworkNode {
  id: string;
  label: string;
  centrality: number;
  betweenness: number;
  degree: number;
  sector?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  weight: number;
  correlation: number;
  distance?: number; // For weighted shortest paths
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  distanceMatrix?: number[][]; // For weighted betweenness
  metadata?: {
    edgeMode: EdgeConstructionMode;
    density: number;
    avgShortestPath: number;
    avgCorrelation: number;
    warning?: string; // For sparsity warnings
  };
}

export type EdgeConstructionMode = "threshold" | "topk" | "mst" | "full";

// Calculate degree centrality (number of connections)
export function calculateDegreeCentrality(
  matrix: CorrelationMatrix,
  threshold: number = 0.5,
  edges?: NetworkEdge[]
): Map<string, number> {
  const centrality = new Map<string, number>();
  
  // Initialize all to 0
  matrix.symbols.forEach(symbol => {
    centrality.set(symbol, 0);
  });
  
  // If edges are provided, count from edges (more accurate for different modes)
  if (edges) {
    edges.forEach(edge => {
      const fromCount = centrality.get(edge.from) || 0;
      const toCount = centrality.get(edge.to) || 0;
      centrality.set(edge.from, fromCount + 1);
      centrality.set(edge.to, toCount + 1);
    });
  } else {
    // Fallback to threshold-based counting
    matrix.symbols.forEach((symbol, idx) => {
      let degree = 0;
      for (let j = 0; j < matrix.symbols.length; j++) {
        if (idx !== j && Math.abs(matrix.matrix[idx][j]) >= threshold) {
          degree++;
        }
      }
      centrality.set(symbol, degree);
    });
  }
  
  return centrality;
}

// Calculate distance matrix from correlation using: distance = sqrt(2*(1-corr))
export function calculateDistanceMatrix(matrix: CorrelationMatrix): number[][] {
  const n = matrix.symbols.length;
  const distanceMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distanceMatrix[i][j] = 0;
      } else {
        const corr = matrix.matrix[i][j];
        // Convert correlation to distance: distance = sqrt(2*(1-corr))
        // Higher correlation = lower distance
        const distance = Math.sqrt(2 * (1 - corr));
        distanceMatrix[i][j] = distance;
      }
    }
  }
  
  return distanceMatrix;
}

// Dijkstra's algorithm for weighted shortest paths
function dijkstra(
  graph: number[][],
  start: number,
  n: number
): { dist: number[]; paths: number[][] } {
  const dist: number[] = Array(n).fill(Infinity);
  const visited: boolean[] = Array(n).fill(false);
  const paths: number[][] = Array(n).fill(0).map(() => []);
  
  dist[start] = 0;
  
  for (let count = 0; count < n - 1; count++) {
    // Find minimum distance vertex
    let u = -1;
    let minDist = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && dist[v] < minDist) {
        minDist = dist[v];
        u = v;
      }
    }
    
    if (u === -1 || minDist === Infinity) break;
    visited[u] = true;
    
    // Update distances
    for (let v = 0; v < n; v++) {
      if (!visited[v] && graph[u][v] > 0 && graph[u][v] < Infinity) {
        const alt = dist[u] + graph[u][v];
        
        if (alt < dist[v] - 1e-10) {
          // New shortest path
          dist[v] = alt;
          paths[v] = [u];
        } else if (Math.abs(alt - dist[v]) < 1e-10) {
          // Equal distance - multiple shortest paths
          if (!paths[v].includes(u)) {
            paths[v].push(u);
          }
        }
      }
    }
  }
  
  return { dist, paths };
}

// Calculate betweenness centrality using Brandes algorithm
// Supports both unweighted (BFS) and weighted (Dijkstra) shortest paths
export function calculateBetweennessCentrality(
  matrix: CorrelationMatrix,
  threshold: number = 0.5,
  useWeighted: boolean = false,
  distanceMatrix?: number[][],
  edges?: NetworkEdge[]
): Map<string, number> {
  const betweenness = new Map<string, number>();
  const n = matrix.symbols.length;
  
  // Initialize all betweenness values to 0
  matrix.symbols.forEach(symbol => {
    betweenness.set(symbol, 0);
  });
  
  if (useWeighted && distanceMatrix && edges) {
    // Weighted betweenness using Brandes with Dijkstra
    // Build weighted adjacency from edges
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
    
    // Brandes algorithm for weighted graphs
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
      
      // Priority queue simulation with Dijkstra
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
  } else {
    // Unweighted betweenness using BFS
    const adjacencyList: Map<number, number[]> = new Map();
    for (let i = 0; i < n; i++) {
      adjacencyList.set(i, []);
    }
    
    // Build adjacency from edges if provided, otherwise use threshold
    if (edges) {
      edges.forEach(edge => {
        const fromIdx = matrix.symbols.indexOf(edge.from);
        const toIdx = matrix.symbols.indexOf(edge.to);
        if (fromIdx !== -1 && toIdx !== -1) {
          adjacencyList.get(fromIdx)!.push(toIdx);
          adjacencyList.get(toIdx)!.push(fromIdx);
        }
      });
    } else {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== j && Math.abs(matrix.matrix[i][j]) >= threshold) {
            adjacencyList.get(i)!.push(j);
          }
        }
      }
    }
    
    // Brandes algorithm: for each node, calculate shortest paths through it
    for (let s = 0; s < n; s++) {
      const stack: number[] = [];
      const paths: number[][] = Array(n).fill(0).map(() => []);
      const sigma: number[] = Array(n).fill(0);
      const dist: number[] = Array(n).fill(-1);
      const delta: number[] = Array(n).fill(0);
      
      sigma[s] = 1;
      dist[s] = 0;
      const queue: number[] = [s];
      
      while (queue.length > 0) {
        const v = queue.shift()!;
        stack.push(v);
        
        const neighbors = adjacencyList.get(v) || [];
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
      
      // Accumulation phase - back propagation
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
  }
  
  // Normalize: BC_norm(v) = BC(v) / ((n-1)(n-2)/2)
  const normalizationFactor = (n - 1) * (n - 2) / 2;
  if (normalizationFactor > 0) {
    matrix.symbols.forEach(symbol => {
      const value = betweenness.get(symbol) || 0;
      betweenness.set(symbol, value / normalizationFactor);
    });
  }
  
  return betweenness;
}

// Build edges based on different construction modes
function buildEdges(
  matrix: CorrelationMatrix,
  mode: EdgeConstructionMode,
  threshold: number = 0.5,
  topK: number = 3
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
      
      // Ensure minimum degree: if no edges above threshold, take strongest (if >= 0.2)
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
      
      // Add edges (avoid duplicates)
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
            correlation: correlation,
            distance: distance
          });
        }
      }
    }
  } else if (mode === "topk") {
    // Top-k strongest correlations per stock
    for (let i = 0; i < n; i++) {
      const correlations: Array<{ j: number; corr: number }> = [];
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          correlations.push({ j, corr: Math.abs(matrix.matrix[i][j]) });
        }
      }
      // Sort by absolute correlation and take top k
      correlations.sort((a, b) => b.corr - a.corr);
      const topKCorrelations = correlations.slice(0, topK);
      
      // Add edges (avoid duplicates)
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
            correlation: correlation,
            distance: distance
          });
        }
      }
    }
  } else if (mode === "mst") {
    // Minimum Spanning Tree using Kruskal's algorithm
    edges.push(...buildMST(matrix));
  } else if (mode === "full") {
    // Fully connected graph with distance weights
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const correlation = matrix.matrix[i][j];
        const distance = Math.sqrt(2 * (1 - correlation));
        edges.push({
          from: matrix.symbols[i],
          to: matrix.symbols[j],
          weight: Math.abs(correlation),
          correlation: correlation,
          distance: distance
        });
      }
    }
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

// Calculate network density: 2E / (N*(N-1))
function calculateDensity(nodes: number, edges: number): number {
  if (nodes < 2) return 0;
  return (2 * edges) / (nodes * (nodes - 1));
}

// Calculate average shortest path length
function calculateAvgShortestPath(
  matrix: CorrelationMatrix,
  edges: NetworkEdge[],
  useWeighted: boolean,
  distanceMatrix?: number[][]
): number {
  const n = matrix.symbols.length;
  if (n < 2) return 0;
  
  let totalPathLength = 0;
  let pathCount = 0;
  
  if (useWeighted && distanceMatrix) {
    // Use distance matrix for weighted paths
    for (let i = 0; i < n; i++) {
      const { dist } = dijkstra(distanceMatrix, i, n);
      for (let j = i + 1; j < n; j++) {
        if (dist[j] < Infinity) {
          totalPathLength += dist[j];
          pathCount++;
        }
      }
    }
  } else {
    // Build adjacency and use BFS
    const adjacencyList: Map<number, number[]> = new Map();
    const edgeSet = new Set(edges.map(e => `${e.from}-${e.to}`));
    
    for (let i = 0; i < n; i++) {
      adjacencyList.set(i, []);
      for (let j = 0; j < n; j++) {
        if (i !== j && edgeSet.has(`${matrix.symbols[i]}-${matrix.symbols[j]}`) ||
            edgeSet.has(`${matrix.symbols[j]}-${matrix.symbols[i]}`)) {
          adjacencyList.get(i)!.push(j);
        }
      }
    }
    
    // BFS for each source
    for (let s = 0; s < n; s++) {
      const dist: number[] = Array(n).fill(-1);
      const queue: number[] = [s];
      dist[s] = 0;
      
      while (queue.length > 0) {
        const v = queue.shift()!;
        const neighbors = adjacencyList.get(v) || [];
        
        for (const w of neighbors) {
          if (dist[w] < 0) {
            dist[w] = dist[v] + 1;
            queue.push(w);
          }
        }
      }
      
      for (let j = s + 1; j < n; j++) {
        if (dist[j] >= 0) {
          totalPathLength += dist[j];
          pathCount++;
        }
      }
    }
  }
  
  return pathCount > 0 ? totalPathLength / pathCount : 0;
}

// Calculate average correlation
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

// Build network graph from correlation matrix with different edge construction modes
export function buildNetworkGraph(
  matrix: CorrelationMatrix,
  threshold: number = 0.5,
  sectorMap?: Map<string, string>,
  edgeMode: EdgeConstructionMode = "threshold",
  topK: number = 3
): NetworkGraph {
  const nodes: NetworkNode[] = [];
  
  // Build edges based on mode
  const edges = buildEdges(matrix, edgeMode, threshold, topK);
  
  // Always calculate distance matrix for weighted betweenness
  const distanceMatrix = calculateDistanceMatrix(matrix);
  const useWeighted = edgeMode === "mst" || edgeMode === "full";
  
  // Check for sparsity issues
  const n = matrix.symbols.length;
  const nodeDegrees = Array.from({ length: n }, (_, i) => 
    edges.filter(e => e.from === matrix.symbols[i] || e.to === matrix.symbols[i]).length
  );
  const minDegree = Math.min(...nodeDegrees);
  const isSparse = minDegree === 0 && edgeMode === "threshold" && threshold > 0.2;
  const warning = isSparse 
    ? "Graph too sparse, consider lowering threshold or using Top-K/MST mode."
    : undefined;
  
  // Calculate betweenness with appropriate method (always use weighted for MST/full)
  const betweennessCentrality = calculateBetweennessCentrality(
    matrix,
    threshold,
    useWeighted,
    distanceMatrix,
    edges
  );
  
  // Calculate degree centrality from edges
  const degreeCentrality = calculateDegreeCentrality(matrix, threshold, edges);
  
  // Create nodes
  matrix.symbols.forEach((symbol, idx) => {
    nodes.push({
      id: symbol,
      label: symbol.replace('.NS', ''),
      centrality: degreeCentrality.get(symbol) || 0,
      betweenness: betweennessCentrality.get(symbol) || 0,
      degree: degreeCentrality.get(symbol) || 0,
      sector: sectorMap?.get(symbol)
    });
  });
  
  // Calculate metadata
  const density = calculateDensity(nodes.length, edges.length);
  const avgShortestPath = calculateAvgShortestPath(matrix, edges, useWeighted, distanceMatrix);
  const avgCorrelation = calculateAvgCorrelation(matrix);
  
  return {
    nodes,
    edges,
    distanceMatrix,
    metadata: {
      edgeMode,
      density,
      avgShortestPath,
      avgCorrelation,
      warning
    }
  };
}

// Get top bridge nodes (highest betweenness)
export function getTopBridgeNodes(
  graph: NetworkGraph,
  topN: number = 10
): NetworkNode[] {
  return [...graph.nodes]
    .sort((a, b) => b.betweenness - a.betweenness)
    .slice(0, topN);
}

// Calculate shortest path length distribution
export function calculatePathLengthDistribution(
  matrix: CorrelationMatrix,
  edges: NetworkEdge[],
  useWeighted: boolean,
  distanceMatrix?: number[][]
): Map<number, number> {
  const distribution = new Map<number, number>();
  const n = matrix.symbols.length;
  
  if (useWeighted && distanceMatrix) {
    for (let i = 0; i < n; i++) {
      const { dist } = dijkstra(distanceMatrix, i, n);
      for (let j = i + 1; j < n; j++) {
        if (dist[j] < Infinity) {
          const length = Math.round(dist[j] * 100) / 100; // Round to 2 decimals
          distribution.set(length, (distribution.get(length) || 0) + 1);
        }
      }
    }
  } else {
    const adjacencyList: Map<number, number[]> = new Map();
    const edgeSet = new Set(edges.map(e => `${e.from}-${e.to}`));
    
    for (let i = 0; i < n; i++) {
      adjacencyList.set(i, []);
      for (let j = 0; j < n; j++) {
        if (i !== j && (edgeSet.has(`${matrix.symbols[i]}-${matrix.symbols[j]}`) ||
            edgeSet.has(`${matrix.symbols[j]}-${matrix.symbols[i]}`))) {
          adjacencyList.get(i)!.push(j);
        }
      }
    }
    
    for (let s = 0; s < n; s++) {
      const dist: number[] = Array(n).fill(-1);
      const queue: number[] = [s];
      dist[s] = 0;
      
      while (queue.length > 0) {
        const v = queue.shift()!;
        const neighbors = adjacencyList.get(v) || [];
        
        for (const w of neighbors) {
          if (dist[w] < 0) {
            dist[w] = dist[v] + 1;
            queue.push(w);
          }
        }
      }
      
      for (let j = s + 1; j < n; j++) {
        if (dist[j] >= 0) {
          distribution.set(dist[j], (distribution.get(dist[j]) || 0) + 1);
        }
      }
    }
  }
  
  return distribution;
}

// Get bridge paths for a specific node
export function getBridgePaths(
  nodeId: string,
  matrix: CorrelationMatrix,
  edges: NetworkEdge[],
  useWeighted: boolean,
  distanceMatrix?: number[][]
): Array<{ from: string; to: string; path: string[]; length: number }> {
  const paths: Array<{ from: string; to: string; path: string[]; length: number }> = [];
  const n = matrix.symbols.length;
  const nodeIndex = matrix.symbols.indexOf(nodeId);
  
  if (nodeIndex === -1) return paths;
  
  // For each pair of nodes, check if shortest path goes through this node
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (i === nodeIndex || j === nodeIndex) continue;
      
      // Find shortest path from i to j
      const path = findShortestPath(
        i, j, matrix, edges, useWeighted, distanceMatrix
      );
      
      if (path.includes(nodeIndex)) {
        paths.push({
          from: matrix.symbols[i],
          to: matrix.symbols[j],
          path: path.map(idx => matrix.symbols[idx]),
          length: path.length - 1
        });
      }
    }
  }
  
  return paths;
}

// Helper to find shortest path between two nodes
function findShortestPath(
  start: number,
  end: number,
  matrix: CorrelationMatrix,
  edges: NetworkEdge[],
  useWeighted: boolean,
  distanceMatrix?: number[][]
): number[] {
  const n = matrix.symbols.length;
  const path: number[] = [];
  
  if (useWeighted && distanceMatrix) {
    const { dist, paths: predPaths } = dijkstra(distanceMatrix, start, n);
    if (dist[end] === Infinity || dist[end] === undefined) return path;
    
    // Reconstruct path using predecessors from dijkstra
    const reconstructPath = (node: number, visited: Set<number> = new Set()): number[] => {
      if (visited.has(node)) return []; // Cycle detection
      if (node === start) return [start];
      if (predPaths[node].length === 0) return [];
      
      visited.add(node);
      
      // Take first predecessor and reconstruct
      const pred = predPaths[node][0];
      const predPath = reconstructPath(pred, visited);
      if (predPath.length > 0) {
        return [...predPath, node];
      }
      return [];
    };
    
    return reconstructPath(end);
  } else {
    const adjacencyList: Map<number, number[]> = new Map();
    const edgeSet = new Set(edges.map(e => `${e.from}-${e.to}`));
    
    for (let i = 0; i < n; i++) {
      adjacencyList.set(i, []);
      for (let j = 0; j < n; j++) {
        if (i !== j && (edgeSet.has(`${matrix.symbols[i]}-${matrix.symbols[j]}`) ||
            edgeSet.has(`${matrix.symbols[j]}-${matrix.symbols[i]}`))) {
          adjacencyList.get(i)!.push(j);
        }
      }
    }
    
    const dist: number[] = Array(n).fill(-1);
    const prev: number[] = Array(n).fill(-1);
    const queue: number[] = [start];
    dist[start] = 0;
    
    while (queue.length > 0) {
      const v = queue.shift()!;
      if (v === end) break;
      
      const neighbors = adjacencyList.get(v) || [];
      for (const w of neighbors) {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          prev[w] = v;
          queue.push(w);
        }
      }
    }
    
    // Reconstruct path
    if (dist[end] >= 0) {
      let current = end;
      while (current !== -1) {
        path.unshift(current);
        current = prev[current];
      }
    }
  }
  
  return path;
}

// Community detection (simplified Louvain-like algorithm)
export function detectCommunities(
  graph: NetworkGraph,
  resolution: number = 1.0
): Map<string, number> {
  const communities = new Map<string, number>();
  let communityId = 0;
  const visited = new Set<string>();
  
  // Simple greedy community detection
  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      // Start a new community
      const community = [node.id];
      visited.add(node.id);
      
      // Add connected nodes
      graph.edges.forEach(edge => {
        if (edge.from === node.id && !visited.has(edge.to)) {
          community.push(edge.to);
          visited.add(edge.to);
        } else if (edge.to === node.id && !visited.has(edge.from)) {
          community.push(edge.from);
          visited.add(edge.from);
        }
      });
      
      // Assign community ID
      community.forEach(symbol => {
        communities.set(symbol, communityId);
      });
      
      communityId++;
    }
  });
  
  return communities;
}
