import { Globe } from "lucide-react";

const MarketTicker = () => {
  const indices = [
    { name: "NIFTY", value: "25,936.20", change: "-29.85", percent: "(0.11%)", positive: false },
    { name: "SENSEX", value: "84,628.16", change: "-150.68", percent: "(0.18%)", positive: false },
    { name: "BANKNIFTY", value: "58,214.10", change: "99.85", percent: "(0.17%)", positive: true },
    { name: "MIDCPNIFTY", value: "13,366.20", change: "20.90", percent: "(0.16%)", positive: true },
    { name: "FINNIFTY", value: "27,450", change: "0", percent: "(0%)", positive: false },
  ];

  return (
    <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/10 via-cyan-400/10 to-purple-500/10 border-b px-6 py-2 overflow-x-auto">
      <div className="flex items-center gap-8 min-w-max">
        {indices.map((index) => (
          <div key={index.name} className="flex items-center gap-2">
            <span className="font-medium text-sm">{index.name}</span>
            <span className="text-sm text-foreground">{index.value}</span>
            <span className={`text-sm ${index.positive ? 'text-success' : 'text-destructive'}`}>
              {index.change} {index.percent}
            </span>
          </div>
        ))}
        <button className="p-1 hover:bg-border rounded">
          <Globe className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MarketTicker;
