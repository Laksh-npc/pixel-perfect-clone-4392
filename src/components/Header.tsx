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

  return (
    <>
      <header className={`border-b sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/80 backdrop-blur-xl shadow-sm' 
          : 'bg-background'
      }`}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img 
                src="/groww-logo.svg" 
                alt="Groww DSFM" 
                className="w-10 h-10"
              />
              <span className="text-xl font-semibold">Groww DSFM</span>
            </div>
            <nav className="flex items-center gap-6">
              <button className="font-medium text-foreground">Stocks</button>
              <button className="text-muted-foreground hover:text-foreground">F&O</button>
              <button className="text-muted-foreground hover:text-foreground">Mutual Funds</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search Groww..." 
                className="pl-10 pr-20 w-80 bg-secondary border-none cursor-pointer"
                onClick={() => setSearchModalOpen(true)}
                readOnly
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">⌘K</span>
            </div>
            <NotificationPopup>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
            </NotificationPopup>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-destructive"></div>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-6 border-t">
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/")}
              className={`py-3 border-b-2 font-medium transition-colors ${
                location.pathname === "/" 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Explore
            </button>
            <button 
              onClick={() => navigate("/holdings")}
              className={`py-3 border-b-2 font-medium transition-colors ${
                location.pathname === "/holdings" 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Holdings
            </button>
          </nav>
          
          <div className="flex items-center gap-4 py-3">
            <button 
              onClick={() => navigate("/terminal")}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Terminal className="w-4 h-4" />
              Terminal
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground">
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
