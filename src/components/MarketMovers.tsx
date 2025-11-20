import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIVERSE_TO_SYMBOLS } from "@/lib/universes";
import { cn } from "@/lib/utils";

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
        if (symbols.length === 0) {
          if (active) {
            setGainers([]);
            setLosers([]);
            setVolumeShockers([]);
          }
          return;
        }
        const chunkSize = 80;
        const chunks: string[][] = [];
        for (let i = 0; i < symbols.length; i += chunkSize) {
          chunks.push(symbols.slice(i, i + chunkSize));
        }
        const responses = await Promise.all(
          chunks.map(c => api.getEquitiesBySymbols(c).catch(() => []))
        );
        const equities = responses.flat().filter(e => e && e.symbol);
        const rows = toRows(equities);
        
        // Filter out rows with invalid data
        const validRows = rows.filter(r => r.symbol && r.name && r.last > 0);
        
        const g = [...validRows]
          .sort((a, b) => b.changePct - a.changePct)
          .slice(0, 5);
        const l = [...validRows]
          .sort((a, b) => a.changePct - b.changePct)
          .slice(0, 5);
        const v = [...validRows]
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 5);
        
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
    return {
      symbol: row.symbol,
      name: String(row.name),
      logo: getLogo(String(row.name), row.symbol),
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
    <div className="border rounded-lg p-6 bg-card shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Top market movers</h2>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("GAINERS")}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
              tab === "GAINERS"
                ? "bg-background border-border shadow-sm"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-border"
            )}
          >
            Gainers
          </button>
          <button
            onClick={() => setTab("LOSERS")}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
              tab === "LOSERS"
                ? "bg-background border-border shadow-sm"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-border"
            )}
          >
            Losers
          </button>
          <button
            onClick={() => setTab("VOLUME")}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full border transition-all",
              tab === "VOLUME"
                ? "bg-background border-border shadow-sm"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-border"
            )}
          >
            Volume shockers
          </button>
        </div>
        <div className="w-[160px]">
          <Select value={universe} onValueChange={setUniverse}>
            <SelectTrigger className="h-8 text-sm rounded-full border-border/50">
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="pb-3 text-left text-sm font-medium text-muted-foreground w-[40%]">Company</th>
              <th className="pb-3 text-left text-sm font-medium text-muted-foreground w-[35%]">Market price (1D)</th>
              <th className="pb-3 text-left text-sm font-medium text-muted-foreground w-[25%]">Volume</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </td>
                    <td className="py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))}
              </>
            )}
            {!loading && !error && stocks.length === 0 && (
              <tr>
                <td className="py-8 text-center text-muted-foreground text-sm" colSpan={3}>
                  No data available
                </td>
              </tr>
            )}
            {!loading && !error && stocks.length > 0 && stocks.map((stock, index) => {
              const lineData = generateLineGraph(stock.percent, stock.positive);
              return (
                <tr 
                  key={stock.symbol || index} 
                  className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => stock.symbol && navigate(`/stock/${stock.symbol}`)}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br from-primary/80 to-primary flex-shrink-0">
                        {stock.logo}
                      </div>
                      <span className="font-medium text-sm">{stock.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {/* Mini Line Graph - positioned before price */}
                      <div className="w-16 h-6 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                          {/* Grey baseline */}
                          <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
                          {/* Main line */}
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
                      <div>
                        <div className="font-semibold text-sm leading-tight">{stock.priceFormatted}</div>
                        <div className={`text-xs font-medium leading-tight ${stock.positive ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? "+" : ""}{stock.changeFormatted} {stock.percentFormatted}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{stock.volumeFormatted}</td>
                </tr>
              );
            })}
            {!loading && error && (
              <tr>
                <td className="py-4 text-destructive text-sm" colSpan={3}>{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketMovers;
