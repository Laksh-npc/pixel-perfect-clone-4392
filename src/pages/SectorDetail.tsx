import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { RefreshCw, ChevronDown, ArrowUpDown, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BuyDialog from "@/components/BuyDialog";
import SellDialog from "@/components/SellDialog";
import sectorMapping from "@/lib/sector_mapping.json";

// Generate mini line graph data points
const generateLineGraph = (changePct: number, isPositive: boolean) => {
  const points = 15;
  const data = [];
  const magnitude = Math.min(Math.abs(changePct) / 5, 1);
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 100;
    const progress = i / (points - 1);
    const baseY = 20;
    const variation = Math.sin(progress * Math.PI) * 2;
    const trend = isPositive 
      ? baseY - (progress * 10 * magnitude) - variation
      : baseY + (progress * 10 * magnitude) + variation;
    data.push({ x, y: Math.max(3, Math.min(27, trend)) });
  }
  return data;
};

// Helper to generate logo from company name
const getLogo = (name: string, symbol: string): string => {
  const words = name.split(" ");
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  if (symbol && symbol.length >= 2) {
    return symbol.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "");
  }
  return name.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "");
};

// Get sector display name
const getSectorDisplayName = (indexName: string): string => {
  const mapping = sectorMapping as Record<string, string>;
  return mapping[indexName] || indexName.replace("NIFTY ", "").replace(".NS", "");
};

interface StockRow {
  symbol: string;
  name: string;
  logo: string;
  price: number;
  priceFormatted: string;
  change: number;
  changeFormatted: string;
  percent: number;
  percentFormatted: string;
  positive: boolean;
  volume: number;
  volumeFormatted: string;
  volumeDiff?: number;
  volumeDiffFormatted?: string;
  week52High?: number;
  week52Low?: number;
  currentPrice?: number;
}

