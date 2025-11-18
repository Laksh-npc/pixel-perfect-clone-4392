import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShockSimulation, getAffectedSectors } from "@/services/dsfm/shockEngine";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, AlertTriangle } from "lucide-react";

interface ShockSimulatorProps {
  symbols: string[];
  onSimulate: (symbol: string, magnitude: number) => ShockSimulation | null;
  networkGraph: NetworkGraph | null;
  sectorMap: Map<string, string>;
  mode: "stock" | "sector";
}

const ShockSimulator = ({
  symbols,
  onSimulate,
  networkGraph,
  sectorMap,
  mode
}: ShockSimulatorProps) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbols[0] || "");
  const [shockMagnitude, setShockMagnitude] = useState<number>(5);
  const [simulation, setSimulation] = useState<ShockSimulation | null>(null);

  const handleSimulate = () => {
    if (!selectedSymbol) return;
    const result = onSimulate(selectedSymbol, shockMagnitude);
    setSimulation(result);
  };

  const affectedSectors = simulation
    ? getAffectedSectors(simulation, sectorMap)
    : [];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Shock Propagation Simulator</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-600 mb-2 block">
              Select {mode === "stock" ? "Stock" : "Sector"} to Shock
            </label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol.replace('.NS', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-2 block">
              Shock Magnitude: {shockMagnitude}%
            </label>
            <Slider
              value={[shockMagnitude]}
              onValueChange={([value]) => setShockMagnitude(value)}
              min={1}
              max={15}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1%</span>
              <span>15%</span>
            </div>
          </div>

          <Button onClick={handleSimulate} className="w-full">
            <TrendingDown className="w-4 h-4 mr-2" />
            Simulate Shock
          </Button>
        </div>
      </Card>

      {simulation && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-semibold">Simulation Results</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-xs text-gray-500">Total Affected</div>
                <div className="text-lg font-bold">{simulation.totalAffected}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-xs text-gray-500">Max Impact</div>
                <div className="text-lg font-bold">{simulation.maxImpact.toFixed(2)}%</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-xs text-gray-500">Avg Impact</div>
                <div className="text-lg font-bold">{simulation.averageImpact.toFixed(2)}%</div>
              </div>
            </div>

            {affectedSectors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2">Most Affected Sectors</h4>
                <div className="space-y-1">
                  {affectedSectors.slice(0, 5).map((sector, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs"
                    >
                      <span>{sector.sector}</span>
                      <span className="font-medium">
                        {sector.totalImpact.toFixed(2)}% ({sector.stockCount} stocks)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold mb-2">Top 10 Most Impacted</h4>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Impact %</TableHead>
                      <TableHead className="text-right">Correlation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulation.impacts.slice(0, 10).map((impact, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {impact.symbol.replace('.NS', '')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {impact.impact.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right text-xs text-gray-500">
                          {impact.originalCorrelation.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShockSimulator;

