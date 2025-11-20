import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIVERSE_TO_SYMBOLS } from "@/lib/universes";
import { cn } from "@/lib/utils";
import { getIconText, getIconClasses } from "@/lib/iconUtils";

type TabKey = "GAINERS" | "LOSERS" | "VOLUME";

// Generate mini line graph data points - smoother curve matching Groww
const generateLineGraph = (changePct: number, isPositive: boolean) => {
  const points = 15;
  const data = [];
  const magnitude = Math.min(Math.abs(changePct) / 5, 1); // Scale based on change %
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 100;
    // Create smoother trend line
    const progress = i / (points - 1);
    const baseY = 20;
    const variation = Math.sin(progress * Math.PI) * 2; // Subtle wave
    const trend = isPositive 
      ? baseY - (progress * 10 * magnitude) - variation
      : baseY + (progress * 10 * magnitude) + variation;
    data.push({ x, y: Math.max(3, Math.min(27, trend)) });
  }
  return data;
};

const MarketMovers = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("GAINERS");
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [volumeShockers, setVolumeShockers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [universe, setUniverse] = useState<string>("NIFTY 50");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const symbols = UNIVERSE_TO_SYMBOLS[universe as keyof typeof UNIVERSE_TO_SYMBOLS] || [];
        
        // If no symbols from universe, still proceed to use fallback from API helper
        const chunkSize = 80;
        const chunks: string[][] = [];
        if (symbols.length > 0) {
          for (let i = 0; i < symbols.length; i += chunkSize) {
            chunks.push(symbols.slice(i, i + chunkSize));
          }
        } else {
          // Empty chunk to trigger fallback
          chunks.push([]);
        }
        
        const responses = await Promise.all(
          chunks.map(c => api.getEquitiesBySymbols(c.length > 0 ? c : []).catch(() => []))
        );
        const equities = responses.flat().filter(e => e && e.symbol);
        const rows = toRows(equities);
        
        // Filter out rows with invalid data
        const validRows = rows.filter(r => r.symbol && r.name && r.last > 0);
        
        // Always show 6-7 stocks
        const g = [...validRows]
          .sort((a, b) => b.changePct - a.changePct)
          .slice(0, 7);
        const l = [...validRows]
          .sort((a, b) => a.changePct - b.changePct)
          .slice(0, 7);
        const v = [...validRows]
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 7);
        
        if (active) {
          setGainers(g.map(mapRowToStock));
          setLosers(l.map(mapRowToStock));
          setVolumeShockers(v.map(mapRowToStock));
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load movers");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [universe]);

  const stocks = useMemo(() => {
    if (tab === "GAINERS") return gainers;
    if (tab === "LOSERS") return losers;
    return volumeShockers;
  }, [tab, gainers, losers, volumeShockers]);

  function toRows(equities: any[]) {
    return equities
      .filter((e) => {
        // Filter out invalid entries
        const last = Number(e.details?.price?.last || 0);
        const symbol = e.symbol;
        return last > 0 && symbol;
      })
      .map((e) => {
        const symbol = e.symbol;
        const name = e.details?.info?.companyName || symbol;
        const last = Number(e.details?.price?.last || 0);
        const prev = Number(e.details?.price?.previousClose || last);
        const volume = Number(e.details?.price?.tradedQuantity || 0);
        const changeAbs = last - prev;
        const changePct = prev ? (changeAbs / prev) * 100 : 0;
        return { symbol, name, last, prev, volume, changeAbs, changePct };
      });
  }

  function mapRowToStock(row: any) {
    const positive = row.changeAbs >= 0;
    const iconText = getIconText(String(row.name), row.symbol);
    const iconClasses = getIconClasses(String(row.name), row.symbol);
    return {
      symbol: row.symbol,
      name: String(row.name),
      logo: iconText,
      iconClasses,
      price: row.last,
      priceFormatted: `₹${row.last.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: row.changeAbs,
      changeFormatted: `${Math.abs(row.changeAbs).toFixed(2)}`,
      percent: row.changePct,
      percentFormatted: `(${row.changePct >= 0 ? "+" : ""}${row.changePct.toFixed(2)}%)`,
      positive,
      volume: row.volume,
      volumeFormatted: row.volume ? row.volume.toLocaleString("en-IN") : "0",
    };
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="px-5 pt-5 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top market movers</h2>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("GAINERS")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
                tab === "GAINERS"
                  ? "bg-white border-gray-300 shadow-sm text-gray-900"
                  : "bg-transparent border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              Gainers
            </button>
            <button
              onClick={() => setTab("LOSERS")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
                tab === "LOSERS"
                  ? "bg-white border-gray-300 shadow-sm text-gray-900"
                  : "bg-transparent border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              Losers
            </button>
            <button
              onClick={() => setTab("VOLUME")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
                tab === "VOLUME"
                  ? "bg-white border-gray-300 shadow-sm text-gray-900"
                  : "bg-transparent border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              Volume shockers
            </button>
          </div>
          <div className="w-[140px]">
            <Select value={universe} onValueChange={setUniverse}>
              <SelectTrigger className="h-8 text-sm rounded-md border-gray-200 bg-white">
                <SelectValue placeholder="NIFTY 50" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="NIFTY 50">NIFTY 50</SelectItem>
                  <SelectItem value="NIFTY 100">NIFTY 100</SelectItem>
                  <SelectItem value="NIFTY 500">NIFTY 500</SelectItem>
                  <SelectItem value="NIFTY Midcap 100">NIFTY Midcap 100</SelectItem>
                  <SelectItem value="NIFTY Smallcap 100">NIFTY Smallcap 100</SelectItem>
                  <SelectItem value="Nifty Total Market">Nifty Total Market</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-0 text-left text-xs font-medium text-gray-600">Company</th>
              <th className="py-3 px-0 text-left text-xs font-medium text-gray-600">Market price (1D)</th>
              <th className="py-3 px-0 text-right text-xs font-medium text-gray-600">Volume</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-3 px-0">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="py-3 px-0">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-16" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-0 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                  </tr>
                ))}
              </>
            )}
            {!loading && !error && stocks.length === 0 && (
              <tr>
                <td className="py-8 text-center text-gray-500 text-sm" colSpan={3}>
                  No data available
                </td>
              </tr>
            )}
            {!loading && !error && stocks.length > 0 && stocks.map((stock, index) => {
              const lineData = generateLineGraph(stock.percent, stock.positive);
              return (
                <tr 
                  key={stock.symbol || index} 
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => stock.symbol && navigate(`/stock/${stock.symbol}`)}
                >
                  <td className="py-3 px-0">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded flex items-center justify-center text-xs font-semibold text-white shadow-sm flex-shrink-0", stock.iconClasses || 'bg-gradient-to-br from-blue-600 to-blue-700')}>
                        {stock.logo}
                      </div>
                      <span className="font-medium text-sm text-gray-900">{stock.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-0">
                    <div className="flex items-center gap-3">
                      {/* Mini Line Graph - positioned before price */}
                      <div className="w-16 h-6 flex-shrink-0 relative">
                        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                          {/* Grey baseline */}
                          <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
                          {/* Main line */}
                          <polyline
                            points={lineData.map(d => `${d.x},${30 - d.y}`).join(" ")}
                            fill="none"
                            stroke={stock.positive ? "#10b981" : "#ef4444"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold text-sm leading-tight text-gray-900">{stock.priceFormatted}</div>
                        <div className={`text-xs font-medium leading-tight mt-0.5 ${stock.positive ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? "+" : ""}{stock.changeFormatted} {stock.percentFormatted}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-0 text-right">
                    <span className="text-sm text-gray-600">{stock.volumeFormatted}</span>
                  </td>
                </tr>
              );
            })}
            {!loading && error && (
              <tr>
                <td className="py-4 text-red-600 text-sm" colSpan={3}>{error}</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {!loading && stocks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button 
              className="text-sm text-blue-600 font-medium hover:underline"
              onClick={() => {
                // Navigate to a more detailed view if needed
                console.log("See more clicked");
              }}
            >
              See more →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketMovers;
