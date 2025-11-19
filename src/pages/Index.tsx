import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MarketTicker from "@/components/MarketTicker";
import StockCard from "@/components/StockCard";
import InvestmentSummary from "@/components/InvestmentSummary";
import ProductsTools from "@/components/ProductsTools";
import TradingScreens from "@/components/TradingScreens";
import SectorsTrending from "@/components/SectorsTrending";
import NewsSection from "@/components/NewsSection";
import Footer from "@/components/Footer";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

// Define the symbols for most bought stocks
const MOST_BOUGHT_SYMBOLS = ["IDEA", "TATAGOLD", "NEWGEN", "RELIANCE"];

interface StockCardData {
  logo: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  percent: string;
  positive: boolean;
  showBookmark?: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [mostBoughtStocks, setMostBoughtStocks] = useState<StockCardData[]>([]);
  const [loadingMostBought, setLoadingMostBought] = useState(true);

  // Helper function to generate logo from company name
  const getLogo = (name: string): string => {
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "");
  };

  // Fetch most bought stocks from API
  useEffect(() => {
    let isMounted = true;
    const fetchMostBoughtStocks = async () => {
      try {
        setLoadingMostBought(true);
        // Fetch stock details for all symbols in parallel
        const stockPromises = MOST_BOUGHT_SYMBOLS.map(symbol => 
          api.getStockDetails(symbol).catch((error: any) => {
            // Only log if it's not a network/backend error (expected when backend is down)
            if (error?.message && !error.message.includes('getaddrinfo') && !error.message.includes('ENOTFOUND')) {
              console.warn(`Failed to fetch details for ${symbol}:`, error.message);
            }
            return null;
          })
        );
        const stockDetails = await Promise.all(stockPromises);
        
        // Filter out error responses
        const validStockDetails = stockDetails.map((stock, index) => {
          if (stock && stock.error) {
            // Suppress expected backend errors
            const errorMsg = stock.message || stock.error || '';
            if (!errorMsg.includes('getaddrinfo') && !errorMsg.includes('ENOTFOUND')) {
              console.warn(`API error for ${MOST_BOUGHT_SYMBOLS[index]}:`, errorMsg);
            }
            return null;
          }
          return stock;
        });
        
        if (!isMounted) return;

        const stocksData: (StockCardData | null)[] = validStockDetails
          .map((stock, index) => {
            // Skip if stock is null, has error, or invalid data
            if (!stock || stock.error || !stock.info) {
              return null;
            }

            const priceInfo = stock.priceInfo || {};
            const lastPrice = priceInfo.lastPrice || 0;
            const change = priceInfo.change || 0;
            const pChange = priceInfo.pChange || 0;
            const positive = change >= 0;
            const symbol = stock.info?.symbol || MOST_BOUGHT_SYMBOLS[index];
            const companyName = stock.info?.companyName || symbol;

            // Skip if no valid company name or price is 0
            if (!companyName || companyName === "Unknown" || lastPrice === 0) {
              return null;
            }
          
            // Format price with Indian currency
            const formattedPrice = `₹${lastPrice.toLocaleString("en-IN", { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}`;
            
            // Format change
            const formattedChange = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
            const formattedPercent = `(${pChange >= 0 ? "+" : ""}${pChange.toFixed(2)}%)`;
            
            // Truncate long company names
            let displayName = companyName;
            if (companyName.length > 25) {
              displayName = companyName.substring(0, 22) + "...";
            }

            return {
              logo: getLogo(companyName),
              name: displayName,
              symbol: symbol,
              price: formattedPrice,
              change: formattedChange,
              percent: formattedPercent,
              positive,
              showBookmark: index === 2, // Show bookmark on third stock
            };
          });

        const stocks: StockCardData[] = stocksData.filter((stock): stock is StockCardData => stock !== null);

        setMostBoughtStocks(stocks);
      } catch (error: any) {
        // Only log unexpected errors (not network/backend connection issues)
        const errorMsg = error?.message || String(error || '');
        if (!errorMsg.includes('getaddrinfo') && !errorMsg.includes('ENOTFOUND') && !errorMsg.includes('Network error') && !errorMsg.includes('API 400') && !errorMsg.includes('API 500')) {
          console.error("Error fetching most bought stocks:", error);
        }
        // Fallback to static data on error (only if we have no stocks)
        if (isMounted) {
          setMostBoughtStocks([
            { logo: "Vi", name: "Vodafone Idea", symbol: "IDEA", price: "₹9.44", change: "-0.53", percent: "(5.32%)", positive: false },
            { logo: "TG", name: "TATAGOLD", symbol: "TATAGOLD", price: "₹11.37", change: "-0.40", percent: "(3.40%)", positive: false },
            { logo: "NS", name: "Newgen Software Tech", symbol: "NEWGEN", price: "₹996.55", change: "100.30", percent: "(11.19%)", positive: true },
          ]);
        }
      } finally {
        if (isMounted) {
          setLoadingMostBought(false);
        }
      }
    };

    fetchMostBoughtStocks();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const mtfStocks = [
    { logo: "MD", name: "Mazagon Dock Ship", symbol: "MAZAGONDOCK", price: "₹4,206.80", change: "309.80", percent: "(7.95%)", positive: true },
    { logo: "BSE", name: "BSE", symbol: "BSE", price: "₹200.35", change: "4.46", percent: "(2.28%)", positive: true },
    { logo: "SS", name: "Sai Silks (Kalaman)", symbol: "SAISILK", price: "₹3,135.20", change: "469.80", percent: "(17.63%)", positive: true },
    { logo: "NS", name: "Newgen Software Tech", symbol: "NEWGEN", price: "₹251.97", change: "-20.06", percent: "(7.37%)", positive: false },
  ];

  const intradayScreenerStocks = [
    { logo: "N", name: "Netweb Technologies", symbol: "NETWEB", price: "₹4,206.80", change: "309.80", percent: "(7.95%)", positive: true },
    { logo: "SS", name: "Sai Silks (Kalaman)", symbol: "SAISILK", price: "₹200.35", change: "4.46", percent: "(2.28%)", positive: true },
    { logo: "T", name: "Cartrade Tech", symbol: "CARTECH", price: "₹3,135.20", change: "469.80", percent: "(17.63%)", positive: true },
    { logo: "E", name: "EPack Prefab Techno.", symbol: "EPACK", price: "₹251.97", change: "-20.06", percent: "(7.37%)", positive: false },
  ];

  const etfs = [
    { logo: "G", name: "Groww Nifty Midcap 15...", status: "NFO", statusColor: "text-muted-foreground", badge: "Open now", badgeColor: "text-success" },
    { logo: "G", name: "Groww Gold ETF", price: "₹113.99", change: "-4.57", percent: "(3.85%)", positive: false },
    { logo: "G", name: "Groww Silver ETF", price: "₹136.80", change: "-6.23", percent: "(4.36%)", positive: false },
    { logo: "G", name: "Groww Nifty Smallcap 2...", status: "NFO", statusColor: "text-muted-foreground", badge: "Closed" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MarketTicker />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Most bought stocks on Groww</h2>
              {loadingMostBought ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mostBoughtStocks.map((stock, index) => (
                      <StockCard key={stock.symbol || index} {...stock} />
                    ))}
                  </div>
                  <button 
                    className="text-sm text-primary font-medium mt-4 hover:underline"
                    onClick={() => navigate("/most-bought-stocks")}
                  >
                    See more →
                  </button>
                </>
              )}
            </section>

            {/* Top market movers temporarily removed for demo */}

            <section>
              <h2 className="text-xl font-semibold mb-4">Most traded stocks in MTF</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mtfStocks.map((stock, index) => (
                  <StockCard key={index} {...stock} />
                ))}
              </div>
            </section>

            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {intradayScreenerStocks.map((stock, index) => (
                  <StockCard key={index} {...stock} />
                ))}
              </div>
              <button className="text-sm text-primary font-medium hover:underline">
                Intraday screener →
              </button>
            </section>

            <SectorsTrending />

            <section>
              <h2 className="text-xl font-semibold mb-4">ETFs by Groww</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {etfs.map((etf, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {etf.logo}
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-2">{etf.name}</div>
                    {etf.price ? (
                      <>
                        <div className="text-lg font-semibold mb-1">{etf.price}</div>
                        <div className={`text-sm ${etf.positive ? 'text-success' : 'text-destructive'}`}>
                          {etf.change} {etf.percent}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`text-sm mb-1 ${etf.statusColor}`}>{etf.status}</div>
                        <div className={`text-sm ${etf.badgeColor}`}>{etf.badge}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button className="text-sm text-primary font-medium mt-4 hover:underline">
                See all ETFs →
              </button>
            </section>

            <NewsSection />
          </div>

          <div className="space-y-6">
            <InvestmentSummary />
            <ProductsTools />
            <TradingScreens />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
