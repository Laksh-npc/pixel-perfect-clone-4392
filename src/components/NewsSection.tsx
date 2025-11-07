import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  title: string;
  description: string;
  source_id: string;
  pubDate: string;
  link: string;
  companyName?: string;
  symbol?: string;
  change?: number;
  changePercent?: number;
}

const NewsSection = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Common Indian company names and their NSE symbols (expanded list)
  const companySymbolMap: Record<string, string> = {
    "britannia": "BRITANNIA",
    "britannia industries": "BRITANNIA",
    "bank of baroda": "BANKBARODA",
    "baroda": "BANKBARODA",
    "amber enterprises": "AMBER",
    "amber enterprises india": "AMBER",
    "wonderla": "WONDERLA",
    "wonderla holidays": "WONDERLA",
    "reliance": "RELIANCE",
    "reliance industries": "RELIANCE",
    "reliance power": "RPOWER",
    "tata": "TATAMOTORS",
    "tata motors": "TATAMOTORS",
    "tata steel": "TATASTEEL",
    "tata power": "TATAPOWER",
    "tcs": "TCS",
    "tata consultancy": "TCS",
    "infosys": "INFY",
    "hdfc": "HDFCBANK",
    "hdfc bank": "HDFCBANK",
    "icici": "ICICIBANK",
    "icici bank": "ICICIBANK",
    "sbi": "SBIN",
    "state bank": "SBIN",
    "state bank of india": "SBIN",
    "wipro": "WIPRO",
    "bharti": "BHARTIARTL",
    "bharti airtel": "BHARTIARTL",
    "airtel": "BHARTIARTL",
    "itc": "ITC",
    "axis bank": "AXISBANK",
    "axis": "AXISBANK",
    "kotak": "KOTAKBANK",
    "kotak mahindra": "KOTAKBANK",
    "hindalco": "HINDALCO",
    "jsw steel": "JSWSTEEL",
    "ultracemco": "ULTRACEMCO",
    "ultra tech": "ULTRACEMCO",
  };

  // Extract company name from news title/description
  const extractCompanyName = (title: string, description: string): { name: string; symbol: string | null } => {
    const text = `${title} ${description}`.toLowerCase();
    
    // Sort by length (longest first) to match more specific names first
    const sortedEntries = Object.entries(companySymbolMap).sort((a, b) => b[0].length - a[0].length);
    
    // Check for company names in the map
    for (const [companyName, symbol] of sortedEntries) {
      if (text.includes(companyName)) {
        // Format company name properly
        const formattedName = companyName
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        
        return {
          name: formattedName,
          symbol,
        };
      }
    }
    
    return {
      name: "",
      symbol: null,
    };
  };

  // Get stock price change for a symbol
  const getStockChange = async (symbol: string) => {
    try {
      const details = await api.getStockDetails(symbol);
      const priceInfo = details?.priceInfo || {};
      return {
        change: priceInfo.change || 0,
        changePercent: priceInfo.pChange || 0,
      };
    } catch (error) {
      return { change: 0, changePercent: 0 };
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const newsData = await api.getStockNews(20); // Fetch more to filter
        
        // Process news items
        const processedNews: NewsItem[] = [];
        const processedSymbols = new Set<string>();
        
        for (const item of newsData) {
          const { name, symbol } = extractCompanyName(item.title || '', item.description || '');
          
          // Skip if no company found or already processed this symbol
          if (!symbol || !name || processedSymbols.has(symbol)) {
            continue;
          }
          
          let change = 0;
          let changePercent = 0;
          
          try {
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            const stockData = await getStockChange(symbol);
            change = stockData.change;
            changePercent = stockData.changePercent;
          } catch (error) {
            // Skip if stock data not available
            continue;
          }
          
          processedNews.push({
            ...item,
            companyName: name,
            symbol,
            change,
            changePercent,
          });
          
          processedSymbols.add(symbol);
          
          // Stop when we have 4 valid news items
          if (processedNews.length >= 4) {
            break;
          }
        }
        
        const validNews = processedNews;
        
        setNews(validNews);
      } catch (err: any) {
        setError(err?.message || "Failed to load news");
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const getCompanyLogo = (name: string) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length >= 2) {
      return words[0].charAt(0) + words[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: false });
    } catch {
      return "Few hours";
    }
  };

  const handleNewsClick = (item: NewsItem) => {
    if (item.symbol) {
      navigate(`/stock/${item.symbol}`);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Stocks in news today</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Stocks in news today</h2>
        <p className="text-muted-foreground text-center py-8">News not available at the moment</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h2 className="text-xl font-semibold mb-4">Stocks in news today</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item, index) => {
          const isPositive = (item.changePercent || 0) >= 0;
          const changePercent = item.changePercent || 0;
          
          return (
            <div
              key={index}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white border-gray-200"
              onClick={() => handleNewsClick(item)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {getCompanyLogo(item.companyName || "")}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="font-medium text-sm">{item.companyName}</div>
                  <div className={`text-sm font-semibold ml-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
                {item.description || item.title}
              </p>
              
              <div className="text-xs text-gray-500">
                {item.source_id ? item.source_id.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'News'} · {formatTime(item.pubDate)}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4">
        <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          See more news <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default NewsSection;
