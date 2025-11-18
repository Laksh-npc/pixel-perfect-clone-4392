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
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// Calculate degree centrality (number of connections)
export function calculateDegreeCentrality(
  matrix: CorrelationMatrix,
  threshold: number = 0.5
): Map<string, number> {
  const centrality = new Map<string, number>();
  
  matrix.symbols.forEach((symbol, idx) => {
    let degree = 0;
    for (let j = 0; j < matrix.symbols.length; j++) {
      if (idx !== j && Math.abs(matrix.matrix[idx][j]) >= threshold) {
        degree++;
      }
    }
    centrality.set(symbol, degree);
  });
  
  return centrality;
}

// Calculate betweenness centrality using Brandes algorithm
// Betweenness centrality measures how often a node appears on shortest paths between other nodes
export function calculateBetweennessCentrality(
  matrix: CorrelationMatrix,
  threshold: number = 0.5
): Map<string, number> {
  const betweenness = new Map<string, number>();
  const n = matrix.symbols.length;
  
  // Initialize all betweenness values to 0
  matrix.symbols.forEach(symbol => {
    betweenness.set(symbol, 0);
  });
  
  // Build adjacency list from correlation matrix
  const adjacencyList: Map<number, number[]> = new Map();
  for (let i = 0; i < n; i++) {
    adjacencyList.set(i, []);
    for (let j = 0; j < n; j++) {
      if (i !== j && Math.abs(matrix.matrix[i][j]) >= threshold) {
        adjacencyList.get(i)!.push(j);
      }
    }
  }
  
  // Brandes algorithm: for each node, calculate shortest paths through it
  for (let s = 0; s < n; s++) {
    // Data structures for BFS
    const stack: number[] = [];
    const paths: number[][] = Array(n).fill(0).map(() => []);
    const sigma: number[] = Array(n).fill(0);
    const dist: number[] = Array(n).fill(-1);
    const delta: number[] = Array(n).fill(0);
    
    sigma[s] = 1;
    dist[s] = 0;
    
    // BFS queue
    const queue: number[] = [s];
    
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      
      const neighbors = adjacencyList.get(v) || [];
      for (const w of neighbors) {
        // w found for the first time?
        if (dist[w] < 0) {
          queue.push(w);
          dist[w] = dist[v] + 1;
        }
        
        // Shortest path to w via v?
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
  
  // Normalize by (n-1)(n-2) for undirected graph (optional, but helps with interpretation)
  // For n nodes, max possible betweenness is (n-1)(n-2)/2
  const normalizationFactor = (n - 1) * (n - 2) / 2;
  if (normalizationFactor > 0) {
    matrix.symbols.forEach(symbol => {
      const value = betweenness.get(symbol) || 0;
      betweenness.set(symbol, value / normalizationFactor);
    });
  }
  
  return betweenness;
}

// Build network graph from correlation matrix
export function buildNetworkGraph(
  matrix: CorrelationMatrix,
  threshold: number = 0.5,
  sectorMap?: Map<string, string>
): NetworkGraph {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  
  const degreeCentrality = calculateDegreeCentrality(matrix, threshold);
  const betweennessCentrality = calculateBetweennessCentrality(matrix, threshold);
  
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
  
  // Create edges (only for correlations above threshold)
  for (let i = 0; i < matrix.symbols.length; i++) {
    for (let j = i + 1; j < matrix.symbols.length; j++) {
      const correlation = matrix.matrix[i][j];
      if (Math.abs(correlation) >= threshold) {
        edges.push({
          from: matrix.symbols[i],
          to: matrix.symbols[j],
          weight: Math.abs(correlation),
          correlation: correlation
        });
      }
    }
  }
  
  return { nodes, edges };
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
