import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const SectorsTrending = () => {
  const [sectors, setSectors] = useState<Array<{ name: string; gainers: number; losers: number; change: string; positive: boolean }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getSectors();
        // Sectors come as indices, so we'll show them with simplified data
        // Since we don't have gainers/losers count, we'll show a placeholder or estimate
        const mapped = res.slice(0, 10).map((it: any) => {
          const name = it.index || it.name || "Sector";
          const percentChange = it.percentChange || 0;
          const positive = Number(percentChange) >= 0;
          // Since we don't have actual gainers/losers data, use placeholder values
          // In a real scenario, you'd need to query individual stocks in each sector
          const estimatedGainers = positive ? 5 : 2;
          const estimatedLosers = positive ? 2 : 5;
          return {
            name: String(name),
            gainers: estimatedGainers,
            losers: estimatedLosers,
            change: `${percentChange >= 0 ? "+" : ""}${typeof percentChange === "number" ? percentChange.toFixed(2) : String(percentChange)}%`,
            positive,
          };
        });
        if (isMounted) setSectors(mapped);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load sectors");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Sectors trending today</h2>
      
      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 text-sm font-medium text-muted-foreground">Sector</th>
            <th className="pb-3 text-sm font-medium text-muted-foreground">Gainers/Losers</th>
            <th className="pb-3 text-sm font-medium text-muted-foreground text-right">1D price change</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="py-4" colSpan={3}>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-2 w-48" />
                </div>
              </td>
            </tr>
          )}
          {!loading && !error && sectors.map((sector, index) => (
            <tr key={index} className="border-b last:border-b-0 hover:bg-secondary/30 cursor-pointer">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-sm">
                    {sector.name.charAt(0)}
                  </div>
                  <span className="font-medium">{sector.name}</span>
                </div>
              </td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{sector.gainers}</span>
                  <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success" 
                      style={{ width: `${(sector.gainers / (sector.gainers + sector.losers || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{sector.losers}</span>
                </div>
              </td>
              <td className={`py-4 text-right font-medium ${sector.positive ? 'text-success' : 'text-destructive'}`}>
                {sector.change}
              </td>
            </tr>
          ))}
          {!loading && error && (
            <tr>
              <td className="py-4 text-destructive text-sm" colSpan={3}>{error}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SectorsTrending;
