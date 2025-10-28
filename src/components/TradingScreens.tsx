const TradingScreens = () => {
  const screens = [
    { name: "Resistance breakouts", type: "Bullish", chart: "📈" },
    { name: "MACD above signal line", type: "Bullish", chart: "📊" },
    { name: "RSI overbought", type: "Bearish", chart: "📉" },
    { name: "RSI oversold", type: "Bullish", chart: "📈" },
  ];

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4">Trading Screens</h3>
      <div className="space-y-4">
        {screens.map((screen, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded">
            <div>
              <div className={`text-xs font-medium mb-1 ${screen.type === 'Bullish' ? 'text-primary' : 'text-destructive'}`}>
                {screen.type}
              </div>
              <div className="text-sm font-medium">{screen.name}</div>
            </div>
            <div className="text-2xl">{screen.chart}</div>
          </div>
        ))}
      </div>
      <button className="text-sm text-primary font-medium mt-4 hover:underline">
        Intraday screener →
      </button>
    </div>
  );
};

export default TradingScreens;
