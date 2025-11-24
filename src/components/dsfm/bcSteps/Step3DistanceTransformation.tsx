import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { correlationToDistance, calculateDistanceMatrix } from "@/services/dsfm/bcStepByStep";
import { Info } from "lucide-react";

interface Step3DistanceTransformationProps {
  correlationMatrix: CorrelationMatrix | null;
  loading: boolean;
}

const Step3DistanceTransformation = ({ correlationMatrix, loading }: Step3DistanceTransformationProps) => {
  // Calculate distance matrix
  const distanceMatrix = useMemo(() => {
    if (!correlationMatrix) return null;
    return calculateDistanceMatrix(correlationMatrix);
  }, [correlationMatrix]);

  // Prepare 10x10 sample distance matrix
  const sampleDistanceData = useMemo(() => {
    if (!distanceMatrix || !correlationMatrix) return [];
    
    const sampleSize = 10;
    const n = correlationMatrix.symbols.length;
    const step = Math.max(1, Math.floor(n / sampleSize));
    
    const data: Array<{ x: string; y: string; value: number }> = [];
    
    for (let i = 0; i < sampleSize; i++) {
      for (let j = 0; j < sampleSize; j++) {
        const idxI = i * step;
        const idxJ = j * step;
        if (idxI < n && idxJ < n) {
          data.push({
            x: correlationMatrix.symbols[idxI].replace('.NS', ''),
            y: correlationMatrix.symbols[idxJ].replace('.NS', ''),
            value: distanceMatrix[idxI][idxJ]
          });
        }
      }
    }
    
    return data;
  }, [distanceMatrix, correlationMatrix]);

  if (loading || !correlationMatrix || !distanceMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 3: Distance Matrix (Used for Shortest Path Calculation)</h3>
        <p className="text-sm text-gray-500">Loading distance matrix...</p>
      </Card>
    );
  }

  const sampleSymbols = Array.from(new Set(sampleDistanceData.map(d => d.x))).slice(0, 10);

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 3: Distance Matrix (Used for Shortest Path Calculation)</h3>
        <p className="text-sm text-gray-600 mb-3">
          We convert correlation to distance using: <code className="bg-gray-100 px-2 py-1 rounded text-xs">d = √(2 × (1 - corr))</code>
        </p>
      </div>

      {/* 10x10 Sample Distance Matrix */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Distance Matrix Sample (10×10)</h4>
        <div className="border rounded-md p-2 bg-gray-50" style={{ maxHeight: '400px', overflow: 'auto' }}>
          <div className="grid grid-cols-11 gap-0.5 text-[10px]">
            <div className="font-semibold"></div>
            {sampleSymbols.map(symbol => (
              <div 
                key={symbol} 
                className="font-semibold text-center truncate p-0.5" 
                title={symbol}
              >
                {symbol.substring(0, 4)}
              </div>
            ))}
            {sampleSymbols.map((symbolX, i) => (
              <div key={`row-${i}`} className="contents">
                <div 
                  className="font-semibold text-right pr-1 truncate p-0.5" 
                  title={symbolX}
                >
                  {symbolX.substring(0, 4)}
                </div>
                {sampleSymbols.map((symbolY, j) => {
                  const data = sampleDistanceData.find(d => d.x === symbolX && d.y === symbolY);
                  const value = data?.value || 0;
                  // Normalize distance to 0-1 for color intensity (max distance is ~2)
                  const intensity = 1 - (value / 2);
                  const color = `rgba(196, 181, 253, ${Math.max(0, intensity)})`;
                  
                  return (
                    <div
                      key={`cell-${i}-${j}`}
                      className="text-center p-0.5 border border-gray-300 rounded cursor-help"
                      style={{ backgroundColor: color }}
                      title={`${symbolX} vs ${symbolY}: ${value.toFixed(3)}`}
                    >
                      {value.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <Card className="mt-2 p-2 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              Lower distance values indicate stronger correlation between stocks. These distances are used to compute shortest paths in betweenness centrality.
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default Step3DistanceTransformation;
