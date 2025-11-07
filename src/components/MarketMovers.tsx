import { ChevronDown, ArrowUpDown, Bookmark } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIVERSE_TO_SYMBOLS } from "@/lib/universes";

type TabKey = "GAINERS" | "LOSERS" | "VOLUME";

const MarketMovers = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("GAINERS");
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [universe, setUniverse] = useState<string>("NIFTY 100");

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
          }
          return;
        }
        const chunkSize = 80;
        const chunks: string[][] = [];
        for (let i = 0; i < symbols.length; i += chunkSize) {
          chunks.push(symbols.slice(i, i + chunkSize));
        }
        const responses = await Promise.all(chunks.map(c => api.getEquitiesBySymbols(c)));
        const equities = responses.flat();
        const rows = toRows(equities);
        const g = [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 6);
        const l = [...rows].sort((a, b) => a.changePct - b.changePct).slice(0, 6);
        if (active) {
          setGainers(g.map(mapRowToStock));
          setLosers(l.map(mapRowToStock));
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

  const stocks = useMemo(() => (tab === "GAINERS" ? gainers : tab === "LOSERS" ? losers : gainers), [tab, gainers, losers]);

  function toRows(equities: any[]) {
    return equities.map((e) => {
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
      logo: String(row.symbol?.[0] || "•"),
      price: `₹${row.last.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      change: `${Math.abs(row.changeAbs).toFixed(2)}`,
      percent: `(${row.changePct.toFixed(2)}%)`,
      positive,
      volume: row.volume ? row.volume.toLocaleString("en-IN") : "",
    };
  }

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Top market movers</h2>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant={tab === "GAINERS" ? "outline" : "ghost"} size="sm" className="rounded-full" onClick={() => setTab("GAINERS")}>
            Gainers
          </Button>
          <Button variant={tab === "LOSERS" ? "outline" : "ghost"} size="sm" onClick={() => setTab("LOSERS")}>
            Losers
          </Button>
          <Button variant={tab === "VOLUME" ? "outline" : "ghost"} size="sm" onClick={() => setTab("VOLUME")}>
            Volume shockers
          </Button>
        </div>
        <div className="ml-auto w-[160px]">
          <Select value={universe} onValueChange={setUniverse}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="NIFTY 100" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="NIFTY 100" className="group">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-5 w-5 items-center justify-center">
                      <span className="h-4 w-4 rounded-full border-2 border-emerald-500"></span>
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-0 group-data-[state=checked]:opacity-100 transition-opacity"></span>
                    </span>
                    <span>NIFTY 100</span>
                  </div>
                </SelectItem>
                <SelectItem value="NIFTY 500" className="group">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-5 w-5 items-center justify-center">
                      <span className="h-4 w-4 rounded-full border-2 border-emerald-500"></span>
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-0 group-data-[state=checked]:opacity-100 transition-opacity"></span>
                    </span>
                    <span>NIFTY 500</span>
                  </div>
                </SelectItem>
                <SelectItem value="NIFTY Midcap 100" className="group">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-5 w-5 items-center justify-center">
                      <span className="h-4 w-4 rounded-full border-2 border-emerald-500"></span>
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-0 group-data-[state=checked]:opacity-100 transition-opacity"></span>
                    </span>
                    <span>NIFTY Midcap 100</span>
                  </div>
                </SelectItem>
                <SelectItem value="NIFTY Smallcap 100" className="group">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-5 w-5 items-center justify-center">
                      <span className="h-4 w-4 rounded-full border-2 border-emerald-500"></span>
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-0 group-data-[state=checked]:opacity-100 transition-opacity"></span>
                    </span>
                    <span>NIFTY Smallcap 100</span>
                  </div>
                </SelectItem>
                <SelectItem value="Nifty Total Market" className="group">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-5 w-5 items-center justify-center">
                      <span className="h-4 w-4 rounded-full border-2 border-emerald-500"></span>
                      <span className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-0 group-data-[state=checked]:opacity-100 transition-opacity"></span>
                    </span>
                    <span>Nifty Total Market</span>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 text-sm font-medium text-muted-foreground">Company</th>
              <th className="pb-3 text-sm font-medium text-muted-foreground">Market price (1D)</th>
              <th className="pb-3 text-sm font-medium text-muted-foreground">Volume</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="py-4" colSpan={4}>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </td>
              </tr>
            )}
            {!loading && !error && stocks.map((stock, index) => (
              <tr 
                key={index} 
                className="border-b last:border-b-0 hover:bg-secondary/30 cursor-pointer"
                onClick={() => stock.symbol && navigate(`/stock/${stock.symbol}`)}
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-sm font-medium">
                      {stock.logo}
                    </div>
                    <span className="font-medium">{stock.name}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-8">
                      <svg className="w-full h-full" viewBox="0 0 100 30">
                        <path
                          d="M 0,25 Q 25,20 50,15 T 100,5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-success"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">{stock.price}</div>
                      <div className={`text-sm ${stock.positive ? 'text-success' : 'text-destructive'}`}>
                        {stock.change} {stock.percent}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-muted-foreground">{stock.volume}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && error && (
              <tr>
                <td className="py-4 text-destructive text-sm" colSpan={4}>{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <button className="text-sm text-primary font-medium mt-4 hover:underline">
        See more →
      </button>
    </div>
  );
};

export default MarketMovers;
