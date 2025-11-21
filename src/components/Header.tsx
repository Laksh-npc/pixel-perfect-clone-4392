import { Search, Bell, Globe, Network, Terminal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SearchModal from "./SearchModal";
import NotificationPopup from "./NotificationPopup";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <>
      <header className={`border-b sticky top-0 z-50 transition-all duration-300 bg-white ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
          : 'bg-white'
      }`}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src="/groww-logo.svg" 
                alt="Groww DSFM" 
                className="w-10 h-10 flex-shrink-0"
              />
              <span className="text-xl font-semibold text-gray-900">Groww DSFM</span>
            </button>
            <nav className="flex items-center gap-6">
              <button className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors">Stocks</button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">F&O</button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Mutual Funds</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dsfm-analysis")}
              className="flex items-center gap-2 text-sm"
            >
              <Network className="w-4 h-4" />
              DSFM Analysis
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search Groww..." 
                className="pl-10 pr-16 w-80 bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                onClick={() => setSearchModalOpen(true)}
                readOnly
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">⌘K</span>
            </div>
            <NotificationPopup>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell className="w-5 h-5 text-gray-600" />
              </Button>
            </NotificationPopup>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <div className="w-8 h-8 rounded-full bg-gray-800"></div>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-6 border-t border-gray-200">
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                location.pathname === "/" 
                  ? "border-blue-600 text-gray-900" 
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Explore
            </button>
            <button 
              onClick={() => navigate("/holdings")}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                location.pathname === "/holdings" 
                  ? "border-blue-600 text-gray-900" 
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Holdings
            </button>
          </nav>
          
          <div className="flex items-center gap-4 py-3">
            <button 
              onClick={() => navigate("/terminal/RELIANCE")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4" />
              Terminal
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
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
