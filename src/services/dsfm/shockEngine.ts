// Shock Propagation Engine for DSFM Analysis
// Simulates shock propagation through the network

import { CorrelationMatrix } from "./correlationEngine";
import { NetworkGraph } from "./networkEngine";

export interface ShockImpact {
  symbol: string;
  impact: number;
  originalCorrelation: number;
  centrality: number;
}

export interface ShockSimulation {
  shockSymbol: string;
  shockMagnitude: number;
  impacts: ShockImpact[];
  totalAffected: number;
  maxImpact: number;
  averageImpact: number;
  timeline?: Array<{
    iteration: number;
    impacts: Map<string, number>;
    cumulativeImpact: number;
    affectedCount: number;
  }>;
  networkWideImpact?: number;
  mostAffectedClusters?: Array<{ clusterId: number; totalImpact: number; members: string[] }>;
}

// Simulate shock propagation with proper iterative logic
// Formula: impact[next] = shock[current] * correlation(current, next)
// Runs over iterations until impact < 0.5%
export function simulateShock(
  shockSymbol: string,
  shockMagnitude: number,
  correlationMatrix: CorrelationMatrix,
  networkGraph: NetworkGraph
): ShockSimulation {
  const shockIndex = correlationMatrix.symbols.indexOf(shockSymbol);
  if (shockIndex === -1) {
    throw new Error(`Symbol ${shockSymbol} not found in correlation matrix`);
  }
  
  const impacts: ShockImpact[] = [];
  const currentImpacts = new Map<string, number>();
  const finalImpacts = new Map<string, number>();
  
  // Initialize: shock symbol gets full magnitude
  currentImpacts.set(shockSymbol, shockMagnitude);
  finalImpacts.set(shockSymbol, shockMagnitude);
  
  let iteration = 0;
  const maxIterations = 3;
  const minImpactThreshold = 0.5; // 0.5%
  
  // Iterative propagation
  while (iteration < maxIterations) {
    const nextImpacts = new Map<string, number>();
    
    // Propagate from current impacts
    currentImpacts.forEach((shockValue, symbol) => {
      const symbolIdx = correlationMatrix.symbols.indexOf(symbol);
      if (symbolIdx === -1) return;
      
      // Propagate to all other symbols
      correlationMatrix.symbols.forEach((targetSymbol, targetIdx) => {
        if (targetSymbol === symbol) return;
        
        const correlation = Math.abs(correlationMatrix.matrix[symbolIdx][targetIdx]);
        // Proper propagation: impact[next] = shock[current] * correlation(current, next)
        const impact = shockValue * correlation;
        
        if (impact >= minImpactThreshold) {
          const existing = nextImpacts.get(targetSymbol) || 0;
          const existingFinal = finalImpacts.get(targetSymbol) || 0;
          // Take maximum impact
          const newImpact = Math.max(existing, impact);
          nextImpacts.set(targetSymbol, newImpact);
          finalImpacts.set(targetSymbol, Math.max(existingFinal, newImpact));
        }
      });
    });
    
    // Check if we should continue
    const totalImpact = Array.from(nextImpacts.values()).reduce((sum, val) => sum + val, 0);
    const affectedCount = nextImpacts.size;
    
    if (totalImpact < minImpactThreshold * affectedCount) {
      break;
    }
    
    // Update for next iteration
    currentImpacts.clear();
    nextImpacts.forEach((value, symbol) => {
      currentImpacts.set(symbol, value);
    });
    
    iteration++;
  }
  
  // Build final impacts array
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
  
  // Calculate statistics
  const totalAffected = impacts.filter(i => i.impact > 0.01).length;
  const maxImpact = impacts.length > 0 ? impacts[0].impact : 0;
  const averageImpact = impacts.length > 0 
    ? impacts.reduce((sum, i) => sum + i.impact, 0) / impacts.length 
    : 0;
  
  return {
    shockSymbol,
    shockMagnitude,
    impacts,
    totalAffected,
    maxImpact,
    averageImpact
  };
}

// Get sectors most affected by shock
export function getAffectedSectors(
  simulation: ShockSimulation,
  sectorMap: Map<string, string>
): Array<{ sector: string; totalImpact: number; stockCount: number }> {
  const sectorImpacts = new Map<string, { totalImpact: number; stockCount: number }>();
  
  simulation.impacts.forEach(impact => {
    const sector = sectorMap.get(impact.symbol) || "Unknown";
    const current = sectorImpacts.get(sector) || { totalImpact: 0, stockCount: 0 };
    sectorImpacts.set(sector, {
      totalImpact: current.totalImpact + impact.impact,
      stockCount: current.stockCount + 1
    });
  });
  
  return Array.from(sectorImpacts.entries())
    .map(([sector, data]) => ({
      sector,
      totalImpact: data.totalImpact,
      stockCount: data.stockCount
    }))
    .sort((a, b) => b.totalImpact - a.totalImpact);
}

