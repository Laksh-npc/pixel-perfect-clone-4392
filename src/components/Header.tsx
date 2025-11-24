import { Search, Bell, Terminal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SearchModal from "./SearchModal";
import NotificationPopup from "./NotificationPopup";
import ProfileDropdown from "./ProfileDropdown";
import { useTheme } from "@/contexts/ThemeContext";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
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

  const handleLogoClick = () => {
    navigate("/");
  };

  const getActiveNav = () => {
    if (location.pathname === "/") return "explore";
    if (location.pathname === "/holdings") return "holdings";
    if (location.pathname.includes("/watchlist")) return "watchlist";
    if (location.pathname.includes("/dsfm-analysis")) return "dsfm";
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
              <span className="text-black dark:text-white font-medium font-semibold text-base">
                Groww DSFM
              </span>
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
              onClick={() => navigate("/watchlist")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeNav === "watchlist"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Watchlist
            </button>
            <button 
              onClick={() => navigate("/dsfm-analysis")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                activeNav === "dsfm"
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              DSFM Analysis
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
      </header>
      
      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
};

export default Header;
