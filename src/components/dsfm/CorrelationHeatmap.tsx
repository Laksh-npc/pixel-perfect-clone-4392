import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CorrelationHeatmapProps {
  correlationMatrix: CorrelationMatrix | null;
  loading?: boolean;
}

/**
 * Ward linkage hierarchical clustering
 * Distance = 1 - correlation
 */
function hierarchicalClustering(matrix: CorrelationMatrix): number[] {
  const n = matrix.symbols.length;
  if (n === 0) return [];
  if (n === 1) return [0];
  
  // Build distance matrix: distance = 1 - corr
  const distances: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
      } else {
        distances[i][j] = 1 - Math.abs(matrix.matrix[i][j]);
      }
    }
  }
  
  // Initialize clusters: each node is its own cluster
  const clusters: number[][] = Array(n).fill(0).map((_, i) => [i]);
  const clusterDistances: number[][] = Array(n).fill(0).map(() => Array(n).fill(Infinity));
  
  // Calculate initial cluster distances using Ward's method
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      clusterDistances[i][j] = wardDistance(clusters[i], clusters[j], distances);
      clusterDistances[j][i] = clusterDistances[i][j];
    }
  }
  
  // Agglomerative clustering
  const activeClusters = new Set(Array.from({ length: n }, (_, i) => i));
  
  while (activeClusters.size > 1) {
    // Find closest clusters
    let minDist = Infinity;
    let mergeI = -1;
    let mergeJ = -1;
    
    for (const i of activeClusters) {
      for (const j of activeClusters) {
        if (i !== j && clusterDistances[i][j] < minDist) {
          minDist = clusterDistances[i][j];
          mergeI = i;
          mergeJ = j;
        }
      }
    }
    
    if (mergeI === -1 || mergeJ === -1) break;
    
    // Merge clusters
    const newCluster = [...clusters[mergeI], ...clusters[mergeJ]];
    const newIdx = Math.min(mergeI, mergeJ);
    const removeIdx = Math.max(mergeI, mergeJ);
    
    clusters[newIdx] = newCluster;
    activeClusters.delete(removeIdx);
    
    // Update distances
    for (const k of activeClusters) {
      if (k !== newIdx) {
        clusterDistances[newIdx][k] = wardDistance(clusters[newIdx], clusters[k], distances);
        clusterDistances[k][newIdx] = clusterDistances[newIdx][k];
      }
    }
  }
  
  // Get final order from largest cluster
  const finalCluster = clusters[Array.from(activeClusters)[0]];
  return finalCluster;
}

/**
 * Ward's linkage distance between two clusters
 * d_ward = sqrt((n_i * n_j / (n_i + n_j)) * ||c_i - c_j||^2)
 */
function wardDistance(cluster1: number[], cluster2: number[], distances: number[][]): number {
  if (cluster1.length === 0 || cluster2.length === 0) return Infinity;
  
  // Calculate centroid distances
  let sumDist = 0;
  let count = 0;
  
  for (const i of cluster1) {
    for (const j of cluster2) {
      sumDist += distances[i][j] * distances[i][j];
      count++;
    }
  }
  
  const avgDistSq = count > 0 ? sumDist / count : 0;
  const n1 = cluster1.length;
  const n2 = cluster2.length;
  
  // Ward's formula
  return Math.sqrt((n1 * n2 / (n1 + n2)) * avgDistSq);
}

