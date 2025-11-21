import { useHoldings } from "@/hooks/useHoldings";
import { useNavigate } from "react-router-dom";
import { VisibilityValue } from "@/hooks/useVisibility";

const InvestmentSummary = () => {
  const { getPortfolioSummary, loading } = useHoldings();
  const navigate = useNavigate();
  const summary = getPortfolioSummary();

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toLocaleString("en-IN", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "" : ""}${value.toFixed(2)}%`;
  };

  const oneDayPositive = summary.oneDayReturns >= 0;
  const totalReturnsPositive = summary.totalReturns >= 0;

  return (
    <div 
      className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-white dark:bg-[#1a1a1a] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/holdings")}
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Your investments</h3>
      <div className="space-y-3">
        {/* Current Value */}
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current</div>
          <VisibilityValue 
            value={formatCurrency(summary.currentValue)}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          />
        </div>

        {/* 1D Returns */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">1D returns</div>
          <div className={`text-sm font-medium ${oneDayPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
            <VisibilityValue 
              value={`${oneDayPositive ? "+" : ""}${formatCurrency(summary.oneDayReturns)} (${oneDayPositive ? "+" : ""}${formatPercent(summary.oneDayReturnsPercent)})`}
              placeholder="••••••"
            />
          </div>
        </div>

        {/* Total Returns */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total returns</div>
          <div className={`text-sm font-medium ${totalReturnsPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
            <VisibilityValue 
              value={`${totalReturnsPositive ? "+" : ""}${formatCurrency(summary.totalReturns)} (${totalReturnsPositive ? "+" : ""}${formatPercent(summary.totalReturnsPercent)})`}
              placeholder="••••••"
            />
          </div>
        </div>

        {/* Invested Amount */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">Invested</div>
          <VisibilityValue 
            value={formatCurrency(summary.investedAmount)}
            className="text-sm font-medium text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummary;
