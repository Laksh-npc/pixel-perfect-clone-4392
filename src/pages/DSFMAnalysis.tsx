import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Components
import TimeRangeSelector, { TimeRange } from "@/components/dsfm/TimeRangeSelector";
import CorrelationNetworkGraph from "@/components/dsfm/CorrelationNetworkGraph";
import CentralityTable from "@/components/dsfm/CentralityTable";
import BCStepByStep from "@/components/dsfm/bcSteps/BCStepByStep";
import ShockSimulator from "@/components/dsfm/ShockSimulator";
import HybridForecast from "@/components/dsfm/HybridForecast";

// Services
import {
  fetchMultipleStocks,
  getDateRange,
  formatDate,
  NIFTY50_TICKERS,
  SECTOR_INDICES
} from "@/services/dsfm/dataFetcher";
import { buildCorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { buildNetworkGraph } from "@/services/dsfm/networkEngine";
import { StockData } from "@/services/dsfm/dataFetcher";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { NetworkGraph } from "@/services/dsfm/networkEngine";

// Sector mapping
import sectorMapping from "@/lib/sector_mapping.json";

const DSFMAnalysis = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  // Fixed to stock-level and threshold mode
  const [threshold, setThreshold] = useState(0.5);
  
  // Node selection for bridge path viewer
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix | null>(null);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraph | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("overview");

  // Always use stock-level
  const symbols = useMemo(() => {
    return NIFTY50_TICKERS;
  }, []);

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
        console.log(`Loading stock-level data for ${timeRange} period`);
        console.log(`Date range: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`);
        
        const data = await fetchMultipleStocks(
          symbols, 
          dateRange.start, 
          dateRange.end,
          (loaded, total) => setLoadingProgress({ loaded, total })
        );
        
        // Check if we have enough data (at least 2 stocks/sectors for correlation)
        if (data.length < 2) {
          console.warn(`Only ${data.length} stocks loaded. Need at least 2 for correlation analysis.`);
          setStockData([]);
          setCorrelationMatrix(null);
          setNetworkGraph(null);
          return;
        }
        
        console.log(`Building correlation matrix for ${data.length} stocks`);
        setStockData(data);
        
        // Build correlation matrix
        const matrix = buildCorrelationMatrix(data);
        console.log(`Correlation matrix built: ${matrix.symbols.length} symbols`);
        setCorrelationMatrix(matrix);
        
        // Build network graph with threshold mode
        const graph = buildNetworkGraph(matrix, threshold, sectorMap, "threshold", 3);
        console.log(`Network graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges (mode: threshold)`);
        
        // Show warning if graph is too sparse
        if (graph.metadata?.warning) {
          console.warn(graph.metadata.warning);
        }
        
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
  }, [dateRange, symbols, sectorMap, timeRange, threshold]);



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
                Network theory, correlation analysis, and betweenness centrality for market dynamics
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
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
            <Card className="p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Edge Construction: Threshold</h3>
                  <p className="text-xs text-gray-600">Correlation Threshold: {threshold.toFixed(2)}</p>
                </div>
                <div className="w-64">
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
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
                    Loading Stock-Level Network Data
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Time Range: {timeRange} ({formatDate(dateRange.start)} to {formatDate(dateRange.end)})
                  </p>
                  <p className="text-xs text-gray-500">
                    Loading {loadingProgress.loaded} of {loadingProgress.total} stocks...
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bc-step-by-step">BC Step-by-Step</TabsTrigger>
              <TabsTrigger value="shock-simulator">Shock Simulator</TabsTrigger>
              <TabsTrigger value="hybrid-forecast">Hybrid Forecast</TabsTrigger>
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
                          <span className="font-medium">Mode:</span> Stock-Level Network (NIFTY50)
                        </p>
                        <p>
                          <span className="font-medium">Time Range:</span> {timeRange} - Analyzing data from {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
                        </p>
                        <p>
                          <span className="font-medium">Data Points:</span> {stockData.length} stocks loaded with real-time historical prices
                        </p>
                        <p className="text-blue-600 font-medium mt-2">
                          ✓ Using real-time API data (not mock data)
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}


              {/* Network Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h3 className="text-xs font-semibold text-blue-900 mb-1">Network Density</h3>
                  {networkGraph?.metadata ? (
                    <div className="text-2xl font-bold text-blue-700">
                      {(networkGraph.metadata.density * 100).toFixed(1)}%
                    </div>
                  ) : networkGraph ? (
                    <div className="text-2xl font-bold text-blue-700">
                      {((2 * networkGraph.edges.length) / (networkGraph.nodes.length * (networkGraph.nodes.length - 1)) * 100).toFixed(1)}%
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Loading...</div>
                  )}
                  <p className="text-xs text-blue-600 mt-1">2E / (N×(N-1))</p>
                </Card>

                <Card className="p-4 bg-green-50 border-green-200">
                  <h3 className="text-xs font-semibold text-green-900 mb-1">Avg Correlation</h3>
                  {correlationMatrix ? (
                    <div className="text-2xl font-bold text-green-700">
                      {(
                        correlationMatrix.matrix
                          .flat()
                          .filter((v, i) => {
                            const row = Math.floor(i / correlationMatrix.symbols.length);
                            const col = i % correlationMatrix.symbols.length;
                            return row !== col;
                          })
                          .reduce((sum, val) => sum + Math.abs(val), 0) /
                        (correlationMatrix.symbols.length * (correlationMatrix.symbols.length - 1))
                      ).toFixed(3)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Loading...</div>
                  )}
                  <p className="text-xs text-green-600 mt-1">Mean absolute correlation</p>
                </Card>

                <Card className="p-4 bg-purple-50 border-purple-200">
                  <h3 className="text-xs font-semibold text-purple-900 mb-1">Avg Shortest Path</h3>
                  {networkGraph?.metadata ? (
                    <div className="text-2xl font-bold text-purple-700">
                      {networkGraph.metadata.avgShortestPath.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Loading...</div>
                  )}
                  <p className="text-xs text-purple-600 mt-1">Mean path length</p>
                </Card>

                <Card className="p-4 bg-orange-50 border-orange-200">
                  <h3 className="text-xs font-semibold text-orange-900 mb-1">Network Stats</h3>
                  {networkGraph ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-orange-700">Nodes:</span>
                        <span className="font-medium text-orange-900">{networkGraph.nodes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Edges:</span>
                        <span className="font-medium text-orange-900">{networkGraph.edges.length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Loading...</div>
                  )}
                </Card>
              </div>

              {networkGraph && (
                <>
                  <CentralityTable
                    nodes={networkGraph.nodes}
                    title="Top 10 Bridge Nodes"
                    maxRows={10}
                  />
                  <CorrelationNetworkGraph
                    graph={networkGraph}
                    loading={loading}
                    mode="stock"
                    onNodeSelect={setSelectedNodeId}
                    selectedNodeId={selectedNodeId}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="bc-step-by-step" className="space-y-4">
              <BCStepByStep
                stockData={stockData}
                correlationMatrix={correlationMatrix}
                networkGraph={networkGraph}
                sectorMap={sectorMap}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="shock-simulator" className="space-y-4">
              <ShockSimulator
                networkGraph={networkGraph}
                correlationMatrix={correlationMatrix}
                stockData={stockData}
                loading={loading}
                threshold={threshold}
                timeWindow={timeRange.toLowerCase()}
              />
            </TabsContent>

            <TabsContent value="hybrid-forecast" className="space-y-4">
              <HybridForecast stockData={stockData} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default DSFMAnalysis;

