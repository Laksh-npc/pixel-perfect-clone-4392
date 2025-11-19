import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

interface SimilarStocksProps {
  symbol: string;
  currentStockName: string;
}

const SimilarStocks = ({ symbol, currentStockName }: SimilarStocksProps) => {
  const navigate = useNavigate();
  const [similarStocks, setSimilarStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"52W" | "PE">("52W");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchSimilarStocks = async () => {
      try {
        setLoading(true);
        // Try to get similar stocks from the same industry
        const stocks = await api.getSimilarStocks(symbol, 10);
        
        // If no similar stocks found, try to get some popular stocks as fallback
        if (stocks.length === 0) {
          // Fallback: Get some popular stocks
          const popularSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK'];
          const fallbackStocks = [];
          for (const stockSymbol of popularSymbols) {
            if (stockSymbol === symbol.toUpperCase()) continue;
            try {
              const details = await api.getStockDetails(stockSymbol);
              if (details) {
                fallbackStocks.push(details);
                if (fallbackStocks.length >= 4) break;
              }
            } catch (e) {
              continue;
            }
          }
          setSimilarStocks(fallbackStocks);
        } else {
          setSimilarStocks(stocks);
        }
      } catch (error) {
        console.error("Error fetching similar stocks:", error);
        // Try fallback on error too
        try {
          const popularSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
          const fallbackStocks = [];
          for (const stockSymbol of popularSymbols) {
            if (stockSymbol === symbol.toUpperCase()) continue;
            try {
              const details = await api.getStockDetails(stockSymbol);
              if (details) {
                fallbackStocks.push(details);
                if (fallbackStocks.length >= 4) break;
              }
            } catch (e) {
              continue;
            }
          }
          setSimilarStocks(fallbackStocks);
        } catch (fallbackError) {
          setSimilarStocks([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarStocks();
  }, [symbol]);

  const handleSort = (newSortBy: "52W" | "PE") => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("asc");
    }
  };

  const sortedStocks = [...similarStocks].sort((a, b) => {
    if (sortBy === "52W") {
      const aHigh = a?.priceInfo?.weekHighLow?.max || 0;
      const bHigh = b?.priceInfo?.weekHighLow?.max || 0;
      return sortDirection === "asc" ? aHigh - bHigh : bHigh - aHigh;
    } else {
      const aPE = a?.metadata?.pdSymbolPe || 0;
      const bPE = b?.metadata?.pdSymbolPe || 0;
      return sortDirection === "asc" ? aPE - bPE : bPE - aPE;
    }
  });

  const get52WeekPosition = (stock: any) => {
    const high = stock?.priceInfo?.weekHighLow?.max || 0;
    const low = stock?.priceInfo?.weekHighLow?.min || 0;
    const current = stock?.priceInfo?.lastPrice || 0;
    if (high === low) return 50;
    return ((current - low) / (high - low)) * 100;
  };

  const getCompanyLogo = (name: string) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length >= 2) {
      return words[0].charAt(0) + words[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Similar Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (similarStocks.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">Similar Stocks</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 font-medium">COMPANY</th>
                <th className="text-left py-2 px-4 font-medium">
                  <button
                    onClick={() => handleSort("52W")}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    52 WEEK
                    {sortBy === "52W" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-2 px-4 font-medium">MARKET PRICE</th>
                <th className="text-left py-2 px-4 font-medium">
                  <button
                    onClick={() => handleSort("PE")}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    P/E RATIO
                    {sortBy === "PE" && (
                      sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-2 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.slice(0, 4).map((stock, index) => {
                const priceInfo = stock?.priceInfo || {};
                const info = stock?.info || {};
                const metadata = stock?.metadata || {};
                const currentPrice = Number(priceInfo.lastPrice) || 0;
                const change = Number(priceInfo.change) || 0;
                const percentChange = Number(priceInfo.pChange) || 0;
                const isPositive = change >= 0;
                const peRatio = Number(metadata.pdSymbolPe) || 0;
                const week52Position = get52WeekPosition(stock);
                const stockSymbol = info.symbol || stock.symbol || '';

                return (
                  <tr
                    key={index}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => stockSymbol && navigate(`/stock/${stockSymbol}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-bold">
                          {getCompanyLogo(info.companyName || stock.symbol)}
                        </div>
                        <span className="font-medium text-sm">{info.companyName || stock.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative w-24 h-2 bg-muted rounded-full">
                        <div
                          className="absolute h-2 bg-primary rounded-full"
                          style={{ width: `${week52Position}%` }}
                        />
                        <div
                          className={`absolute w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent ${
                            isPositive ? "border-t-green-600" : "border-t-red-600"
                          }`}
                          style={{ left: `calc(${week52Position}% - 4px)`, top: "-8px" }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">₹{currentPrice.toFixed(2)}</div>
                        <div className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}
                          {percentChange.toFixed(2)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{peRatio > 0 ? peRatio.toFixed(2) : 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle bookmark
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedStocks.length > 4 && (
            <div className="mt-4 text-center">
              <Button variant="link" className="text-primary">
                See More
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimilarStocks;

