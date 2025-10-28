import Header from "@/components/Header";
import MarketTicker from "@/components/MarketTicker";
import StockCard from "@/components/StockCard";
import InvestmentSummary from "@/components/InvestmentSummary";
import ProductsTools from "@/components/ProductsTools";
import MarketMovers from "@/components/MarketMovers";
import TradingScreens from "@/components/TradingScreens";
import SectorsTrending from "@/components/SectorsTrending";
import NewsSection from "@/components/NewsSection";
import Footer from "@/components/Footer";

const Index = () => {
  const mostBoughtStocks = [
    { logo: "Vi", name: "Vodafone Idea", price: "₹9.44", change: "-0.53", percent: "(5.32%)", positive: false },
    { logo: "TG", name: "TATAGOLD", price: "₹11.37", change: "-0.40", percent: "(3.40%)", positive: false },
    { logo: "NI", name: "Nippon India ETF Gold B...", price: "₹96.84", change: "-3.30", percent: "(3.30%)", positive: false, showBookmark: true },
    { logo: "NS", name: "Newgen Software Tech", price: "₹996.55", change: "100.30", percent: "(11.19%)", positive: true },
  ];

  const mtfStocks = [
    { logo: "MD", name: "Mazagon Dock Ship", price: "₹4,206.80", change: "309.80", percent: "(7.95%)", positive: true },
    { logo: "BSE", name: "BSE", price: "₹200.35", change: "4.46", percent: "(2.28%)", positive: true },
    { logo: "SS", name: "Sai Silks (Kalaman)", price: "₹3,135.20", change: "469.80", percent: "(17.63%)", positive: true },
    { logo: "NS", name: "Newgen Software Tech", price: "₹251.97", change: "-20.06", percent: "(7.37%)", positive: false },
  ];

  const intradayScreenerStocks = [
    { logo: "N", name: "Netweb Technologies", price: "₹4,206.80", change: "309.80", percent: "(7.95%)", positive: true },
    { logo: "SS", name: "Sai Silks (Kalaman)", price: "₹200.35", change: "4.46", percent: "(2.28%)", positive: true },
    { logo: "T", name: "Cartrade Tech", price: "₹3,135.20", change: "469.80", percent: "(17.63%)", positive: true },
    { logo: "E", name: "EPack Prefab Techno.", price: "₹251.97", change: "-20.06", percent: "(7.37%)", positive: false },
  ];

  const etfs = [
    { logo: "G", name: "Groww Nifty Midcap 15...", status: "NFO", statusColor: "text-muted-foreground", badge: "Open now", badgeColor: "text-success" },
    { logo: "G", name: "Groww Gold ETF", price: "₹113.99", change: "-4.57", percent: "(3.85%)", positive: false },
    { logo: "G", name: "Groww Silver ETF", price: "₹136.80", change: "-6.23", percent: "(4.36%)", positive: false },
    { logo: "G", name: "Groww Nifty Smallcap 2...", status: "NFO", statusColor: "text-muted-foreground", badge: "Closed" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MarketTicker />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">Most bought stocks on Groww</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mostBoughtStocks.map((stock, index) => (
                  <StockCard key={index} {...stock} />
                ))}
              </div>
              <button className="text-sm text-primary font-medium mt-4 hover:underline">
                See more →
              </button>
            </section>

            <MarketMovers />

            <section>
              <h2 className="text-xl font-semibold mb-4">Most traded stocks in MTF</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mtfStocks.map((stock, index) => (
                  <StockCard key={index} {...stock} />
                ))}
              </div>
            </section>

            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {intradayScreenerStocks.map((stock, index) => (
                  <StockCard key={index} {...stock} />
                ))}
              </div>
              <button className="text-sm text-primary font-medium hover:underline">
                Intraday screener →
              </button>
            </section>

            <SectorsTrending />

            <section>
              <h2 className="text-xl font-semibold mb-4">ETFs by Groww</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {etfs.map((etf, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {etf.logo}
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-2">{etf.name}</div>
                    {etf.price ? (
                      <>
                        <div className="text-lg font-semibold mb-1">{etf.price}</div>
                        <div className={`text-sm ${etf.positive ? 'text-success' : 'text-destructive'}`}>
                          {etf.change} {etf.percent}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`text-sm mb-1 ${etf.statusColor}`}>{etf.status}</div>
                        <div className={`text-sm ${etf.badgeColor}`}>{etf.badge}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button className="text-sm text-primary font-medium mt-4 hover:underline">
                See all ETFs →
              </button>
            </section>

            <NewsSection />
          </div>

          <div className="space-y-6">
            <InvestmentSummary />
            <ProductsTools />
            <TradingScreens />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
