const TradingScreens = () => {
  const screens = [
    { name: "Resistance breakouts", type: "Bullish", isPositive: true },
    { name: "MACD above signal line", type: "Bullish", isPositive: true },
    { name: "RSI overbought", type: "Bearish", isPositive: false },
    { name: "RSI oversold", type: "Bullish", isPositive: true },
  ];

  // Generate mini chart data
  const generateChartData = (isPositive: boolean) => {
    const points = 12;
    const data = [];
    for (let i = 0; i < points; i++) {
      const x = (i / (points - 1)) * 100;
      const progress = i / (points - 1);
      const baseY = 20;
      const variation = Math.sin(progress * Math.PI) * 2;
      const trend = isPositive 
        ? baseY - (progress * 8) - variation
        : baseY + (progress * 8) + variation;
      data.push({ x, y: Math.max(5, Math.min(25, trend)) });
    }
    return data;
  };

  return (
    <div className="border rounded-lg p-6 bg-card shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Trading Screens</h3>
      <div className="space-y-0">
        {screens.map((screen, index) => {
          const chartData = generateChartData(screen.isPositive);
          return (
            <div key={index}>
              <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors">
                <div className="flex-1">
                  <div className={`text-xs font-medium mb-1 ${screen.type === 'Bullish' ? 'text-green-600' : 'text-orange-600'}`}>
                    {screen.type}
                  </div>
                  <div className="text-sm font-medium">{screen.name}</div>
                </div>
                <div className="w-16 h-10 flex-shrink-0 ml-4">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline
                      points={chartData.map(d => `${d.x},${30 - d.y}`).join(" ")}
                      fill="none"
                      stroke={screen.isPositive ? "#10b981" : "#f97316"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              {index < screens.length - 1 && <hr className="border-t border-border/50" />}
            </div>
          );
        })}
      </div>
      <button className="text-sm text-primary font-medium mt-4 hover:underline">
        Intraday screener →
      </button>
    </div>
  );
};

export default TradingScreens;
