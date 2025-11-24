/**
 * Sector-Level Community Detection
 * Louvain algorithm for modularity-based clustering
 */

import { CorrelationMatrix } from "../correlationEngine";
import { NetworkGraph } from "../networkEngine";

export interface ClusterInfo {
  clusterId: number;
  members: string[];
  avgInternalCorrelation: number;
  avgExternalCorrelation: number;
}

export interface ClusterAnalysis {
  clusters: Map<string, number>;
  clusterInfo: ClusterInfo[];
  modularity: number;
  numClusters: number;
}

// Cache for cluster detection
const clusterCache = new Map<string, ClusterAnalysis>();

/**
 * Compute sector clusters using Louvain community detection
 */
export function computeSectorClusters(
  matrix: CorrelationMatrix,
  graph: NetworkGraph
): ClusterAnalysis {
  const cacheKey = `${matrix.symbols.join(',')}_${graph.edges.length}`;
  
  if (clusterCache.has(cacheKey)) {
    return clusterCache.get(cacheKey)!;
  }
  
  const clusters = louvainCommunityDetection(graph, matrix);
  const clusterInfo = buildClusterInfo(clusters, matrix, graph);
  const modularity = calculateModularity(graph, clusters, matrix);
  
  const analysis: ClusterAnalysis = {
    clusters,
    clusterInfo,
    modularity,
    numClusters: new Set(Array.from(clusters.values())).size
  };
  
  clusterCache.set(cacheKey, analysis);
  return analysis;
}

/**
 * Louvain community detection algorithm
 * Simplified version optimized for sector networks
 */
function louvainCommunityDetection(
  graph: NetworkGraph,
  matrix: CorrelationMatrix
): Map<string, number> {
  const n = graph.nodes.length;
  const communities = new Map<string, number>();
  
  // Initialize: each node in its own community
  graph.nodes.forEach((node, idx) => {
    communities.set(node.id, idx);
  });
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 10;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    // Try moving each node to best community
    for (const node of graph.nodes) {
      const currentCommunity = communities.get(node.id)!;
      const neighbors = graph.edges
        .filter(e => e.from === node.id || e.to === node.id)
        .map(e => e.from === node.id ? e.to : e.from);
      
      // Calculate modularity gain for each possible community
      const communityModularity = new Map<number, number>();
      
      for (const neighborId of neighbors) {
        const neighborCommunity = communities.get(neighborId);
        if (neighborCommunity !== undefined) {
          const edge = graph.edges.find(
            e => (e.from === node.id && e.to === neighborId) ||
                 (e.to === node.id && e.from === neighborId)
          );
          
          if (edge) {
            const current = communityModularity.get(neighborCommunity) || 0;
            communityModularity.set(neighborCommunity, current + edge.weight);
          }
        }
      }
      
      // Find best community
      let bestCommunity = currentCommunity;
      let bestModularity = communityModularity.get(currentCommunity) || 0;
      
      for (const [community, mod] of communityModularity.entries()) {
        if (mod > bestModularity) {
          bestModularity = mod;
          bestCommunity = community;
        }
      }
      
      // Move if improvement
      if (bestCommunity !== currentCommunity) {
        communities.set(node.id, bestCommunity);
        improved = true;
      }
    }
  }
  
  // Renumber communities to be contiguous
  const uniqueCommunities = Array.from(new Set(communities.values()));
  const renumberMap = new Map<number, number>();
  uniqueCommunities.forEach((comm, idx) => renumberMap.set(comm, idx));
  
  const renumbered = new Map<string, number>();
  communities.forEach((comm, nodeId) => {
    renumbered.set(nodeId, renumberMap.get(comm)!);
  });
  
  return renumbered;
}

/**
 * Build cluster information
 */
function buildClusterInfo(
  clusters: Map<string, number>,
  matrix: CorrelationMatrix,
  graph: NetworkGraph
): ClusterInfo[] {
  const clusterMap = new Map<number, string[]>();
  
  clusters.forEach((clusterId, nodeId) => {
    if (!clusterMap.has(clusterId)) {
      clusterMap.set(clusterId, []);
    }
    clusterMap.get(clusterId)!.push(nodeId);
  });
  
  const clusterInfo: ClusterInfo[] = [];
  
  clusterMap.forEach((members, clusterId) => {
    // Calculate internal correlation
    let internalSum = 0;
    let internalCount = 0;
    
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const idx1 = matrix.symbols.indexOf(members[i]);
        const idx2 = matrix.symbols.indexOf(members[j]);
        if (idx1 !== -1 && idx2 !== -1) {
          internalSum += Math.abs(matrix.matrix[idx1][idx2]);
          internalCount++;
        }
      }
    }
    const avgInternal = internalCount > 0 ? internalSum / internalCount : 0;
    
    // Calculate external correlation
    let externalSum = 0;
    let externalCount = 0;
    const otherNodes = matrix.symbols.filter(s => !members.includes(s));
    
    for (const member of members) {
      for (const other of otherNodes) {
        const idx1 = matrix.symbols.indexOf(member);
        const idx2 = matrix.symbols.indexOf(other);
        if (idx1 !== -1 && idx2 !== -1) {
          externalSum += Math.abs(matrix.matrix[idx1][idx2]);
          externalCount++;
        }
      }
    }
    const avgExternal = externalCount > 0 ? externalSum / externalCount : 0;
    
    clusterInfo.push({
      clusterId,
      members,
      avgInternalCorrelation: avgInternal,
      avgExternalCorrelation: avgExternal
    });
  });
  
  return clusterInfo.sort((a, b) => b.avgInternalCorrelation - a.avgInternalCorrelation);
}

/**
 * Calculate modularity of the partition
 */
function calculateModularity(
  graph: NetworkGraph,
  clusters: Map<string, number>,
  matrix: CorrelationMatrix
): number {
  const m = graph.edges.length;
  if (m === 0) return 0;
  
  let modularity = 0;
  const totalWeight = graph.edges.reduce((sum, e) => sum + e.weight, 0);
  
  // Group edges by community
  const communityEdges = new Map<string, number>();
  
  graph.edges.forEach(edge => {
    const comm1 = clusters.get(edge.from);
    const comm2 = clusters.get(edge.to);
    
    if (comm1 === comm2 && comm1 !== undefined) {
      const key = `${comm1}`;
      communityEdges.set(key, (communityEdges.get(key) || 0) + edge.weight);
    }
  });
  
  // Calculate modularity
  const communityDegrees = new Map<number, number>();
  graph.nodes.forEach(node => {
    const comm = clusters.get(node.id);
    if (comm !== undefined) {
      const degree = graph.edges.filter(
        e => e.from === node.id || e.to === node.id
      ).length;
      communityDegrees.set(comm, (communityDegrees.get(comm) || 0) + degree);
    }
  });
  
  for (const [commStr, internalWeight] of communityEdges.entries()) {
    const comm = parseInt(commStr);
    const degree = communityDegrees.get(comm) || 0;
    const expected = (degree / (2 * m)) ** 2;
    modularity += (internalWeight / totalWeight) - expected;
  }
  
  return modularity;
}

/**
 * Clear cluster cache
 */
export function clearClusterCache(): void {
  clusterCache.clear();
}

