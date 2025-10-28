const NewsSection = () => {
  const news = [
    {
      company: "BSE",
      logo: "📊",
      change: "-3.61%",
      positive: false,
      headline: "Property Developer Signature Global has raised Rs 875 crore through a private placement of non-convertible...",
      source: "Financial Express",
      time: "3 hours"
    },
    {
      company: "ICICI Bank",
      logo: "🏦",
      change: "-1.05%",
      positive: false,
      headline: "Credit card spends touched a record high of ₹2.17 trillion in September 2025, driven by festive season demand an...",
      source: "Business Standard",
      time: "3 hours"
    },
  ];

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Stocks in news today</h2>
      
      <div className="space-y-4">
        {news.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{item.logo}</div>
                <div>
                  <div className="font-medium">{item.company}</div>
                  <div className={`text-sm ${item.positive ? 'text-success' : 'text-destructive'}`}>
                    {item.change}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {item.headline}
            </p>
            <div className="text-xs text-muted-foreground">
              {item.source} · {item.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
