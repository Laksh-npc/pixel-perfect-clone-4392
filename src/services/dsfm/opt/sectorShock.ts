/**
 * Sector-Level Shock Simulation
 * Proper propagation logic with iterations
 */

import { CorrelationMatrix } from "../correlationEngine";
import { NetworkGraph } from "../networkEngine";
import { ShockSimulation, ShockImpact } from "../shockEngine";

export interface ShockTimeline {
  iteration: number;
  impacts: Map<string, number>;
  cumulativeImpact: number;
  affectedCount: number;
}

export interface EnhancedShockSimulation extends ShockSimulation {
  timeline: ShockTimeline[];
  mostAffectedClusters: Array<{ clusterId: number; totalImpact: number; members: string[] }>;
  networkWideImpact: number;
}

// Cache for shock simulations
const shockCache = new Map<string, EnhancedShockSimulation>();

/**
 * Simulate sector shock with proper propagation
 * Formula: impact[next] = shock[current] * correlation(current, next)
 * Runs over iterations until impact < 0.5%
 */
export function simulateSectorShock(
  shockSymbol: string,
  shockMagnitude: number,
  correlationMatrix: CorrelationMatrix,
  networkGraph: NetworkGraph,
  clusters?: Map<string, number>
): EnhancedShockSimulation {
  const cacheKey = `${shockSymbol}_${shockMagnitude}_${correlationMatrix.symbols.join(',')}`;
  
  if (shockCache.has(cacheKey)) {
    return shockCache.get(cacheKey)!;
  }
  
  const shockIndex = correlationMatrix.symbols.indexOf(shockSymbol);
  if (shockIndex === -1) {
    throw new Error(`Symbol ${shockSymbol} not found in correlation matrix`);
  }
  
  const timeline: ShockTimeline[] = [];
  const impacts: ShockImpact[] = [];
  const currentImpacts = new Map<string, number>();
  
  // Initialize: shock symbol gets full magnitude
  currentImpacts.set(shockSymbol, shockMagnitude);
  
  let iteration = 0;
  const maxIterations = 3;
  const minImpactThreshold = 0.5; // 0.5%
  
  // Iterative propagation
  while (iteration < maxIterations) {
    const nextImpacts = new Map<string, number>();
    let cumulativeImpact = 0;
    let affectedCount = 0;
    
    // Propagate from current impacts
    currentImpacts.forEach((shockValue, symbol) => {
      const symbolIdx = correlationMatrix.symbols.indexOf(symbol);
      if (symbolIdx === -1) return;
      
      // Propagate to all other symbols
      correlationMatrix.symbols.forEach((targetSymbol, targetIdx) => {
        if (targetSymbol === symbol) return;
        
        const correlation = Math.abs(correlationMatrix.matrix[symbolIdx][targetIdx]);
        const impact = shockValue * correlation;
        
        if (impact >= minImpactThreshold) {
          const existing = nextImpacts.get(targetSymbol) || 0;
          nextImpacts.set(targetSymbol, Math.max(existing, impact));
          cumulativeImpact += impact;
          affectedCount++;
        }
      });
    });
    
    // Record timeline
    timeline.push({
      iteration,
      impacts: new Map(nextImpacts),
      cumulativeImpact,
      affectedCount
    });
    
    // Check if we should continue
    if (cumulativeImpact < minImpactThreshold * affectedCount) {
      break;
    }
    
    // Update for next iteration
    currentImpacts.clear();
    nextImpacts.forEach((value, symbol) => {
      currentImpacts.set(symbol, value);
    });
    
    iteration++;
  }
  
  // Build final impacts
  const finalImpacts = new Map<string, number>();
  timeline.forEach(t => {
    t.impacts.forEach((impact, symbol) => {
      const existing = finalImpacts.get(symbol) || 0;
      finalImpacts.set(symbol, Math.max(existing, impact));
    });
  });
  
  finalImpacts.forEach((impact, symbol) => {
    if (symbol !== shockSymbol) {
      const node = networkGraph.nodes.find(n => n.id === symbol);
      const idx = correlationMatrix.symbols.indexOf(symbol);
      const correlation = idx !== -1 ? correlationMatrix.matrix[shockIndex][idx] : 0;
      
      impacts.push({
        symbol,
        impact,
        originalCorrelation: correlation,
        centrality: node?.betweenness || 0
      });
    }
  });
  
  // Sort by impact
  impacts.sort((a, b) => b.impact - a.impact);
  
  // Calculate cluster impacts
  const mostAffectedClusters = calculateClusterImpacts(
    impacts,
    clusters || new Map()
  );
  
  // Network-wide cumulative impact
  const networkWideImpact = timeline.reduce((sum, t) => sum + t.cumulativeImpact, 0);
  
  const totalAffected = impacts.filter(i => i.impact > 0.01).length;
  const maxImpact = impacts.length > 0 ? impacts[0].impact : 0;
  const averageImpact = impacts.length > 0 
    ? impacts.reduce((sum, i) => sum + i.impact, 0) / impacts.length 
    : 0;
  
  const simulation: EnhancedShockSimulation = {
    shockSymbol,
    shockMagnitude,
    impacts,
    totalAffected,
    maxImpact,
    averageImpact,
    timeline,
    mostAffectedClusters,
    networkWideImpact
  };
  
  shockCache.set(cacheKey, simulation);
  return simulation;
}

/**
 * Calculate impact by cluster
 */
function calculateClusterImpacts(
  impacts: ShockImpact[],
  clusters: Map<string, number>
): Array<{ clusterId: number; totalImpact: number; members: string[] }> {
  const clusterImpacts = new Map<number, { totalImpact: number; members: Set<string> }>();
  
  impacts.forEach(impact => {
    const clusterId = clusters.get(impact.symbol);
    if (clusterId !== undefined) {
      const current = clusterImpacts.get(clusterId) || { totalImpact: 0, members: new Set() };
      current.totalImpact += impact.impact;
      current.members.add(impact.symbol);
      clusterImpacts.set(clusterId, current);
    }
  });
  
  return Array.from(clusterImpacts.entries())
    .map(([clusterId, data]) => ({
      clusterId,
      totalImpact: data.totalImpact,
      members: Array.from(data.members)
    }))
    .sort((a, b) => b.totalImpact - a.totalImpact);
}

/**
 * Clear shock cache
 */
export function clearShockCache(): void {
  shockCache.clear();
}

