import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const MarketTicker = () => {
  const [indices, setIndices] = useState<Array<{ name: string; value: string; change: string; percent: string; positive: boolean }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getIndices();
        // Filter for main indices to display
        const mainIndices = ['NIFTY 50', 'NIFTY BANK', 'NIFTY MIDCAP SELECT', 'NIFTY FINANCIAL SERVICES'];
        const filtered = res.filter((idx: any) => mainIndices.includes(idx.index));
        const indicesToShow = filtered.length > 0 ? filtered : res.slice(0, 5);
        
        const mapped = indicesToShow.map((it: any) => {
          const name = it.index || "INDEX";
          const last = it.last || 0;
          const variation = it.variation || 0;
          const percentChange = it.percentChange || 0;
          const positive = Number(variation) >= 0;
          return {
            name: String(name),
            value: typeof last === "number" ? last.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : String(last),
            change: `${variation >= 0 ? "+" : ""}${typeof variation === "number" ? variation.toFixed(2) : String(variation)}`,
            percent: `(${variation >= 0 ? "+" : ""}${typeof percentChange === "number" ? percentChange.toFixed(2) : String(percentChange)}%)`,
            positive,
          };
        });
        if (isMounted) setIndices(mapped);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load indices");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-secondary/50 border-b px-6 py-2 overflow-x-auto">
      <div className="flex items-center gap-8 min-w-max">
        {loading && (
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}
        {!loading && !error && indices.map((index) => (
          <div key={index.name} className="flex items-center gap-2">
            <span className="font-medium text-sm">{index.name}</span>
            <span className="text-sm text-foreground">{index.value}</span>
            <span className={`text-sm ${index.positive ? 'text-success' : 'text-destructive'}`}>
              {index.change} {index.percent}
            </span>
          </div>
        ))}
        {!loading && error && (
          <div className="text-xs text-destructive">{error}</div>
        )}
        <button className="p-1 hover:bg-border rounded">
          <Globe className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MarketTicker;
