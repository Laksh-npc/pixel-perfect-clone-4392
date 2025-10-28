const SectorsTrending = () => {
  const sectors = [
    { name: "IT - Hardware", gainers: 8, losers: 6, change: "+5.08%", positive: true },
    { name: "Telecom-Infra", gainers: 1, losers: 13, change: "+2.58%", positive: true },
    { name: "Steel", gainers: 51, losers: 69, change: "+2.39%", positive: true },
    { name: "Shipping", gainers: 5, losers: 3, change: "-1.54%", positive: false },
  ];

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
          {sectors.map((sector, index) => (
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
                      style={{ width: `${(sector.gainers / (sector.gainers + sector.losers)) * 100}%` }}
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
        </tbody>
      </table>
    </div>
  );
};

export default SectorsTrending;
