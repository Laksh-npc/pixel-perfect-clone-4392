import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Components
import TimeRangeSelector, { TimeRange } from "@/components/dsfm/TimeRangeSelector";
import ModeToggle, { AnalysisMode } from "@/components/dsfm/ModeToggle";
import CorrelationNetworkGraph from "@/components/dsfm/CorrelationNetworkGraph";
import CentralityTable from "@/components/dsfm/CentralityTable";
import ShockSimulator from "@/components/dsfm/ShockSimulator";
import Insights from "@/components/dsfm/Insights";
import DataValidation from "@/components/dsfm/DataValidation";

// Services
import {
  fetchMultipleStocks,
  getDateRange,
  formatDate,
  NIFTY50_TICKERS,
  SECTOR_INDICES
} from "@/services/dsfm/dataFetcher";
import { buildCorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { buildNetworkGraph, getTopBridgeNodes } from "@/services/dsfm/networkEngine";
import { simulateShock } from "@/services/dsfm/shockEngine";
import { StockData } from "@/services/dsfm/dataFetcher";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { ShockSimulation } from "@/services/dsfm/shockEngine";

// Sector mapping
import sectorMapping from "@/lib/sector_mapping.json";

const DSFMAnalysis = () => {
  const [mode, setMode] = useState<AnalysisMode>("stock");
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix | null>(null);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraph | null>(null);
  const [shockSimulation, setShockSimulation] = useState<ShockSimulation | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("overview");

  // Get symbols based on mode
  const symbols = useMemo(() => {
    return mode === "stock" ? NIFTY50_TICKERS : SECTOR_INDICES;
  }, [mode]);

  // Create sector map
  const sectorMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(sectorMapping).forEach(([symbol, sector]) => {
      map.set(symbol, sector as string);
    });
    return map;
  }, []);

  // Get date range
  const dateRange = useMemo(() => {
    if (timeRange === "custom" && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }
    return getDateRange(timeRange);
  }, [timeRange, customStartDate, customEndDate]);

  // Fetch data when mode or time range changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingProgress({ loaded: 0, total: symbols.length });
      
      try {
        console.log(`Loading ${mode === "stock" ? "stock-level" : "sector-level"} data for ${timeRange} period`);
        console.log(`Date range: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`);
        
        const data = await fetchMultipleStocks(
          symbols, 
          dateRange.start, 
          dateRange.end,
          (loaded, total) => setLoadingProgress({ loaded, total })
        );
        
        // Check if we have enough data (at least 2 stocks/sectors for correlation)
        if (data.length < 2) {
          console.warn(`Only ${data.length} ${mode === "stock" ? "stocks" : "sectors"} loaded. Need at least 2 for correlation analysis.`);
          setStockData([]);
          setCorrelationMatrix(null);
          setNetworkGraph(null);
          return;
        }
        
        console.log(`Building correlation matrix for ${data.length} ${mode === "stock" ? "stocks" : "sectors"}`);
        setStockData(data);
        
        // Build correlation matrix
        const matrix = buildCorrelationMatrix(data);
        console.log(`Correlation matrix built: ${matrix.symbols.length} symbols`);
        setCorrelationMatrix(matrix);
        
        // Build network graph
        const graph = buildNetworkGraph(matrix, 0.5, sectorMap);
        console.log(`Network graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
        setNetworkGraph(graph);
      } catch (error) {
        console.error("Error loading data:", error);
        setStockData([]);
        setCorrelationMatrix(null);
        setNetworkGraph(null);
      } finally {
        setLoading(false);
        setLoadingProgress({ loaded: 0, total: 0 });
      }
    };

    loadData();
  }, [mode, dateRange, symbols, sectorMap, timeRange]);

  // Handle shock simulation
  const handleShockSimulate = (symbol: string, magnitude: number): ShockSimulation | null => {
    if (!correlationMatrix || !networkGraph) return null;
    
    try {
      const simulation = simulateShock(symbol, magnitude, correlationMatrix, networkGraph);
      setShockSimulation(simulation);
      return simulation;
    } catch (error) {
      console.error("Error simulating shock:", error);
      return null;
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (!networkGraph) return;

    const topNodes = getTopBridgeNodes(networkGraph, 20);
    const csvContent = [
      ["Rank", "Symbol", "Betweenness Centrality", "Degree Centrality", "Sector"].join(","),
      ...topNodes.map((node, idx) => [
        idx + 1,
        node.label,
        node.betweenness.toFixed(4),
        node.degree,
        node.sector || "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsfm_analysis_${mode}_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Market Stability & Influence Analyzer
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Network theory, correlation analysis, and shock simulation for market dynamics
              </p>
            </div>
            {networkGraph && (
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <ModeToggle mode={mode} onModeChange={setMode} />
            <TimeRangeSelector
              selectedRange={timeRange}
              onRangeChange={setTimeRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomDatesChange={(start, end) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">
                    Loading {mode === "stock" ? "Stock-Level" : "Sector-Level"} Network Data
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Time Range: {timeRange} ({formatDate(dateRange.start)} to {formatDate(dateRange.end)})
                  </p>
                  <p className="text-xs text-gray-500">
                    Loading {loadingProgress.loaded} of {loadingProgress.total} {mode === "stock" ? "stocks" : "sectors"}...
                  </p>
                  {loadingProgress.total > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3 max-w-md">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            <Skeleton className="h-[500px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="network">
                {mode === "stock" ? "Stock Network" : "Sector Network"}
              </TabsTrigger>
              <TabsTrigger value="bridge">Bridge Finder</TabsTrigger>
              <TabsTrigger value="shock">Shock Simulator</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Data Source Info */}
              {stockData.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">
                        Real-Time Data Analysis
                      </h3>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>
                          <span className="font-medium">Mode:</span> {mode === "stock" ? "Stock-Level Network (NIFTY50)" : "Sector-Level Network (NIFTY Sector Indices)"}
                        </p>
                        <p>
                          <span className="font-medium">Time Range:</span> {timeRange} - Analyzing data from {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
                        </p>
                        <p>
                          <span className="font-medium">Data Points:</span> {stockData.length} {mode === "stock" ? "stocks" : "sectors"} loaded with real-time historical prices
                        </p>
                        <p className="text-blue-600 font-medium mt-2">
                          ✓ Using real-time API data (not mock data)
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-2">Network Statistics</h3>
                  {networkGraph ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Nodes:</span>
                        <span className="font-medium">{networkGraph.nodes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Edges:</span>
                        <span className="font-medium">{networkGraph.edges.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Degree:</span>
                        <span className="font-medium">
                          {(networkGraph.edges.length * 2 / networkGraph.nodes.length).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Range:</span>
                        <span className="font-medium">{timeRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data Source:</span>
                        <span className="font-medium text-green-600">Real-Time API</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Loading...</div>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-2">Correlation Statistics</h3>
                  {correlationMatrix ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Correlation:</span>
                        <span className="font-medium">
                          {(
                            correlationMatrix.matrix
                              .flat()
                              .filter((v, i, arr) => {
                                const row = Math.floor(i / correlationMatrix.symbols.length);
                                const col = i % correlationMatrix.symbols.length;
                                return row !== col;
                              })
                              .reduce((sum, val) => sum + Math.abs(val), 0) /
                            (correlationMatrix.symbols.length * (correlationMatrix.symbols.length - 1))
                          ).toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Correlation:</span>
                        <span className="font-medium">
                          {Math.max(
                            ...correlationMatrix.matrix
                              .flat()
                              .filter((v, i, arr) => {
                                const row = Math.floor(i / correlationMatrix.symbols.length);
                                const col = i % correlationMatrix.symbols.length;
                                return row !== col;
                              })
                              .map(v => Math.abs(v))
                          ).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Loading...</div>
                  )}
                </Card>
              </div>

              {networkGraph && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <CentralityTable
                    nodes={networkGraph.nodes}
                    title="Top 10 Bridge Nodes"
                    maxRows={10}
                  />
                  <CorrelationNetworkGraph
                    graph={networkGraph}
                    loading={loading}
                    mode={mode}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <CorrelationNetworkGraph
                graph={networkGraph}
                loading={loading}
                mode={mode}
              />
            </TabsContent>

            <TabsContent value="bridge" className="space-y-4">
              {networkGraph && (
                <CentralityTable
                  nodes={networkGraph.nodes}
                  title={`Top 20 Bridge ${mode === "stock" ? "Stocks" : "Sectors"}`}
                  maxRows={20}
                />
              )}
            </TabsContent>

            <TabsContent value="shock" className="space-y-4">
              {networkGraph && correlationMatrix && (
                <ShockSimulator
                  symbols={symbols}
                  onSimulate={handleShockSimulate}
                  networkGraph={networkGraph}
                  sectorMap={sectorMap}
                  mode={mode}
                />
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Insights
                mode={mode}
                networkGraph={networkGraph}
                correlationMatrix={correlationMatrix}
                shockSimulation={shockSimulation}
                timeRange={timeRange}
              />
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              <DataValidation
                stockData={stockData}
                correlationMatrix={correlationMatrix}
                networkGraph={networkGraph}
                timeRange={timeRange}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default DSFMAnalysis;

