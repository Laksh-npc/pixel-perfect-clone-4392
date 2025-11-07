import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Bookmark, TrendingUp, TrendingDown, Info, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StockChart from "@/components/StockChart";
import TradingWidget from "@/components/TradingWidget";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import Fundamentals from "@/components/Fundamentals";
import SimilarStocks from "@/components/SimilarStocks";
import Financials from "@/components/Financials";
import AboutCompany from "@/components/AboutCompany";

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockDetails, setStockDetails] = useState<any>(null);
  const [tradeInfo, setTradeInfo] = useState<any>(null);
  const [corporateInfo, setCorporateInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [details, trade, corporate] = await Promise.all([
          api.getStockDetails(symbol),
          api.getStockTradeInfo(symbol).catch(() => null),
          api.getStockCorporateInfo(symbol).catch(() => null),
        ]);
        setStockDetails(details);
        setTradeInfo(trade);
        setCorporateInfo(corporate);
      } catch (err: any) {
        setError(err?.message || "Failed to load stock details");
        console.error("Error fetching stock data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !stockDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Stock not found</h1>
            <p className="text-muted-foreground mb-6">{error || "Unable to load stock details"}</p>
            <Button onClick={() => navigate("/")}>Go Back Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const priceInfo = stockDetails.priceInfo || {};
  const info = stockDetails.info || {};
  const metadata = stockDetails.metadata || {};
  const securityInfo = stockDetails.securityInfo || {};

  const currentPrice = priceInfo.lastPrice || 0;
  const previousClose = priceInfo.previousClose || 0;
  const change = priceInfo.change || 0;
  const percentChange = priceInfo.pChange || 0;
  const isPositive = change >= 0;

  // Format company name for logo
  const getCompanyLogo = (name: string) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length >= 2) {
      return words[0].charAt(0) + words[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-6 py-2">
          <div className="text-sm text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-foreground">Home</button>
            {" > "}
            <button onClick={() => navigate("/")} className="hover:text-foreground">Stocks</button>
            {" > "}
            <span className="text-foreground">{info.companyName || symbol}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl">
                {getCompanyLogo(info.companyName || symbol || "")}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{info.companyName || symbol}</h1>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl font-bold">₹{currentPrice.toFixed(2)}</span>
                  <span className={`text-lg font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? "+" : ""}
                    {change.toFixed(2)} ({isPositive ? "+" : ""}
                    {percentChange.toFixed(2)}%) 1D
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Create Alert
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Watchlist
                  </Button>
                </div>
              </div>
            </div>

            {/* Chart */}
            <StockChart symbol={symbol!} />

            {/* Create Stock SIP Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <CardTitle>Create Stock SIP</CardTitle>
                </div>
                <CardDescription>Automate your investments in this Stock.</CardDescription>
              </CardHeader>
            </Card>

            {/* Performance Section */}
            <PerformanceMetrics priceInfo={priceInfo} securityInfo={securityInfo} tradeInfo={tradeInfo} />

            {/* Fundamentals Section */}
            <Fundamentals stockDetails={stockDetails} corporateInfo={corporateInfo} />

            {/* Financials Section */}
            <Financials corporateInfo={corporateInfo} />

            {/* About Company */}
            <AboutCompany stockDetails={stockDetails} corporateInfo={corporateInfo} />

            {/* Similar Stocks */}
            <SimilarStocks symbol={symbol!} currentStockName={info.companyName} />
          </div>

          {/* Right Column - Trading Widget */}
          <div className="space-y-6">
            <TradingWidget
              symbol={symbol!}
              companyName={info.companyName || symbol || ""}
              priceInfo={priceInfo}
              tradeInfo={tradeInfo}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StockDetail;

