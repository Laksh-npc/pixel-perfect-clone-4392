import { ChevronDown, ArrowUpDown, Bookmark } from "lucide-react";
import { Button } from "./ui/button";

const MarketMovers = () => {
  const stocks = [
    { name: "Jindal Steel", logo: "🏭", price: "₹1,073.50", change: "39.20", percent: "(3.79%)", positive: true, volume: "44,45,977" },
    { name: "JSW Steel", logo: "🏗️", price: "₹1,184.20", change: "33.60", percent: "(2.92%)", positive: true, volume: "" },
    { name: "Tata Steel", logo: "⚙️", price: "₹181.81", change: "5.15", percent: "(2.92%)", positive: true, volume: "5,95,11,794" },
    { name: "SBI Life Insurance", logo: "🏦", price: "₹1,936.80", change: "33.70", percent: "(1.77%)", positive: true, volume: "21,66,517" },
    { name: "ICICI Lombard Gen.", logo: "🔴", price: "₹2,019.00", change: "32.60", percent: "(1.64%)", positive: true, volume: "8,03,330" },
    { name: "Info Edge (India)", logo: "📰", price: "₹1,385.70", change: "21.00", percent: "(1.54%)", positive: true, volume: "14,12,055" },
  ];

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Top market movers</h2>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full">
            Gainers
          </Button>
          <Button variant="ghost" size="sm">
            Losers
          </Button>
          <Button variant="ghost" size="sm">
            Volume shockers
          </Button>
        </div>
        <Button variant="outline" size="sm" className="ml-auto">
          NIFTY 100 <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
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
            {stocks.map((stock, index) => (
              <tr key={index} className="border-b last:border-b-0 hover:bg-secondary/30 cursor-pointer">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{stock.logo}</div>
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
