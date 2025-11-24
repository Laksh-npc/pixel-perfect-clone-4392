// Shock Propagation Engine
// Simulates how shocks propagate through the network using correlation, distance, and centrality

import { NetworkGraph } from "./networkEngine";
import { CorrelationMatrix } from "./correlationEngine";
import { performBFSForBrandes } from "./bcStepByStep";

export interface ShockInput {
  symbol: string;
  magnitude: number; // -0.2 to +0.2 (percentage)
}

export interface ShockImpact {
  symbol: string;
  initialShock: number;
  finalShock: number;
  distance: number;
  correlationLink: number;
  path: string[]; // Shortest path from source
}

export interface ShockPropagationResult {
  shockedNodes: string[];
  impacts: Map<string, ShockImpact>;
  maxImpact: number;
  affectedNodes: number;
}

/**
 * Compute shortest path distances from source nodes to all other nodes
 */
function computeShortestPaths(
  source: string,
  networkGraph: NetworkGraph,
  correlationMatrix: CorrelationMatrix
): Map<string, { distance: number; path: string[]; correlation: number }> {
  const result = new Map<string, { distance: number; path: string[]; correlation: number }>();
  
  try {
    const bfsData = performBFSForBrandes(source, networkGraph, correlationMatrix);
    
    // For each reachable node, get distance and reconstruct path
    bfsData.dist.forEach((dist, node) => {
      if (dist >= 0 && node !== source) {
        // Reconstruct path by backtracking from node to source
        const path: string[] = [];
        let current = node;
        
        // Backtrack using predecessors
        while (current !== source) {
          path.push(current);
          const preds = bfsData.predecessors.get(current) || [];
          if (preds.length > 0) {
            current = preds[0]; // Take first predecessor
          } else {
            // Can't reconstruct path
            break;
          }
        }
        
        if (current === source) {
          path.push(source);
          path.reverse(); // Now path goes from source to node
        } else {
          // Fallback: just use direct connection if available
          path.length = 0;
          path.push(source, node);
        }
        
        // Get correlation along the path (use minimum correlation as weakest link)
        let minCorrelation = 1;
        for (let i = 0; i < path.length - 1; i++) {
          const idx1 = correlationMatrix.symbols.indexOf(path[i]);
          const idx2 = correlationMatrix.symbols.indexOf(path[i + 1]);
          if (idx1 >= 0 && idx2 >= 0) {
            minCorrelation = Math.min(minCorrelation, Math.abs(correlationMatrix.matrix[idx1][idx2]));
          }
        }
        
        result.set(node, {
          distance: dist,
          path: path,
          correlation: minCorrelation
        });
      } else if (node === source) {
        // Source node itself
        result.set(node, {
          distance: 0,
          path: [source],
          correlation: 1.0
        });
      }
    });
  } catch (error) {
    console.error(`Error computing paths from ${source}:`, error);
  }
  
  return result;
}

/**
 * Propagate shock through the network
 */
export function propagateShock(
  shocks: ShockInput[],
  networkGraph: NetworkGraph,
  correlationMatrix: CorrelationMatrix,
  decayFactor: number = 0.5
): ShockPropagationResult {
  const impacts = new Map<string, ShockImpact>();
  const shockedSymbols = shocks.map(s => s.symbol);
  
  // Get max betweenness for hub boost calculation
  const maxBetweenness = Math.max(...networkGraph.nodes.map(n => n.betweenness), 1);
  
  // For each shocked node, compute propagation
  const allPaths = new Map<string, Map<string, { distance: number; path: string[]; correlation: number }>>();
  
  shockedSymbols.forEach(source => {
    allPaths.set(source, computeShortestPaths(source, networkGraph, correlationMatrix));
  });
  
  // Initialize impacts for shocked nodes
  shocks.forEach(shock => {
    const node = networkGraph.nodes.find(n => n.id === shock.symbol);
    const hubBoost = node ? 1 + (node.betweenness / maxBetweenness) : 1;
    
    impacts.set(shock.symbol, {
      symbol: shock.symbol,
      initialShock: shock.magnitude,
      finalShock: shock.magnitude * hubBoost,
      distance: 0,
      correlationLink: 1.0,
      path: [shock.symbol]
    });
  });
  
  // Propagate shocks to all other nodes
  networkGraph.nodes.forEach(targetNode => {
    if (shockedSymbols.includes(targetNode.id)) return; // Skip shocked nodes
    
    let totalImpact = 0;
    let minDistance = Infinity;
    let bestCorrelation = 0;
    let bestPath: string[] = [];
    
    // Sum effects from all shocked nodes
    shocks.forEach(shock => {
      const paths = allPaths.get(shock.symbol);
      if (!paths) return;
      
      const pathData = paths.get(targetNode.id);
      if (!pathData || pathData.distance === Infinity) return;
      
      // Calculate propagated shock
      // final_effect = shock * correlation(i,j) * decay_factor^(distance)
      const decayedShock = shock.magnitude * Math.pow(decayFactor, pathData.distance);
      const correlationWeight = pathData.correlation;
      const propagatedImpact = decayedShock * correlationWeight;
      
      // Apply hub boost
      const hubBoost = 1 + (targetNode.betweenness / maxBetweenness);
      const finalImpact = propagatedImpact * hubBoost;
      
      totalImpact += finalImpact;
      
      // Track best path (shortest distance)
      if (pathData.distance < minDistance) {
        minDistance = pathData.distance;
        bestCorrelation = correlationWeight;
        bestPath = pathData.path;
      }
    });
    
    if (Math.abs(totalImpact) > 0.001) { // Only record significant impacts
      impacts.set(targetNode.id, {
        symbol: targetNode.id,
        initialShock: 0,
        finalShock: totalImpact,
        distance: minDistance,
        correlationLink: bestCorrelation,
        path: bestPath
      });
    }
  });
  
  // Calculate statistics
  const impactValues = Array.from(impacts.values()).map(i => Math.abs(i.finalShock));
  const maxImpact = Math.max(...impactValues, 0);
  const affectedNodes = impacts.size;
  
  return {
    shockedNodes: shockedSymbols,
    impacts,
    maxImpact,
    affectedNodes
  };
}

/**
 * Compute shock propagation over multiple time steps
 */
export function computeShockTimeline(
  shocks: ShockInput[],
  networkGraph: NetworkGraph,
  correlationMatrix: CorrelationMatrix,
  decayFactor: number,
  timeSteps: number = 3
): Array<{ step: number; impacts: Map<string, number> }> {
  const timeline: Array<{ step: number; impacts: Map<string, number> }> = [];
  
  // Step 0: Initial shocks
  const step0Impacts = new Map<string, number>();
  shocks.forEach(shock => {
    step0Impacts.set(shock.symbol, shock.magnitude);
  });
  timeline.push({ step: 0, impacts: step0Impacts });
  
  // Subsequent steps: propagate with additional decay
  for (let step = 1; step <= timeSteps; step++) {
    const stepImpacts = new Map<string, number>();
    const prevImpacts = timeline[step - 1].impacts;
    
    // Apply additional decay to all previous impacts
    prevImpacts.forEach((impact, symbol) => {
      const decayedImpact = impact * Math.pow(decayFactor, step);
      if (Math.abs(decayedImpact) > 0.001) {
        stepImpacts.set(symbol, decayedImpact);
      }
    });
    
    timeline.push({ step, impacts: stepImpacts });
  }
  
  return timeline;
}

