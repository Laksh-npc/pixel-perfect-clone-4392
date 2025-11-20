import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHoldings, Holding } from "@/hooks/useHoldings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, MoreVertical, Eye } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { api } from "@/services/api";

interface HoldingsViewProps {
  onStockSelect?: (symbol: string) => void;
}

const HoldingsView = ({ onStockSelect }: HoldingsViewProps) => {
  const { holdings, loading, getPortfolioSummary } = useHoldings();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [priceData, setPriceData] = useState<Record<string, any[]>>({});

  const summary = getPortfolioSummary();

  // Generate mini chart data (simplified for performance)
  useEffect(() => {
    const generateChartData = () => {
      const data: Record<string, any[]> = {};
      for (const holding of holdings) {
        const currentPrice = holding.currentPrice || holding.avgPrice || 100;
        // Generate simple trend data
        const points = 20;
        const chartPoints = [];
        for (let i = 0; i < points; i++) {
          const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
          chartPoints.push({
            price: currentPrice * (1 + variation * (points - i) / points),
          });
        }
        data[holding.symbol] = chartPoints;
      }
      setPriceData(data);
    };

    if (holdings.length > 0) {
      generateChartData();
    }
  }, [holdings]);

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toLocaleString("en-IN", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getCompanyLogo = (name: string) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleStockClick = (symbol: string) => {
    if (onStockSelect) {
      onStockSelect(symbol);
    } else {
      navigate(`/stock/${symbol}`);
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Holdings (0)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 text-center py-8">No holdings yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <CardTitle className="text-base font-semibold text-gray-900">
              Holdings ({holdings.length})
            </CardTitle>
            <ChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "" : "-rotate-90"}`} 
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Portfolio Summary - Match Groww style */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current value</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(summary.currentValue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Invested value</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(summary.investedAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">1D returns</span>
            <span className={`text-sm font-semibold ${summary.oneDayReturns >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.oneDayReturns >= 0 ? "+" : ""}{formatCurrency(summary.oneDayReturns)} ({formatPercent(summary.oneDayReturnsPercent)})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total returns</span>
            <span className={`text-sm font-semibold ${summary.totalReturns >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.totalReturns >= 0 ? "+" : ""}{formatCurrency(summary.totalReturns)} ({formatPercent(summary.totalReturnsPercent)})
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 h-9 text-sm">
              Analyse
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">Company</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">
                    Market price (1D%) <span className="text-gray-400">▼</span>
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">
                    Returns (%) <span className="text-gray-400">▼</span>
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">
                    Current (Invested) <span className="text-gray-400">▼</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => {
                  const isPositive = (holding.oneDayChangePercent || 0) >= 0;
                  const returnsPositive = (holding.returnsPercent || 0) >= 0;
                  const chartData = priceData[holding.symbol] || [];
                  const oneDayChange = holding.oneDayChange || 0;
                  const oneDayChangePercent = holding.oneDayChangePercent || 0;

                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleStockClick(holding.symbol)}
                    >
                      <td className="py-4 px-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {getCompanyLogo(holding.companyName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {holding.companyName}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {holding.shares} shares • Avg. {formatCurrency(holding.avgPrice)}
                            </div>
                            {chartData.length > 0 && (
                              <div className="w-24 h-6 mt-1">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Line
                                      type="monotone"
                                      dataKey="price"
                                      stroke={isPositive ? "#10b981" : "#ef4444"}
                                      strokeWidth={1.5}
                                      dot={false}
                                      isAnimationActive={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {formatCurrency(holding.currentPrice || 0)}
                        </div>
                        <div className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {oneDayChange >= 0 ? "+" : ""}{formatCurrency(oneDayChange)} ({oneDayChangePercent >= 0 ? "+" : ""}{oneDayChangePercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className={`text-sm font-medium mb-1 ${returnsPositive ? "text-green-600" : "text-red-600"}`}>
                          {returnsPositive ? "+" : ""}{formatCurrency(holding.returns || 0)}
                        </div>
                        <div className={`text-xs font-medium ${returnsPositive ? "text-green-600" : "text-red-600"}`}>
                          {formatPercent(holding.returnsPercent || 0)}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {formatCurrency(holding.currentValue || 0)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(holding.investedAmount)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default HoldingsView;

