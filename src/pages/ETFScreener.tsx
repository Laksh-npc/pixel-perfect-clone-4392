import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Generate mini line graph data points
const generateLineGraph = (changePct: number, isPositive: boolean) => {
  const points = 15;
  const data = [];
  const magnitude = Math.min(Math.abs(changePct) / 5, 1);
  
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 100;
    const progress = i / (points - 1);
    const baseY = 20;
    const variation = Math.sin(progress * Math.PI) * 2;
    const trend = isPositive 
      ? baseY - (progress * 10 * magnitude) - variation
      : baseY + (progress * 10 * magnitude) + variation;
    data.push({ x, y: Math.max(3, Math.min(27, trend)) });
  }
  return data;
};

interface ETF {
  id: string;
  company: string;
  logo: string;
  logoColor: string;
  marketPrice: number;
  priceChange: number;
  priceChangePercent: number;
  nav: number;
  navDelta: number;
  volume: number;
  returns1Y: number | null;
}

type SortColumn = "company" | "marketPrice" | "priceChange" | "navDelta" | "volume" | "returns1Y";
type SortDirection = "asc" | "desc" | null;

const ETFScreener = () => {
  const navigate = useNavigate();
  const [removeLowVol, setRemoveLowVol] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Gold", "Nifty 50"]);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Sample ETF data
  const etfs: ETF[] = [
    {
      id: "1",
      company: "Nippon India Gold BeES",
      logo: "NI",
      logoColor: "bg-red-500",
      marketPrice: 144.69,
      priceChange: -3.30,
      priceChangePercent: -2.23,
      nav: 144.69,
      navDelta: 0.00,
      volume: 35909272,
      returns1Y: 69.20,
    },
    {
      id: "2",
      company: "Tata Gold ETF",
      logo: "TG",
      logoColor: "bg-green-500",
      marketPrice: 102.45,
      priceChange: 0.45,
      priceChangePercent: 0.44,
      nav: 102.50,
      navDelta: -0.04,
      volume: 12345678,
      returns1Y: 65.30,
    },
    {
      id: "3",
      company: "Zerodha Gold ETF",
      logo: "Z",
      logoColor: "bg-gray-800",
      marketPrice: 98.20,
      priceChange: -1.20,
      priceChangePercent: -1.21,
      nav: 98.25,
      navDelta: -0.05,
      volume: 9876543,
      returns1Y: 62.10,
    },
    {
      id: "4",
      company: "ICICI Prudential Gold ETF",
      logo: "IP",
      logoColor: "bg-red-600",
      marketPrice: 105.30,
      priceChange: 0.30,
      priceChangePercent: 0.29,
      nav: 105.35,
      navDelta: -0.05,
      volume: 23456789,
      returns1Y: 68.50,
    },
    {
      id: "5",
      company: "Motilal Oswal Nifty 50 ETF",
      logo: "MO",
      logoColor: "bg-blue-500",
      marketPrice: 245.60,
      priceChange: 2.10,
      priceChangePercent: 0.86,
      nav: 245.50,
      navDelta: 0.04,
      volume: 45678901,
      returns1Y: 25.40,
    },
    {
      id: "6",
      company: "SBI Nifty 50 ETF",
      logo: "SBI",
      logoColor: "bg-blue-600",
      marketPrice: 248.90,
      priceChange: 1.80,
      priceChangePercent: 0.73,
      nav: 248.85,
      navDelta: 0.02,
      volume: 34567890,
      returns1Y: 24.80,
    },
    {
      id: "7",
      company: "HDFC Nifty 50 ETF",
      logo: "HDFC",
      logoColor: "bg-blue-700",
      marketPrice: 251.20,
      priceChange: 2.50,
      priceChangePercent: 1.01,
      nav: 251.15,
      navDelta: 0.02,
      volume: 56789012,
      returns1Y: 26.20,
    },
    {
      id: "8",
      company: "UTI Nifty 50 ETF",
      logo: "UTI",
      logoColor: "bg-indigo-500",
      marketPrice: 243.40,
      priceChange: 1.20,
      priceChangePercent: 0.50,
      nav: 243.35,
      navDelta: 0.02,
      volume: 23456789,
      returns1Y: 24.10,
    },
    {
      id: "9",
      company: "Kotak Nifty 50 ETF",
      logo: "K",
      logoColor: "bg-purple-500",
      marketPrice: 247.80,
      priceChange: 1.60,
      priceChangePercent: 0.65,
      nav: 247.75,
      navDelta: 0.02,
      volume: 12345678,
      returns1Y: 25.60,
    },
    {
      id: "10",
      company: "Axis Nifty 50 ETF",
      logo: "A",
      logoColor: "bg-orange-500",
      marketPrice: 250.10,
      priceChange: 2.20,
      priceChangePercent: 0.89,
      nav: 250.05,
      navDelta: 0.02,
      volume: 34567890,
      returns1Y: 25.90,
    },
  ];

  const categories = ["International", "Debt", "Gold", "Nifty 50"];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3 h-3 text-gray-900 dark:text-white" />;
    }
    return <ArrowDown className="w-3 h-3 text-gray-900 dark:text-white" />;
  };

  const sortedETFs = [...etfs].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: number;
    let bValue: number;

    switch (sortColumn) {
      case "company":
        return sortDirection === "asc"
          ? a.company.localeCompare(b.company)
          : b.company.localeCompare(a.company);
      case "marketPrice":
        aValue = a.marketPrice;
        bValue = b.marketPrice;
        break;
      case "priceChange":
        aValue = a.priceChange;
        bValue = b.priceChange;
        break;
      case "navDelta":
        aValue = a.navDelta;
        bValue = b.navDelta;
        break;
      case "volume":
        aValue = a.volume;
        bValue = b.volume;
        break;
      case "returns1Y":
        aValue = a.returns1Y ?? 0;
        bValue = b.returns1Y ?? 0;
        break;
      default:
        return 0;
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const getCompanyLogo = (logo: string, logoColor: string) => {
    return (
      <div className={cn("w-8 h-8 rounded flex items-center justify-center text-white text-xs font-semibold", logoColor)}>
        {logo}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Header />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Title Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              ETF Screener
            </h1>
            <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 dark:border-gray-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>

          <div className="flex items-center gap-2">
            <Switch
              id="remove-low-vol"
              checked={removeLowVol}
              onCheckedChange={setRemoveLowVol}
            />
            <Label htmlFor="remove-low-vol" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              Remove low vol
            </Label>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  selectedCategories.includes(category)
                    ? "bg-gray-900 dark:bg-gray-800 text-white"
                    : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedCategories([]);
              setRemoveLowVol(false);
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* ETF Table */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("company")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Company
                      {getSortIcon("company")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("marketPrice")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Market price
                      {getSortIcon("marketPrice")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("priceChange")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      1D price change
                      {getSortIcon("priceChange")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("navDelta")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      NAV/delta from mkt
                      {getSortIcon("navDelta")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("volume")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Today's volume
                      {getSortIcon("volume")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("returns1Y")}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      1Y returns
                      {getSortIcon("returns1Y")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {sortedETFs.map((etf) => {
                  const isPositive = etf.priceChange >= 0;
                  const lineData = generateLineGraph(etf.priceChangePercent, isPositive);
                  const navIsPositive = etf.navDelta >= 0;
                  const returnsIsPositive = etf.returns1Y !== null && etf.returns1Y >= 0;

                  return (
                    <tr
                      key={etf.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {getCompanyLogo(etf.logo, etf.logoColor)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {etf.company}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Mini Graph */}
                          <div className="w-20 h-8 flex-shrink-0 relative">
                            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id={`gradient-${etf.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
                                  <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <polyline
                                points={`0,30 ${lineData.map(d => `${d.x},${30 - d.y}`).join(" ")} 100,30`}
                                fill={`url(#gradient-${etf.id})`}
                                stroke="none"
                              />
                              <polyline
                                points={lineData.map(d => `${d.x},${30 - d.y}`).join(" ")}
                                fill="none"
                                stroke={isPositive ? "#10b981" : "#ef4444"}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            ₹{etf.marketPrice.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isPositive
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {isPositive ? "+" : ""}
                          {etf.priceChange.toFixed(2)} ({isPositive ? "+" : ""}
                          {etf.priceChangePercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ₹{etf.nav.toFixed(2)}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              navIsPositive
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {navIsPositive ? "+" : ""}
                            {etf.navDelta.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {etf.volume.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {etf.returns1Y !== null ? (
                          <span
                            className={cn(
                              "text-sm font-medium",
                              returnsIsPositive
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {returnsIsPositive ? "+" : ""}
                            {etf.returns1Y.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ETFScreener;

