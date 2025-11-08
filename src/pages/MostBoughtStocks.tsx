import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TradingWidget from "@/components/TradingWidget";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

// Popular stock symbols to fetch - we'll calculate "most bought" from their trading data
// In a real implementation, you might fetch a larger list or use an API endpoint that provides most active stocks
const POPULAR_STOCK_SYMBOLS = [
  "RPOWER",      // Reliance Power
  "PFC",         // Power Finance Corporation
  "EPACK",       // EPack Prefab Technologies
  "ADANIPOWER",  // Adani Power
  "IDEA",        // Vodafone Idea
  "NETWEB",      // Netweb Technologies India
  "BSE",         // BSE
  "REDINGTON",   // Redington
  "SUZLON",      // Suzlon Energy
  "RELIANCE",    // Reliance Industries
  "TCS",         // Tata Consultancy Services
  "HDFCBANK",    // HDFC Bank
  "INFY",        // Infosys
  "ICICIBANK",   // ICICI Bank
  "SBIN",        // State Bank of India
  "BHARTIARTL",  // Bharti Airtel
  "ITC",         // ITC Limited
  "LT",          // Larsen & Toubro
  "AXISBANK",    // Axis Bank
  "HINDUNILVR",  // Hindustan Unilever
];

interface StockData {
  symbol: string;
  companyName: string;
  logo: string;
  price: number;
  change: number;
  percentChange: number;
  volume: number;
  priceInfo?: any;
  tradeInfo?: any;
  historicalData?: any[];
}

