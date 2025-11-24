import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CorrelationMatrix, getTopCorrelatedPairs } from "@/services/dsfm/correlationEngine";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Info } from "lucide-react";

interface Step2CorrelationMatrixProps {
  correlationMatrix: CorrelationMatrix | null;
  stockData: any[]; // Not used but kept for interface compatibility
  loading: boolean;
}

const Step2CorrelationMatrix = ({ correlationMatrix, stockData, loading }: Step2CorrelationMatrixProps) => {
  const [showFormula, setShowFormula] = useState(false);

  // Get top 10 correlations (reduced from 15)
  const topCorrelations = useMemo(() => {
    if (!correlationMatrix) return [];
    return getTopCorrelatedPairs(correlationMatrix, 10);
  }, [correlationMatrix]);

  // Prepare 10x10 sample heatmap data (compact)
  const sampleHeatmapData = useMemo(() => {
    if (!correlationMatrix) return [];
    
    const sampleSize = 10;
    const n = correlationMatrix.symbols.length;
    const step = Math.max(1, Math.floor(n / sampleSize));
    
    const data: Array<{ x: string; y: string; value: number; xIdx: number; yIdx: number }> = [];
    
    for (let i = 0; i < sampleSize; i++) {
      for (let j = 0; j < sampleSize; j++) {
        const idxI = i * step;
        const idxJ = j * step;
        if (idxI < n && idxJ < n) {
          data.push({
            x: correlationMatrix.symbols[idxI].replace('.NS', ''),
            y: correlationMatrix.symbols[idxJ].replace('.NS', ''),
            value: correlationMatrix.matrix[idxI][idxJ],
            xIdx: idxI,
            yIdx: idxJ
          });
        }
      }
    }
    
    return data;
  }, [correlationMatrix]);

  if (loading || !correlationMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 2: Correlation Matrix Explainer</h3>
        <p className="text-sm text-gray-500">Loading correlation matrix...</p>
      </Card>
    );
  }

  const sampleSymbols = Array.from(new Set(sampleHeatmapData.map(d => d.x))).slice(0, 10);

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 2: Correlation Matrix Explainer</h3>
        <p className="text-sm text-gray-600 mb-3">
          We compute a Pearson correlation matrix (50×50) measuring how stock returns move together.
          Correlation ranges from -1 (perfect negative) to +1 (perfect positive).
        </p>
      </div>

      {/* Collapsible Formula Card */}
      <Collapsible open={showFormula} onOpenChange={setShowFormula}>
        <CollapsibleTrigger className="w-full">
          <Card className="p-3 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showFormula ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">Correlation Formula</span>
              </div>
            </div>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 p-3 bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>Pearson Correlation:</strong>{" "}
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                corr(x,y) = cov(x,y) / (std(x) × std(y))
              </code>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Heatmap and Top Correlations - Side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 10x10 Sample Correlation Matrix - Compact */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Correlation Matrix Sample (10×10)</h4>
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
                    const data = sampleHeatmapData.find(d => d.x === symbolX && d.y === symbolY);
                    const value = data?.value || 0;
                    const intensity = Math.abs(value);
                    const color = value >= 0 
                      ? `rgba(165, 180, 252, ${intensity})` 
                      : `rgba(249, 168, 212, ${intensity})`;
                    
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
                Sample of full 50×50 matrix. Blue = positive correlation, Pink = negative correlation.
              </div>
            </div>
          </Card>
        </div>

        {/* Top 10 Correlations Table */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Top 10 Strongest Correlations</h4>
          <div className="border rounded-md" style={{ maxHeight: '400px', overflow: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-xs">#</TableHead>
                  <TableHead className="text-xs">Stock 1</TableHead>
                  <TableHead className="text-xs">Stock 2</TableHead>
                  <TableHead className="text-right text-xs">Corr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCorrelations.map((pair, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-xs">{idx + 1}</TableCell>
                    <TableCell className="text-xs">{pair.symbol1.replace('.NS', '')}</TableCell>
                    <TableCell className="text-xs">{pair.symbol2.replace('.NS', '')}</TableCell>
                    <TableCell className="text-right">
                      <span 
                        className={pair.correlation >= 0 ? 'text-blue-600 font-medium' : 'text-pink-600 font-medium'}
                        title={`Correlation: ${pair.correlation.toFixed(4)}`}
                      >
                        {pair.correlation.toFixed(3)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Step2CorrelationMatrix;
