const SectorsTrending = () => {
  const sectors = [
    { 
      logo: "IH",
      name: "IT - Hardware", 
      change: "-3.61%", 
      positive: false,
      description: "Tech hardware sector shows mixed signals with major component manufacturers reporting quarterly results...",
      source: "Financial Express",
      time: "3 hours"
    },
    { 
      logo: "TI",
      name: "Telecom-Infra", 
      change: "-1.05%", 
      positive: false,
      description: "Telecom infrastructure companies face headwinds as 5G rollout costs impact margins...",
      source: "Business Standard",
      time: "3 hours"
    },
    { 
      logo: "ST",
      name: "Steel", 
      change: "-2.17%", 
      positive: false,
      description: "Steel sector under pressure as global demand concerns and rising input costs affect profitability...",
      source: "News18",
      time: "3 hours"
    },
    { 
      logo: "SH",
      name: "Shipping", 
      change: "+0.64%", 
      positive: true,
      description: "Shipping sector sees uptick as freight rates stabilize and international trade volumes improve...",
      source: "CNBC TV18",
      time: "4 hours"
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sectors trending today</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectors.map((sector, index) => (
          <div key={index} className="border rounded-lg p-5 bg-card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {sector.logo}
                </div>
                <div>
                  <div className="font-medium">{sector.name}</div>
                  <div className={`text-sm font-medium ${sector.positive ? 'text-success' : 'text-destructive'}`}>
                    {sector.change}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {sector.description}
            </p>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{sector.source}</span>
              <span>·</span>
              <span>{sector.time}</span>
            </div>
          </div>
        ))}
      </div>
      
      <button className="text-sm text-primary font-medium mt-4 hover:underline">
        See more sectors →
      </button>
    </div>
  );
};

export default SectorsTrending;
