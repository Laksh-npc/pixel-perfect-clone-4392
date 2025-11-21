import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FundamentalsProps {
  stockDetails: any;
  corporateInfo: any;
}

const Fundamentals = ({ stockDetails, corporateInfo }: FundamentalsProps) => {
  const metadata = stockDetails?.metadata || {};
  const priceInfo = stockDetails?.priceInfo || {};
  const securityInfo = stockDetails?.securityInfo || {};
  const tradeInfo = stockDetails?.tradeInfo || corporateInfo?.tradeInfo || {};

  // Helper function to safely convert to number
  const toNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Extract fundamental data (these would come from corporate info or calculated)
  const marketCap = toNumber(tradeInfo?.totalMarketCap || tradeInfo?.tradeInfo?.totalMarketCap, 0);
  const peRatio = toNumber(metadata?.pdSymbolPe, 0);
  const pbRatio = 1.14; // Placeholder - would need to calculate from book value
  const industryPE = toNumber(metadata?.pdSectorPe, 0);
  const debtToEquity = 0.93; // Placeholder
  const roe = -1.12; // Placeholder
  const eps = 7.47; // Placeholder
  const dividendYield = 0.0;
  const bookValue = 36.14; // Placeholder
  const faceValue = toNumber(securityInfo?.faceValue, 10);

  const formatMarketCap = (cap: number) => {
    if (cap >= 100000) return `${(cap / 100000).toFixed(2)} L Cr`;
    if (cap >= 100) return `${(cap / 100).toFixed(2)} Cr`;
    return cap.toLocaleString("en-IN");
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 shadow-sm bg-card dark:bg-[#1a1a1a]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Fundamentals</CardTitle>
            <InfoIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <Button variant="link" className="text-primary text-sm p-0 h-auto font-normal">
            Understand Fundamentals <InfoIcon className="w-4 h-4 ml-1 inline" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Market Cap</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">₹{formatMarketCap(marketCap)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">P/E Ratio(TTM)</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{peRatio.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">P/B Ratio</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{pbRatio.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry P/E</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{industryPE.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Debt to Equity</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{debtToEquity.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROE</div>
            <div className={`text-sm font-medium ${roe < 0 ? "text-red-600 dark:text-red-500" : "text-gray-900 dark:text-white"}`}>
              {roe.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">EPS(TTM)</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{eps.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dividend Yield</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{dividendYield.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Book Value</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{bookValue.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Face Value</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{faceValue}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Fundamentals;

