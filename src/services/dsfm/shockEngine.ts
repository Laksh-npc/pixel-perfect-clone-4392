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
}

// Simulate shock propagation
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
  const shockNode = networkGraph.nodes.find(n => n.id === shockSymbol);
  const shockCentrality = shockNode?.betweenness || 0;
  
  // Calculate impact for each stock
  correlationMatrix.symbols.forEach((symbol, idx) => {
    if (symbol !== shockSymbol) {
      const correlation = correlationMatrix.matrix[shockIndex][idx];
      const node = networkGraph.nodes.find(n => n.id === symbol);
      const centrality = node?.betweenness || 0;
      
      // Impact formula: Corr(stock, shock) * Centrality(shock) * ShockMagnitude
      const impact = Math.abs(correlation) * (1 + shockCentrality / 100) * shockMagnitude;
      
      impacts.push({
        symbol,
        impact,
        originalCorrelation: correlation,
        centrality
      });
    }
  });
  
  // Sort by impact
  impacts.sort((a, b) => b.impact - a.impact);
  
  // Calculate statistics
  const totalAffected = impacts.filter(i => i.impact > 0.01).length;
  const maxImpact = impacts.length > 0 ? impacts[0].impact : 0;
  const averageImpact = impacts.reduce((sum, i) => sum + i.impact, 0) / impacts.length;
  
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