const CorrelationHeatmap = ({ correlationMatrix, loading }: CorrelationHeatmapProps) => {
  const [clusterOrder, setClusterOrder] = useState<number[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    if (correlationMatrix) {
      const order = hierarchicalClustering(correlationMatrix);
      setClusterOrder(order);
    }
  }, [correlationMatrix]);

  if (loading || !correlationMatrix) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[500px] w-full" />
      </Card>
    );
  }

  const n = correlationMatrix.symbols.length;
  const cellSize = Math.max(8, Math.min(20, Math.floor(600 / n)));

  // Color interpolation: blue (-1) -> white (0) -> red (+1)
  const getColor = (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? 1 : -1;
    
    if (sign > 0) {
      // Positive: white to red
      const r = 255;
      const g = Math.floor(255 * (1 - absValue));
      const b = Math.floor(255 * (1 - absValue));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Negative: white to blue
      const r = Math.floor(255 * (1 - absValue));
      const g = Math.floor(255 * (1 - absValue));
      const b = 255;
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Correlation Heatmap (Clustered)</h3>
        <p className="text-xs text-gray-500">
          Hierarchical clustering applied. Hover for exact correlation values.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Color scale legend */}
          <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
            <span>-1.0</span>
            <div className="flex-1 mx-2 h-3 bg-gradient-to-r from-blue-500 via-white to-red-500 rounded"></div>
            <span>+1.0</span>
          </div>
          
          <div className="relative" style={{ width: `${n * cellSize}px`, height: `${n * cellSize}px` }}>
            {/* Y-axis labels - rotated 45° */}
            <div className="absolute -left-32 top-0 bottom-0 flex flex-col justify-around text-xs">
              {clusterOrder.map((idx) => {
                const sector = correlationMatrix.symbols[idx].replace('.NS', '');
                // Add sector color tag if available
                const sectorColors: Record<string, string> = {
                  "NIFTY BANK": "#10b981",
                  "NIFTY IT": "#3b82f6",
                  "NIFTY FINANCIAL SERVICES": "#06b6d4",
                  "NIFTY ENERGY": "#ef4444",
                  "NIFTY FMCG": "#ec4899",
                  "NIFTY PHARMA": "#8b5cf6"
                };
                const color = sectorColors[sector] || "#6b7280";
                
                return (
                  <div 
                    key={idx} 
                    className="text-right pr-2 truncate flex items-center gap-1" 
                    style={{ height: `${cellSize}px` }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{sector}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Heatmap cells */}
            <div className="ml-32">
              {clusterOrder.map((rowIdx, i) => (
                <div key={rowIdx} className="flex" style={{ height: `${cellSize}px` }}>
                  {clusterOrder.map((colIdx, j) => {
                    const value = correlationMatrix.matrix[rowIdx][colIdx];
                    const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
                    
                    return (
                      <TooltipProvider key={`${rowIdx}-${colIdx}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              style={{
                                width: `${cellSize}px`,
                                height: `${cellSize}px`,
                                backgroundColor: getColor(value),
                                border: isHovered ? '2px solid black' : '1px solid rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.1s'
                              }}
                              onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                              onMouseLeave={() => setHoveredCell(null)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-semibold">
                                {correlationMatrix.symbols[rowIdx].replace('.NS', '')} ↔ {correlationMatrix.symbols[colIdx].replace('.NS', '')}
                              </div>
                              <div>Correlation: {value.toFixed(3)}</div>
                              <div className="text-gray-500">
                                Distance: {Math.sqrt(2 * (1 - value)).toFixed(3)}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* X-axis labels - rotated 45° with sector color tags */}
            <div className="absolute top-full left-32 mt-2 flex text-xs">
              {clusterOrder.map((idx) => {
                const sector = correlationMatrix.symbols[idx].replace('.NS', '');
                const sectorColors: Record<string, string> = {
                  "NIFTY BANK": "#10b981",
                  "NIFTY IT": "#3b82f6",
                  "NIFTY FINANCIAL SERVICES": "#06b6d4",
                  "NIFTY ENERGY": "#ef4444",
                  "NIFTY FMCG": "#ec4899",
                  "NIFTY PHARMA": "#8b5cf6"
                };
                const color = sectorColors[sector] || "#6b7280";
                
                return (
                  <div
                    key={idx}
                    className="text-center flex items-center gap-1 justify-center"
                    style={{ 
                      width: `${cellSize}px`, 
                      transform: 'rotate(-45deg)', 
                      transformOrigin: 'top left',
                      height: `${Math.max(60, cellSize * 2)}px`
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{sector}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CorrelationHeatmap;

