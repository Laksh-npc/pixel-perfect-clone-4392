const ProductsTools = () => {
  const products = [
    { name: "IPO", icon: "📢", badge: "4 open", badgeColor: "text-primary" },
    { name: "Bonds", icon: "📊", badge: "1 open", badgeColor: "text-primary" },
    { name: "ETF Screener", icon: "📈" },
    { name: "Intraday Screener", icon: "⏱️" },
    { name: "MTF stocks", icon: "📱" },
    { name: "Events calendar", icon: "✅" },
    { name: "All Stocks screener", icon: "🔍" },
  ];

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4">Products & Tools</h3>
      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.name} className="flex items-center justify-between py-2 hover:bg-secondary/50 -mx-2 px-2 rounded cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">{product.icon}</span>
              <span className="text-sm font-medium">{product.name}</span>
            </div>
            {product.badge && (
              <span className={`text-xs font-medium ${product.badgeColor}`}>
                {product.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsTools;
