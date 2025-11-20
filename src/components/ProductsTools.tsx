import { Megaphone, Link2, BarChart3, Hourglass, FileText, CalendarCheck, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const ProductsTools = () => {
  const products = [
    { name: "IPO", icon: Megaphone, badge: "3 open", badgeColor: "text-green-600" },
    { name: "Bonds", icon: Link2, badge: "1 open", badgeColor: "text-green-600" },
    { name: "ETF Screener", icon: BarChart3 },
    { name: "Intraday Screener", icon: Hourglass },
    { name: "MTF stocks", icon: FileText },
    { name: "Events calendar", icon: CalendarCheck },
    { name: "All Stocks screener", icon: Filter },
  ];

  return (
    <div className="border rounded-lg p-6 bg-card shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Products & Tools</h3>
      <div className="space-y-0.5">
        {products.map((product) => {
          const IconComponent = product.icon;
          return (
            <div 
              key={product.name} 
              className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-medium">{product.name}</span>
              </div>
              {product.badge && (
                <span className={cn("text-xs font-medium", product.badgeColor)}>
                  {product.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductsTools;