const MostBoughtStocks = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const selectedSymbolRef = useRef<string | null>(null);

  // Helper function to generate logo from company name
  const getLogo = (name: string): string => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "");
  };

  // Generate a simple line graph data points (mock data for now)
  const generateLineGraph = (change: number, isPositive: boolean) => {
    const points = 20;
    const data = [];
    for (let i = 0; i < points; i++) {
      const x = (i / (points - 1)) * 100;
      // Create a simple trend line
      const y = isPositive 
        ? 15 + (i / points) * 15 + Math.random() * 5
        : 30 - (i / points) * 15 - Math.random() * 5;
      data.push({ x, y });
    }
    return data;
  };

  // Fetch stocks data
  useEffect(() => {
    let isMounted = true;
    let refreshInterval: NodeJS.Timeout | null = null;
    
    const fetchStocks = async () => {
      try {
        setLoading(true);
        // Fetch stock details and trade info for all symbols in parallel
        const stockPromises = POPULAR_STOCK_SYMBOLS.map(async (symbol) => {
          try {
            const [details, tradeInfo] = await Promise.all([
              api.getStockDetails(symbol).catch((error) => {
                console.warn(`Failed to fetch details for ${symbol}:`, error);
                return null;
              }),
              api.getStockTradeInfo(symbol).catch((error) => {
                console.warn(`Failed to fetch trade info for ${symbol}:`, error);
                return null;
              }),
            ]);
            // Check if details has an error property (API error response)
            if (details && details.error) {
              console.warn(`API error for ${symbol}:`, details.message || details.error);
              return { details: null, tradeInfo: null };
            }
            return { details, tradeInfo };
          } catch (error) {
            console.warn(`Error fetching data for ${symbol}:`, error);
            return { details: null, tradeInfo: null };
          }
        });
        const stockData = await Promise.all(stockPromises);

        if (!isMounted) return;

        const stocksData: (StockData | null)[] = stockData
          .map(({ details, tradeInfo: tradeInfoData }, index) => {
            // Skip if details is null, undefined, or has an error
            if (!details || details.error || !details.info) {
              return null;
            }

            const priceInfo = details.priceInfo || {};
            const symbol = details.info?.symbol || POPULAR_STOCK_SYMBOLS[index];
            
            // Skip if we don't have a valid symbol
            if (!symbol) {
              return null;
            }

            let companyName = details.info?.companyName || symbol;
            
            // Shorten long company names to match Groww's display
            if (companyName.includes("Limited")) {
              companyName = companyName.replace(" Limited", "");
            }
            if (companyName.includes("Ltd")) {
              companyName = companyName.replace(" Ltd", "");
            }
            if (companyName.includes("Ltd.")) {
              companyName = companyName.replace(" Ltd.", "");
            }
            
            // Skip if companyName is still "Unknown" or empty
            if (!companyName || companyName === "Unknown") {
              return null;
            }

            // Use lastPrice for current price, but fallback to close if lastPrice is not available
            // The API provides: lastPrice (current), close (day's close), previousClose (previous day)
            const price = priceInfo.lastPrice || priceInfo.close || 0;
            // Ensure change is calculated correctly (API already provides this, but verify)
            const change = priceInfo.change !== undefined ? priceInfo.change : (price - (priceInfo.previousClose || price));
            // Use the API's calculated percentage change, which is more accurate
            const percentChange = priceInfo.pChange !== undefined ? priceInfo.pChange : ((change / (priceInfo.previousClose || price)) * 100);
            
            // Get volume data - prefer delivery quantity as it indicates actual buying
            const totalVolume = tradeInfoData?.totalTradedVolume || priceInfo.tradedQuantity || 0;
            const deliveryVolume = tradeInfoData?.securityWiseDP?.deliveryQuantity || 0;
            const deliveryToTradedRatio = tradeInfoData?.securityWiseDP?.deliveryToTradedQuantity || 0;
            
            // Calculate "most bought" score:
            // 1. Higher delivery volume = more actual buying (not just intraday trading)
            // 2. Higher delivery-to-traded ratio = more delivery vs intraday
            // 3. Higher total volume = more activity
            // We'll use delivery volume as primary metric since it represents actual stock purchases
            const mostBoughtScore = deliveryVolume * (1 + deliveryToTradedRatio / 100);

            // Skip if price is 0 (invalid data)
            if (price === 0) {
              return null;
            }

            return {
              symbol,
              companyName,
              logo: getLogo(companyName),
              price,
              change,
              percentChange,
              volume: totalVolume, // Display total volume
              priceInfo,
              tradeInfo: tradeInfoData,
              // Store additional data for sorting (not in interface, but used for calculation)
              _deliveryVolume: deliveryVolume,
              _mostBoughtScore: mostBoughtScore,
            } as StockData & { _deliveryVolume?: number; _mostBoughtScore?: number };
          });

        const validStocks = stocksData.filter((stock): stock is StockData & { _deliveryVolume?: number; _mostBoughtScore?: number } => stock !== null);
        
        // Sort by "most bought" score (delivery volume) - highest first
        validStocks.sort((a, b) => {
          const scoreA = a._mostBoughtScore || 0;
          const scoreB = b._mostBoughtScore || 0;
          return scoreB - scoreA; // Descending order
        });
        
        // Take top 15 stocks (most bought)
        const topMostBoughtStocks = validStocks.slice(0, 15);
        
        // Remove the temporary properties before setting state
        const stocksToDisplay: StockData[] = topMostBoughtStocks.map(({ _deliveryVolume, _mostBoughtScore, ...stock }) => stock);

        setStocks(stocksToDisplay);
        // Update selected stock with fresh data, or select first stock if none selected
        if (stocksToDisplay.length > 0) {
          if (selectedSymbolRef.current) {
            // Update the selected stock with fresh data
            const updatedSelected = stocksToDisplay.find(s => s.symbol === selectedSymbolRef.current);
            if (updatedSelected) {
              setSelectedStock(updatedSelected);
            } else {
              // Selected stock no longer in list, select first one
              setSelectedStock(stocksToDisplay[0]);
              selectedSymbolRef.current = stocksToDisplay[0].symbol;
            }
          } else {
            // Initial load - select first stock
            setSelectedStock(stocksToDisplay[0]);
            selectedSymbolRef.current = stocksToDisplay[0].symbol;
          }
        }
      } catch (error) {
        console.error("Error fetching stocks:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchStocks();
    
    // Refresh data every 30 seconds to keep prices updated
    // Note: In production, you might want to use WebSocket for real-time updates
    refreshInterval = setInterval(() => {
      if (isMounted) {
        fetchStocks();
      }
    }, 30000); // 30 seconds

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []); // Empty dependency array - only run on mount

  const handleStockClick = (stock: StockData) => {
    setSelectedStock(stock);
    selectedSymbolRef.current = stock.symbol;
  };

  const formatVolume = (volume: number): string => {
    // Format volume using Indian numbering system (lakhs/crores)
    if (volume >= 10000000) {
      // Crores
      const crores = volume / 10000000;
      return `${crores.toFixed(2)}Cr`;
    } else if (volume >= 100000) {
      // Lakhs
      const lakhs = volume / 100000;
      return `${lakhs.toFixed(2)}L`;
    } else if (volume >= 1000) {
      // Thousands
      const thousands = volume / 1000;
      return `${thousands.toFixed(2)}K`;
    }
    // For smaller numbers, use Indian numbering with commas
    return volume.toLocaleString("en-IN");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Most Bought Stocks List */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-semibold mb-6">Most bought stocks on Groww</h1>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                  <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b font-semibold text-sm text-muted-foreground">
                    <div className="col-span-5">Company</div>
                    <div className="col-span-4">Market Price(1D)</div>
                    <div className="col-span-3">Volume</div>
                  </div>

                  {/* Stock Rows */}
                  <div>
                    {stocks.map((stock) => {
                      const isPositive = stock.change >= 0;
                      const lineData = generateLineGraph(stock.change, isPositive);
                      const isSelected = selectedStock?.symbol === stock.symbol;

                      return (
                        <div
                          key={stock.symbol}
                          className={`grid grid-cols-12 gap-4 p-4 cursor-pointer transition-colors border-b last:border-b-0 ${
                            isSelected 
                              ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500" 
                              : "hover:bg-muted/30"
                          }`}
                          onClick={() => handleStockClick(stock)}
                        >
                          {/* Company Column */}
                          <div className="col-span-5 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm text-white ${
                              stock.symbol === "RPOWER" ? "bg-blue-600" :
                              stock.symbol === "PFC" ? "bg-blue-500" :
                              stock.symbol === "EPACK" ? "bg-yellow-500" :
                              stock.symbol === "ADANIPOWER" ? "bg-gray-700" :
                              stock.symbol === "IDEA" ? "bg-red-600" :
                              stock.symbol === "NETWEB" ? "bg-blue-400" :
                              stock.symbol === "BSE" ? "bg-blue-600" :
                              stock.symbol === "REDINGTON" ? "bg-green-600" :
                              stock.symbol === "SUZLON" ? "bg-blue-700" :
                              "bg-secondary"
                            }`}>
                              {stock.logo}
                            </div>
                            <span className="font-medium text-sm text-foreground">{stock.companyName}</span>
                          </div>

                          {/* Market Price Column */}
                          <div className="col-span-4 flex items-center gap-3">
                            {/* Mini Line Graph */}
                            <div className="w-20 h-8 flex-shrink-0 relative">
                              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id={`gradient-${stock.symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
                                    <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <polyline
                                  points={`0,30 ${lineData.map(d => `${d.x},${30 - d.y}`).join(" ")} 100,30`}
                                  fill="url(#gradient-${stock.symbol})"
                                  stroke="none"
                                />
                                <polyline
                                  points={lineData.map(d => `${d.x},${30 - d.y}`).join(" ")}
                                  fill="none"
                                  stroke={isPositive ? "#10b981" : "#ef4444"}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            
                            {/* Price and Change */}
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-foreground">
                                ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div
                                className={`text-xs font-medium ${
                                  isPositive ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {stock.change >= 0 ? "+" : ""}
                                {stock.change.toFixed(2)} (
                                {stock.percentChange >= 0 ? "+" : ""}
                                {stock.percentChange.toFixed(2)}%)
                              </div>
                            </div>
                          </div>

                          {/* Volume Column */}
                          <div className="col-span-3 flex items-center text-sm text-muted-foreground">
                            {formatVolume(stock.volume)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* See more button */}
                <button className="text-sm text-primary font-medium mt-4 hover:underline">
                  See more →
                </button>
              </>
            )}
          </div>

          {/* Right Panel - Trading Widget */}
          <div className="space-y-6">
            {selectedStock ? (
              <TradingWidget
                symbol={selectedStock.symbol}
                companyName={selectedStock.companyName}
                priceInfo={selectedStock.priceInfo}
                tradeInfo={selectedStock.tradeInfo}
              />
            ) : (
              <Skeleton className="h-96 w-full" />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MostBoughtStocks;

