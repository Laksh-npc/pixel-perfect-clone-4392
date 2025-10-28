import { Search, Bell, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const Header = () => {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center">
              <div className="w-5 h-5 bg-background rounded-full"></div>
            </div>
            <span className="text-xl font-semibold">Groww</span>
          </div>
          <nav className="flex items-center gap-6">
            <button className="font-medium text-foreground">Stocks</button>
            <button className="text-muted-foreground hover:text-foreground">F&O</button>
            <button className="text-muted-foreground hover:text-foreground">Mutual Funds</button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search Groww..." 
              className="pl-10 pr-20 w-80 bg-secondary border-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Ctrl+K</span>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="w-8 h-8 rounded-full bg-destructive"></div>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-6 border-t">
        <nav className="flex items-center gap-6">
          <button className="py-3 border-b-2 border-primary font-medium text-foreground">Explore</button>
          <button className="py-3 text-muted-foreground hover:text-foreground">Holdings</button>
          <button className="py-3 text-muted-foreground hover:text-foreground">Positions</button>
          <button className="py-3 text-muted-foreground hover:text-foreground">Orders</button>
          <button className="py-3 text-muted-foreground hover:text-foreground">Watchlist</button>
        </nav>
        
        <div className="flex items-center gap-4 py-3">
          <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <span>📊</span> Terminal
          </button>
          <button className="text-sm text-muted-foreground hover:text-foreground">
            915.trade ↗
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
