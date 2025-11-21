import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Bookmark, TrendingUp, TrendingDown, Info, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StockChart from "@/components/StockChart";
import TradingWidget from "@/components/TradingWidget";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import Fundamentals from "@/components/Fundamentals";
import SimilarStocks from "@/components/SimilarStocks";
import Financials from "@/components/Financials";
import AboutCompany from "@/components/AboutCompany";
import CreateAlertDialog from "@/components/CreateAlertDialog";

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockDetails, setStockDetails] = useState<any>(null);
  const [tradeInfo, setTradeInfo] = useState<any>(null);
  const [corporateInfo, setCorporateInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

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

  // Convert to numbers explicitly to ensure consistency with Explore page
  // This ensures both pages use the exact same data type and extraction logic
  const currentPrice = Number(priceInfo.lastPrice) || 0;
  const previousClose = Number(priceInfo.previousClose) || 0;
  const change = Number(priceInfo.change) || 0;
  const percentChange = Number(priceInfo.pChange) || 0;
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

      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stock Header - Match Groww style */}
            <div className="pb-2 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{info.companyName || symbol}</h1>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                NSE ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}>({isPositive ? "+" : ""}{percentChange.toFixed(2)}%)</span> · BSE ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-primary hover:underline cursor-pointer">Depth</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAlertDialogOpen(true)}
                className="h-9 px-4 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-300"
              >
                <Clock className="w-4 h-4 mr-2" />
                Create Alert
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 px-4 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-300"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Watchlist
              </Button>
            </div>

            {/* Chart */}
            <StockChart symbol={symbol!} />

            {/* Create Stock SIP Section */}
            <Card className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer group bg-card dark:bg-[#1a1a1a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                      <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Create Stock SIP</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Automate your investments in this Stock.</p>
                    </div>
                  </div>
                  <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500 rotate-90 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Overview/News/Events/F&O - Match Groww style */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="h-10 bg-transparent p-0 border-b border-gray-200 dark:border-gray-800 rounded-none gap-0">
                <TabsTrigger 
                  value="overview" 
                  className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 data-[state=active]:bg-transparent rounded-none hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-colors duration-200"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="news" 
                  className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 data-[state=active]:bg-transparent rounded-none hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-colors duration-200"
                >
                  News
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 data-[state=active]:bg-transparent rounded-none hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-colors duration-200"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger 
                  value="fno" 
                  className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 data-[state=active]:bg-transparent rounded-none hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-400 transition-colors duration-200"
                >
                  F&O
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
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
              </TabsContent>

              <TabsContent value="news" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>News</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">News articles will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Corporate events will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Trading Widget */}
          <div className="lg:sticky lg:top-4 h-fit">
            <TradingWidget
              symbol={symbol!}
              companyName={info.companyName || symbol || ""}
              priceInfo={priceInfo}
              tradeInfo={tradeInfo}
            />
          </div>
        </div>
      </div>

      <CreateAlertDialog
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        symbol={symbol}
        currentPrice={currentPrice}
      />

      <Footer />
    </div>
  );
};

export default StockDetail;

