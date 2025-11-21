import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string | null;
  url: string;
  publishedAt: string;
  source: string;
  category?: string;
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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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
      if (!details) {
        return { change: 0, changePercent: 0 };
      }
      const priceInfo = details?.priceInfo || {};
      return {
        change: priceInfo.change || 0,
        changePercent: priceInfo.pChange || 0,
      };
    } catch (error) {
      // Return default values without logging - expected when backend is unavailable
      return { change: 0, changePercent: 0 };
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch merged news from Finnhub (with NewsAPI fallback)
        const newsData = await api.getMergedNews(20);
        
        if (!newsData || newsData.length === 0) {
          setNews([]);
          setLoading(false);
          return;
        }
        
        // Process news items - try to extract company names and get stock data
        const processedNews: NewsItem[] = [];
        const processedSymbols = new Set<string>();
        
        for (const item of newsData) {
          const { name, symbol } = extractCompanyName(item.title || '', item.description || '');
          
          // If we found a company, try to get stock data
          if (symbol && name && !processedSymbols.has(symbol)) {
            let change = 0;
            let changePercent = 0;
            
            try {
              // Add small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 200));
              const stockData = await getStockChange(symbol);
              change = stockData.change;
              changePercent = stockData.changePercent;
            } catch (error) {
              // Continue without stock data if unavailable
            }
            
            processedNews.push({
              ...item,
              companyName: name,
              symbol,
              change,
              changePercent,
            });
            
            processedSymbols.add(symbol);
          } else {
            // Add news even without company match (but limit these)
            if (processedNews.length < 8) {
              processedNews.push({
                ...item,
                companyName: item.source || "Market News",
              });
            }
          }
          
          // Stop when we have enough news items (prioritize company-matched news)
          if (processedNews.length >= 8) {
            break;
          }
        }
        
        // Sort by published date (newest first) and take top 4-8 items
        processedNews.sort((a, b) => {
          const dateA = new Date(a.publishedAt).getTime();
          const dateB = new Date(b.publishedAt).getTime();
          return dateB - dateA;
        });
        
        // Prioritize items with company/symbol matches, then take top 4
        const withSymbol = processedNews.filter(item => item.symbol);
        const withoutSymbol = processedNews.filter(item => !item.symbol);
        const finalNews = [...withSymbol, ...withoutSymbol].slice(0, 4);
        
        setNews(finalNews);
      } catch (err: any) {
        // Don't set error state for expected failures (API unavailable)
        // Just set empty news array
        setNews([]);
        // Only log unexpected errors
        if (!err?.message?.includes("Network error") && !err?.message?.includes("404") && !err?.message?.includes("CORS")) {
          console.warn("Unexpected error fetching news:", err);
        }
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
      const distance = formatDistanceToNow(date, { addSuffix: false });
      // Convert to "X mins ago" or "X hours ago" format
      if (distance.includes("minute")) {
        const mins = distance.match(/\d+/)?.[0] || "few";
        return `${mins} mins`;
      } else if (distance.includes("hour")) {
        const hours = distance.match(/\d+/)?.[0] || "few";
        return `${hours} hrs`;
      } else if (distance.includes("day")) {
        const days = distance.match(/\d+/)?.[0] || "few";
        return `${days} days`;
      }
      return distance;
    } catch {
      return "Few hours";
    }
  };

  const handleNewsClick = (item: NewsItem) => {
    if (item.symbol) {
      navigate(`/stock/${item.symbol}`);
    } else if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
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
          const hasImage = item.image && item.image.trim() !== '';
          
          return (
            <div
              key={item.id || index}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800"
              onClick={() => handleNewsClick(item)}
            >
              <div className="flex items-start gap-3 mb-3">
                {hasImage && !imageErrors.has(item.id) ? (
                  <img 
                    src={item.image!} 
                    alt={item.title}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                    onError={() => {
                      // Mark image as failed to load
                      setImageErrors(prev => new Set(prev).add(item.id));
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {getCompanyLogo(item.companyName || "")}
                  </div>
                )}
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="font-medium text-sm">{item.companyName || item.source}</div>
                  {item.changePercent !== undefined && (
                    <div className={`text-sm font-semibold ml-2 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                      {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {item.title}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 leading-relaxed">
                {item.description || item.title}
              </p>
              
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {item.source ? item.source.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'News'} · {formatTime(item.publishedAt)}
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
