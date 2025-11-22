import { Search, Bell, Terminal, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SearchModal from "./SearchModal";
import NotificationPopup from "./NotificationPopup";
import ProfileDropdown from "./ProfileDropdown";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/services/api";
import { Skeleton } from "./ui/skeleton";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [indices, setIndices] = useState<Array<{ name: string; value: string; change: string; percent: string; positive: boolean }>>([]);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch market indices
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingIndices(true);
        const res = await api.getIndices();
        // Map indices to match the display format
        const indexMap: Record<string, string> = {
          'NIFTY 50': 'NIFTY',
          'NIFTY': 'NIFTY',
          'SENSEX': 'SENSEX',
          'NIFTY BANK': 'BANKNIFTY',
          'BANK NIFTY': 'BANKNIFTY',
          'BANKNIFTY': 'BANKNIFTY',
          'NIFTY MIDCAP SELECT': 'MIDCPNIFTY',
          'NIFTY FINANCIAL SERVICES': 'FINNIFTY',
        };
        
        const targetIndices = ['NIFTY', 'SENSEX', 'BANKNIFTY', 'MIDCPNIFTY', 'FINNIFTY'];
        const mapped: Array<{ name: string; value: string; change: string; percent: string; positive: boolean }> = [];
        
        for (const target of targetIndices) {
          const found = res.find((idx: any) => {
            const idxName = idx.index || '';
            return indexMap[idxName] === target || idxName === target;
          });
          
          if (found) {
            const last = found.last || 0;
            const variation = found.variation || 0;
            const percentChange = found.percentChange || 0;
            const positive = Number(variation) >= 0;
            mapped.push({
              name: target,
              value: typeof last === "number" ? last.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(last),
              change: `${variation >= 0 ? "+" : ""}${typeof variation === "number" ? variation.toFixed(2) : String(variation)}`,
              percent: `(${variation >= 0 ? "+" : ""}${typeof percentChange === "number" ? percentChange.toFixed(2) : String(percentChange)}%)`,
              positive,
            });
          }
        }
        
        if (isMounted) setIndices(mapped);
      } catch (e: any) {
        console.error("Error fetching indices:", e);
      } finally {
        if (isMounted) setLoadingIndices(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogoClick = () => {
    navigate("/");
  };

  const getActiveNav = () => {
    if (location.pathname === "/") return "explore";
    if (location.pathname === "/holdings") return "holdings";
    if (location.pathname.includes("/positions")) return "positions";
    if (location.pathname.includes("/orders")) return "orders";
    if (location.pathname.includes("/watchlist")) return "watchlist";
    return "explore";
  };

  const activeNav = getActiveNav();

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 bg-white dark:bg-[#1a1a1a] ${
        isScrolled 
          ? 'bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm shadow-sm' 
          : 'bg-white dark:bg-[#1a1a1a]'
      }`}>
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-8">
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src="/groww-logo.svg" 
                alt="Groww" 
                className="w-10 h-10 flex-shrink-0 rounded-full"
              />
            </button>
            <nav className="flex items-center gap-6">
              <button className="text-sm font-medium text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-1 transition-colors">
                Stocks
              </button>
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                F&O
              </button>
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Mutual Funds
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search Groww..." 
                className="pl-10 pr-12 w-80 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                onClick={() => setSearchModalOpen(true)}
                readOnly
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">⌘K</span>
            </div>
            <NotificationPopup>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </NotificationPopup>
            <ProfileDropdown />
          </div>
        </div>
        
        {/* Secondary Navigation Bar */}
        <div className="flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeNav === "explore"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Explore
            </button>
            <button 
              onClick={() => navigate("/holdings")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeNav === "holdings"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Holdings
            </button>
            <button 
              onClick={() => navigate("/positions")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeNav === "positions"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Positions
            </button>
            <button 
              onClick={() => navigate("/orders")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeNav === "orders"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Orders
            </button>
            <button 
              onClick={() => navigate("/watchlist")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeNav === "watchlist"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Watchlist
            </button>
          </nav>
          
          <div className="flex items-center gap-4 py-3">
            <button 
              onClick={() => navigate("/terminal/RELIANCE")}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4" />
              Terminal
            </button>
            <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              915.trade ↗
            </button>
          </div>
        </div>

        {/* Market Ticker */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-2 overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max">
            {loadingIndices && (
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            )}
            {!loadingIndices && indices.map((index) => (
              <div key={index.name} className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-medium text-sm text-gray-900 dark:text-white">{index.name}:</span>
                <span className="text-sm text-gray-900 dark:text-white">{index.value}</span>
                <span className={`text-sm font-medium ${index.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {index.change} {index.percent}
                </span>
              </div>
            ))}
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors ml-auto">
              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </header>
      
      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
};

export default Header;