const SectorDetail = () => {
  const { sectorName } = useParams<{ sectorName: string }>();
  const navigate = useNavigate();
  const [sectorDisplayName, setSectorDisplayName] = useState("");
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockRow | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    if (sectorName) {
      setSectorDisplayName(getSectorDisplayName(decodeURIComponent(sectorName)));
    }
  }, [sectorName]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!sectorName) return;
        
        const decodedSector = decodeURIComponent(sectorName);
        const mapping = sectorMapping as Record<string, string>;
        
        // Find all stocks in this sector
        const sectorStocks: string[] = [];
        Object.entries(mapping).forEach(([symbol, sector]) => {
          if (sector === getSectorDisplayName(decodedSector) || 
              symbol.includes(decodedSector.split(" ")[0])) {
            sectorStocks.push(symbol.replace(".NS", ""));
          }
        });
        
        // Also try to get stocks from the index if it's a NIFTY index
        if (decodedSector.includes("NIFTY")) {
          const indexSymbol = decodedSector.replace(" ", "");
          // Fetch stocks from the index
          const allSymbols = Object.keys(mapping)
            .filter(s => s.includes(indexSymbol.split(" ")[0]) || mapping[s] === getSectorDisplayName(decodedSector))
            .map(s => s.replace(".NS", ""))
            .slice(0, 30);
          
          if (allSymbols.length > 0) {
            const chunkSize = 20;
            const chunks: string[][] = [];
            for (let i = 0; i < allSymbols.length; i += chunkSize) {
              chunks.push(allSymbols.slice(i, i + chunkSize));
            }
            
            const responses = await Promise.all(
              chunks.map(c => api.getEquitiesBySymbols(c).catch(() => []))
            );
            const equities = responses.flat().filter(e => e && e.symbol);
            
            const rows = equities
              .filter((e: any) => {
                const last = Number(e.details?.price?.last || 0);
                return last > 0;
              })
              .map((e: any) => {
                const symbol = e.symbol;
                const name = e.details?.info?.companyName || symbol;
                const last = Number(e.details?.price?.last || 0);
                const prev = Number(e.details?.price?.previousClose || last);
                const volume = Number(e.details?.price?.tradedQuantity || 0);
                const changeAbs = last - prev;
                const changePct = prev ? (changeAbs / prev) * 100 : 0;
                const positive = changeAbs >= 0;
                
                // Calculate 52W high/low (simplified - using current and previous)
                const week52High = last * 1.2; // Estimate
                const week52Low = last * 0.8; // Estimate
                const week52Position = ((last - week52Low) / (week52High - week52Low)) * 100;
                
                return {
                  symbol,
                  name: String(name),
                  logo: getLogo(String(name), symbol),
                  price: last,
                  priceFormatted: `₹${last.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  change: changeAbs,
                  changeFormatted: `${Math.abs(changeAbs).toFixed(2)}`,
                  percent: changePct,
                  percentFormatted: `(${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`,
                  positive,
                  volume,
                  volumeFormatted: volume ? volume.toLocaleString("en-IN") : "0",
                  volumeDiff: Math.random() * 200 - 100, // Placeholder
                  volumeDiffFormatted: `${Math.random() > 0.5 ? "+" : ""}${(Math.random() * 200).toFixed(2)}%`,
                  week52High,
                  week52Low,
                  currentPrice: last,
                  week52Position: Math.max(0, Math.min(100, week52Position)),
                };
              });
            
            // Apply filters
            let filteredRows = rows;
            if (activeFilter === "price-change") {
              filteredRows = rows.filter(r => Math.abs(r.percent) > 1);
            }
            
            // Sort by price change
            filteredRows.sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));
            
            if (isMounted) setStocks(filteredRows);
          }
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load stocks");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [sectorName, activeFilter]);

  const handleBuyClick = (stock: StockRow) => {
    setSelectedStock(stock);
    setBuyDialogOpen(true);
  };

  const handleSellClick = (stock: StockRow) => {
    setSelectedStock(stock);
    setSellDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{sectorDisplayName}</h1>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-full border text-sm",
              activeFilter === "filter" ? "border-border bg-background" : "border-border/50"
            )}
          >
            <span className="relative">
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              Filter
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFilter(activeFilter === "price-change" ? null : "price-change")}
            className={cn(
              "h-8 px-3 rounded-full border text-sm flex items-center gap-1",
              activeFilter === "price-change" ? "border-border bg-background" : "border-border/50"
            )}
          >
            Price change &gt;1%
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full border border-border/50 text-sm flex items-center gap-1"
          >
            52W Performance
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full border border-border/50 text-sm flex items-center gap-1"
          >
            RSI
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full border border-border/50 text-sm flex items-center gap-1"
          >
            MACD
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full border border-border/50 text-sm flex items-center gap-1"
          >
            <span className="relative">
              Sector
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </span>
            <ChevronDown className="w-3 h-3" />
          </Button>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-sm text-muted-foreground"
              onClick={() => setActiveFilter(null)}
            >
              Clear all
            </Button>
          </div>
        </div>

        {/* Stock Table */}
        <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 pt-4 px-4 text-left text-sm font-medium text-muted-foreground">Company</th>
                  <th className="pb-3 pt-4 px-4 text-left text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      Market price
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="pb-3 pt-4 px-4 text-left text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      1D price change
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="pb-3 pt-4 px-4 text-left text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      Volume
                      <ArrowUpDown className="w-3 h-3 rotate-180" />
                    </div>
                  </th>
                  <th className="pb-3 pt-4 px-4 text-left text-sm font-medium text-muted-foreground">1W avg vol diff</th>
                  <th className="pb-3 pt-4 px-4 text-left text-sm font-medium text-muted-foreground">52W performance</th>
                  <th className="pb-3 pt-4 px-4 text-left text-sm font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton className="h-7 w-20" />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
                {!loading && !error && stocks.map((stock) => {
                  const lineData = generateLineGraph(stock.percent, stock.positive);
                  return (
                    <tr 
                      key={stock.symbol} 
                      className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br from-primary/80 to-primary flex-shrink-0">
                            {stock.logo}
                          </div>
                          <span className="font-medium text-sm">{stock.name}</span>
                          {/* Mini Line Graph */}
                          <div className="w-16 h-6 flex-shrink-0 ml-auto">
                            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
                              <polyline
                                points={lineData.map(d => `${d.x},${30 - d.y}`).join(" ")}
                                fill="none"
                                stroke={stock.positive ? "#10b981" : "#ef4444"}
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sm">{stock.priceFormatted}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`text-sm font-medium ${stock.positive ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? "+" : ""}{stock.changeFormatted} {stock.percentFormatted}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{stock.volumeFormatted}</td>
                      <td className="py-3 px-4">
                        <div className={`text-sm ${(stock.volumeDiff || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.volumeDiffFormatted || "0%"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">L</span>
                          <div className="flex-1 h-1 bg-muted rounded-full relative max-w-[100px]">
                            <div 
                              className="absolute top-0 left-0 h-full w-1 bg-black rounded-full"
                              style={{ left: `${stock.week52Position || 50}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">H</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            onClick={() => handleBuyClick(stock)}
                            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                          >
                            B
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSellClick(stock)}
                            className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            S
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Bookmark className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && error && (
                  <tr>
                    <td className="py-4 text-destructive text-sm px-4" colSpan={7}>{error}</td>
                  </tr>
                )}
                {!loading && !error && stocks.length === 0 && (
                  <tr>
                    <td className="py-8 text-center text-muted-foreground text-sm px-4" colSpan={7}>
                      No stocks found in this sector
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />

      {/* Buy/Sell Dialogs */}
      {selectedStock && (
        <>
          <BuyDialog
            open={buyDialogOpen}
            onOpenChange={setBuyDialogOpen}
            symbol={selectedStock.symbol}
            companyName={selectedStock.name}
            currentPrice={selectedStock.price}
          />
          <SellDialog
            open={sellDialogOpen}
            onOpenChange={setSellDialogOpen}
            symbol={selectedStock.symbol}
            companyName={selectedStock.name}
            currentPrice={selectedStock.price}
          />
        </>
      )}
    </div>
  );
};

export default SectorDetail;

