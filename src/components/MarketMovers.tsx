import { ChevronDown, ArrowUpDown, Bookmark } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TabKey = "GAINERS" | "LOSERS" | "VOLUME";

const MarketMovers = () => {
  const [tab, setTab] = useState<TabKey>("GAINERS");
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [universe, setUniverse] = useState<string>("NIFTY 100");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [g, l] = await Promise.allSettled([
          api.getTopGainers(),
          api.getTopLosers(),
        ]);

        if (g.status === "fulfilled") {
          const list = Array.isArray(g.value) ? g.value : Array.isArray((g.value as any)?.data) ? (g.value as any).data : [];
          const mapped = list.map((it: any) => normalizeMover(it, true));
          if (isMounted) setGainers(mapped);
        }
        if (l.status === "fulfilled") {
          const list = Array.isArray(l.value) ? l.value : Array.isArray((l.value as any)?.data) ? (l.value as any).data : [];
          const mapped = list.map((it: any) => normalizeMover(it, false));
          if (isMounted) setLosers(mapped);
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load movers");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const stocks = useMemo(() => (tab === "GAINERS" ? gainers : tab === "LOSERS" ? losers : gainers), [tab, gainers, losers]);

  function normalizeMover(it: any, positiveDefault: boolean) {
    const symbol = it.symbol || it.companyName || it.tradingsymbol || it.name || "-";
    const last = it.lastPrice || it.ltp || it.price || 0;
    const change = it.netPrice || it.change || it.variation || 0; // percent or absolute depending on API
    const absolute = it.netChange || it.absoluteChange || it.changeAbs || 0;
    const volume = it.tradedQuantity || it.volume || "";
    const positive = Number(absolute || change) >= 0 ? true : positiveDefault;
    return {
      name: String(symbol),
      logo: symbol?.[0] || "•",
      price: typeof last === "number" ? `₹${last.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : String(last),
      change: typeof absolute === "number" ? absolute.toFixed(2) : String(absolute || ""),
      percent: `(${typeof change === "number" ? change.toFixed(2) : String(change)}%)`,
      positive,
      volume: typeof volume === "number" ? volume.toLocaleString("en-IN") : String(volume),
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
              <tr key={index} className="border-b last:border-b-0 hover:bg-secondary/30 cursor-pointer">
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
