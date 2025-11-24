import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { propagateShock, computeShockTimeline, ShockImpact } from "@/services/dsfm/shockPropagation";
import { shockApi, ShockSimulationResponse } from "@/services/dsfm/shockApi";
import { StockData } from "@/services/dsfm/dataFetcher";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronDown, ChevronRight, Info, Download } from "lucide-react";
import ShockPriceComparison from "./ShockPriceComparison";

interface ShockSimulatorProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  stockData: StockData[];
  loading: boolean;
  threshold?: number;
  timeWindow?: string;
}

const ShockSimulator = ({ networkGraph, correlationMatrix, stockData, loading, threshold = 0.5, timeWindow = "1y" }: ShockSimulatorProps) => {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [shockMagnitude, setShockMagnitude] = useState(0.01); // 1% default
  const [decayFactor, setDecayFactor] = useState(0.5);
  const [useSignedCorr, setUseSignedCorr] = useState(true);
  const [hubBoostEnabled, setHubBoostEnabled] = useState(true);
  const [showFormula, setShowFormula] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useApi, setUseApi] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<ShockSimulationResponse | null>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<any>(null);

  // Initialize with top 5 BC nodes
  useEffect(() => {
    if (networkGraph && selectedStocks.length === 0) {
      const top5 = networkGraph.nodes
        .sort((a, b) => b.betweenness - a.betweenness)
        .slice(0, 5)
        .map(n => n.id);
      setSelectedStocks(top5);
    }
  }, [networkGraph, selectedStocks.length]);

  // API-based simulation
  const runApiSimulation = async () => {
    if (selectedStocks.length === 0) return;
    
    setApiLoading(true);
    setApiError(null);
    try {
      const result = await shockApi.simulateShock({
        sources: selectedStocks.map(s => s.replace('.NS', '')),
        initial_shock_pct: shockMagnitude,
        decay_factor: decayFactor,
        use_signed_corr: useSignedCorr,
        hub_boost_enabled: hubBoostEnabled
      });
      setApiResult(result);
      setUseApi(true);
    } catch (error: any) {
      console.warn("API simulation failed, falling back to client-side:", error);
      setApiError(error.message);
      setUseApi(false);
    } finally {
      setApiLoading(false);
    }
  };

  // Client-side computation (fallback)
  const shockInputs = useMemo(() => {
    return selectedStocks.map(symbol => ({
      symbol,
      magnitude: shockMagnitude
    }));
  }, [selectedStocks, shockMagnitude]);

  const propagationResult = useMemo(() => {
    if (useApi && apiResult) return null; // Use API result instead
    if (!networkGraph || !correlationMatrix || selectedStocks.length === 0) return null;
    
    try {
      return propagateShock(shockInputs, networkGraph, correlationMatrix, decayFactor);
    } catch (error) {
      console.error("Error propagating shock:", error);
      return null;
    }
  }, [networkGraph, correlationMatrix, shockInputs, decayFactor, useApi, apiResult]);

  // Convert API result to propagation result format
  const apiPropagationResult = useMemo(() => {
    if (!apiResult || !networkGraph) return null;
    
    const impacts = new Map<string, ShockImpact>();
    
    // Add shocked nodes
    apiResult.final_effects && Object.entries(apiResult.final_effects).forEach(([symbol, effect]) => {
      const fullSymbol = symbol.includes('.NS') ? symbol : `${symbol}.NS`;
      const isShocked = apiResult.summary && selectedStocks.some(s => s.replace('.NS', '') === symbol);
      
      // Find closest source and distance
      let closestSource = selectedStocks[0] || '';
      let minDistance = Infinity;
      let correlation = 0;
      
      if (apiResult.per_source_contrib) {
        Object.entries(apiResult.per_source_contrib).forEach(([source, contribs]) => {
          const contrib = contribs[symbol];
          if (contrib && Math.abs(contrib) > 0) {
            // Estimate distance from contribution magnitude
            const estimatedDist = Math.log(Math.abs(contrib / shockMagnitude) / (Math.abs(contrib) || 1)) / Math.log(decayFactor);
            if (estimatedDist < minDistance) {
              minDistance = estimatedDist;
              closestSource = source;
              correlation = Math.abs(contrib / (shockMagnitude * Math.pow(decayFactor, estimatedDist))) || 0;
            }
          }
        });
      }
      
      impacts.set(fullSymbol, {
        symbol: fullSymbol,
        initialShock: isShocked ? shockMagnitude : 0,
        finalShock: effect,
        distance: isShocked ? 0 : Math.max(1, Math.round(minDistance)),
        correlationLink: correlation || 0.5,
        path: isShocked ? [fullSymbol] : [closestSource.replace('.NS', ''), symbol]
      });
    });
    
    return {
      shockedNodes: selectedStocks,
      impacts,
      maxImpact: apiResult.summary?.max_impact || 0,
      affectedNodes: apiResult.summary?.total_affected || 0
    };
  }, [apiResult, networkGraph, selectedStocks, shockMagnitude, decayFactor]);

  const activeResult = useApi && apiPropagationResult ? apiPropagationResult : propagationResult;

  // Timeline from API or client-side
  const timeline = useMemo(() => {
    if (useApi && apiResult?.time_series) {
      return apiResult.time_series.map(ts => ({
        step: ts.t,
        impacts: new Map(Object.entries(ts.impacts).map(([k, v]) => [k.includes('.NS') ? k : `${k}.NS`, v]))
      }));
    }
    
    if (!networkGraph || !correlationMatrix || selectedStocks.length === 0) return [];
    
    try {
      return computeShockTimeline(shockInputs, networkGraph, correlationMatrix, decayFactor, 3);
    } catch (error) {
      console.error("Error computing timeline:", error);
      return [];
    }
  }, [useApi, apiResult, networkGraph, correlationMatrix, shockInputs, decayFactor, selectedStocks.length]);

  // Impact table data
  const impactTableData = useMemo(() => {
    if (!activeResult) return [];
    
    return Array.from(activeResult.impacts.values())
      .sort((a, b) => Math.abs(b.finalShock) - Math.abs(a.finalShock))
      .slice(0, 20);
  }, [activeResult]);

  // Export CSV
  const exportCSV = () => {
    if (!activeResult) return;
    
    const rows = [
      ['Stock', 'Initial Shock (%)', 'Final Shock (%)', 'Distance', 'Correlation Link', 'Closest Source'].join(',')
    ];
    
    impactTableData.forEach(impact => {
      const closestSource = impact.path?.[0] || 'N/A';
      rows.push([
        impact.symbol.replace('.NS', ''),
        (impact.initialShock * 100).toFixed(2),
        (impact.finalShock * 100).toFixed(4),
        impact.distance.toString(),
        impact.correlationLink.toFixed(4),
        closestSource
      ].join(','));
    });
    
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shock_simulation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Network visualization
  useEffect(() => {
    if (!activeResult || !networkGraph || !networkRef.current || loading) return;

    import("vis-network").then((vis) => {
      if (!networkRef.current) return;

      const maxImpact = activeResult.maxImpact || 1;
      const impacts = activeResult.impacts;

      const nodes = networkGraph.nodes.map(node => {
        const impact = impacts.get(node.id);
        const impactValue = impact ? impact.finalShock : 0;
        const absImpact = Math.abs(impactValue);
        const isShocked = activeResult.shockedNodes.includes(node.id);
        
        let color = '#9ca3af';
        if (absImpact > 0.001) {
          if (impactValue > 0) {
            const intensity = Math.min(absImpact / maxImpact, 1);
            color = `rgba(16, 185, 129, ${0.5 + intensity * 0.5})`;
          } else {
            const intensity = Math.min(absImpact / maxImpact, 1);
            color = `rgba(239, 68, 68, ${0.5 + intensity * 0.5})`;
          }
        }
        
        const baseSize = isShocked ? 25 : 15;
        const sizeMultiplier = 1 + (absImpact / maxImpact) * 2;
        const nodeSize = baseSize * sizeMultiplier;

        return {
          id: node.id,
          label: node.label,
          value: nodeSize,
          title: `${node.label}\nImpact: ${(impactValue * 100).toFixed(2)}%\nDistance: ${impact?.distance ?? 'N/A'}\nBC: ${node.betweenness.toFixed(4)}`,
          color: {
            background: isShocked ? '#f87171' : color,
            border: isShocked ? '#dc2626' : '#6366f1',
            highlight: { border: '#4f46e5' }
          }
        };
      });

      const edges = networkGraph.edges.map(edge => {
        const fromImpact = impacts.get(edge.from);
        const toImpact = impacts.get(edge.to);
        const isInPath = fromImpact?.path?.includes(edge.to) || toImpact?.path?.includes(edge.from);
        
        return {
          from: edge.from,
          to: edge.to,
          color: {
            color: isInPath ? '#ef4444' : '#a5b4fc',
            opacity: isInPath ? 0.8 : 0.3,
            highlight: '#6366f1'
          },
          width: isInPath ? 2 : 0.5
        };
      });

      const data = { nodes, edges };
      const options = {
        nodes: {
          shape: 'dot',
          font: { size: 10, color: '#374151' },
          borderWidth: 1.5
        },
        edges: {
          width: 0.5,
          smooth: { type: 'continuous', roundness: 0.5 }
        },
        physics: {
          enabled: true,
          stabilization: { iterations: 100 }
        },
        interaction: {
          hover: true,
          tooltipDelay: 100
        }
      };

      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }

      networkInstanceRef.current = new vis.Network(networkRef.current, data, options);
    });
  }, [activeResult, networkGraph, loading]);

  const handleAddStock = (symbol: string) => {
    if (selectedStocks.length < 5 && !selectedStocks.includes(symbol)) {
      setSelectedStocks([...selectedStocks, symbol]);
    }
  };

  const handleRemoveStock = (symbol: string) => {
    setSelectedStocks(selectedStocks.filter(s => s !== symbol));
  };

  // Auto-run API simulation when parameters change (debounced) - only if API mode is enabled
  useEffect(() => {
    if (!useApi || selectedStocks.length === 0 || apiLoading) return;
    
    const timer = setTimeout(() => {
      runApiSimulation();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedStocks.join(','), shockMagnitude, decayFactor, useSignedCorr, hubBoostEnabled, useApi]);

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Shock Simulator</h3>
        <p className="text-sm text-gray-500">Loading data...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Shock Simulator</h3>
        <p className="text-sm text-gray-600">
          Simulate how shocks to high-betweenness-centrality stocks propagate through the network.
        </p>
      </div>

      {/* Formula Collapsible */}
      <Collapsible open={showFormula} onOpenChange={setShowFormula}>
        <CollapsibleTrigger className="w-full">
          <Card className="p-2 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showFormula ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">Propagation Formula</span>
              </div>
            </div>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 p-3 bg-blue-50 border-blue-200 rounded-lg">
            <div className="text-xs text-blue-800 space-y-1">
              <p>
                <strong>Propagation:</strong> final = initial × corr × decay<sup>distance</sup> × hub_boost
              </p>
              <p>
                <strong>Hub Boost:</strong> hub_boost = 1 + (centrality / max_centrality)
              </p>
              <p className="text-gray-600 mt-2">
                Hover over symbols in the formula for tooltips. Shock propagation strength depends on correlation, distance, and centrality.
              </p>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock Selection */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">
            Select Stocks to Shock (1-5): {selectedStocks.length}/5
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedStocks.map(symbol => (
              <Badge 
                key={symbol} 
                variant="secondary" 
                className="px-2 py-1 cursor-pointer hover:bg-red-100"
                onClick={() => handleRemoveStock(symbol)}
              >
                {symbol.replace('.NS', '')} ×
              </Badge>
            ))}
          </div>
          {selectedStocks.length < 5 && (
            <Select onValueChange={handleAddStock}>
              <SelectTrigger>
                <SelectValue placeholder="Add stock..." />
              </SelectTrigger>
              <SelectContent>
                {networkGraph.nodes
                  .filter(n => !selectedStocks.includes(n.id))
                  .map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.label} (BC: {node.betweenness.toFixed(3)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Shock Magnitude */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">
            Shock Magnitude: {(shockMagnitude * 100).toFixed(1)}%
          </Label>
          <Slider
            value={[shockMagnitude]}
            onValueChange={(vals) => setShockMagnitude(vals[0])}
            min={-0.2}
            max={0.2}
            step={0.01}
            className="w-full"
          />
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              value={(shockMagnitude * 100).toFixed(1)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setShockMagnitude(val / 100);
              }}
              className="w-20 h-7 text-xs"
              step="0.1"
            />
            <span className="text-xs text-gray-500 self-center">% (negative = drop, positive = rise)</span>
          </div>
        </div>

        {/* Decay Factor */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">
            Decay Factor: {decayFactor.toFixed(2)}
          </Label>
          <Slider
            value={[decayFactor]}
            onValueChange={(vals) => setDecayFactor(vals[0])}
            min={0.3}
            max={0.8}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Higher = shock propagates further, Lower = shock decays faster
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="w-full">
          <Card className="p-2 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showAdvanced ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">Advanced Options</span>
              </div>
            </div>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 p-3 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="signed-corr"
                checked={useSignedCorr}
                onCheckedChange={(checked) => setUseSignedCorr(checked === true)}
              />
              <Label htmlFor="signed-corr" className="text-sm cursor-pointer">
                Use signed correlation (preserve direction of shock)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hub-boost"
                checked={hubBoostEnabled}
                onCheckedChange={(checked) => setHubBoostEnabled(checked === true)}
              />
              <Label htmlFor="hub-boost" className="text-sm cursor-pointer">
                Enable hub boost (amplify shocks through high-centrality nodes)
              </Label>
            </div>
            {useApi && (
              <Button
                variant="outline"
                size="sm"
                onClick={runApiSimulation}
                disabled={apiLoading || selectedStocks.length === 0}
                className="w-full"
              >
                {apiLoading ? 'Running Simulation...' : 'Run API Simulation'}
              </Button>
            )}
            {apiError && (
              <Card className="p-2 bg-red-50 border-red-200">
                <p className="text-xs text-red-800">API Error: {apiError}. Using client-side computation.</p>
              </Card>
            )}
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Network Shock Map */}
      {activeResult && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Network Shock Map</h4>
            {activeResult && (
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-3 h-3 mr-1" />
                Export CSV
              </Button>
            )}
          </div>
          <div 
            ref={networkRef} 
            className="w-full border rounded-lg"
            style={{ height: '400px' }}
          />
          <Card className="mt-2 p-2 bg-blue-50 border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                Red nodes = shocked stocks. Green = positive impact, Red = negative impact. 
                Node size = impact magnitude. Red edges = shock propagation paths.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Impact Table */}
      {activeResult && impactTableData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Impact Table (Top 20 Most Affected)</h4>
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Stock</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Initial Shock</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Final Shock</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Distance</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Correlation</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Closest Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impactTableData.map((impact) => {
                    const isShocked = activeResult.shockedNodes.includes(impact.symbol);
                    return (
                      <TableRow 
                        key={impact.symbol}
                        className={isShocked ? 'bg-red-50' : 'hover:bg-gray-50'}
                      >
                        <TableCell className="font-medium text-xs">
                          {impact.symbol.replace('.NS', '')}
                          {isShocked && <span className="ml-2 text-red-600">★ Shocked</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {(impact.initialShock * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          <span className={
                            impact.finalShock > 0 ? 'text-green-600 font-medium' : 
                            impact.finalShock < 0 ? 'text-red-600 font-medium' : 
                            'text-gray-500'
                          }>
                            {(impact.finalShock * 100).toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {impact.distance === 0 ? 'Source' : impact.distance}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {impact.correlationLink.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {impact.path?.[0]?.replace('.NS', '') || 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Actual vs Shocked Price Projection */}
      {activeResult && stockData.length > 0 && (
        <ShockPriceComparison
          stockData={stockData}
          impactResults={activeResult.impacts}
          loading={loading}
        />
      )}

    </Card>
  );
};

export default ShockSimulator;
