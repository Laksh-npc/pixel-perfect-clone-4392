import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import TerminalHeader from "@/components/terminal/TerminalHeader";
import ChartToolsSidebar from "@/components/terminal/ChartToolsSidebar";
import CandlestickChart from "@/components/terminal/CandlestickChart";
import TerminalWatchlist from "@/components/terminal/TerminalWatchlist";
import DSFMAnalysisPanel from "@/components/terminal/DSFMAnalysisPanel";

const Terminal = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockDetails, setStockDetails] = useState<any>(null);
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
        console.log(`Fetching stock details for symbol: ${symbol}`);
        const details = await api.getStockDetails(symbol);
        console.log("Stock details received:", details);
        setStockDetails(details);
      } catch (err: any) {
        console.error("Error fetching stock data from API:", err);
        setError(err?.message || "Failed to load stock details from API");
        setStockDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, navigate]);

  // Handle missing symbol
  if (!symbol) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Stock Symbol</h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // Default stock details for error state
  const defaultStockDetails = {
    info: { companyName: symbol, symbol: symbol },
    priceInfo: { lastPrice: 0, change: 0, pChange: 0, open: 0, high: 0, low: 0, close: 0 }
  };

  // Show loading state
  if (loading && !stockDetails) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TerminalHeader symbol={symbol} stockDetails={defaultStockDetails} />
        <div className="flex-1 flex overflow-hidden">
          <ChartToolsSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="h-8 w-48 mb-4" />
              <p className="text-muted-foreground">Loading terminal...</p>
            </div>
          </div>
          <TerminalWatchlist />
          <DSFMAnalysisPanel />
        </div>
      </div>
    );
  }

  // Show error if stock details failed to load
  if (error || (!loading && !stockDetails)) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TerminalHeader symbol={symbol} stockDetails={defaultStockDetails} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Failed to load stock data</h1>
            <p className="text-muted-foreground mb-6">
              {error || "Unable to fetch stock details from API"}
            </p>
            <p className="text-sm text-gray-500 mb-4">Symbol: {symbol}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Go Back Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TerminalHeader symbol={symbol} stockDetails={stockDetails} />
      <div className="flex-1 flex overflow-hidden">
        <ChartToolsSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <CandlestickChart symbol={symbol} stockDetails={stockDetails} />
        </div>
        <TerminalWatchlist />
        <DSFMAnalysisPanel />
      </div>
    </div>
  );
};

export default Terminal;

