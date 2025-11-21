import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface PerformanceMetricsProps {
  priceInfo: any;
  securityInfo: any;
  tradeInfo?: any;
}

const PerformanceMetrics = ({ priceInfo, securityInfo, tradeInfo }: PerformanceMetricsProps) => {
  const todayLow = priceInfo?.intraDayHighLow?.min || 0;
  const todayHigh = priceInfo?.intraDayHighLow?.max || 0;
  const currentPrice = priceInfo?.lastPrice || 0;
  const open = priceInfo?.open || 0;
  const previousClose = priceInfo?.previousClose || 0;
  
  const week52Low = priceInfo?.weekHighLow?.min || 0;
  const week52High = priceInfo?.weekHighLow?.max || 0;
  
  const volume = priceInfo?.totalTradedVolume || tradeInfo?.tradeInfo?.totalTradedVolume || 0;
  const totalTradedValue = tradeInfo?.tradeInfo?.totalTradedValue || 0;
  
  // Ensure upperCircuit and lowerCircuit are numbers
  const upperCircuit = typeof priceInfo?.upperCP === 'number' ? priceInfo.upperCP : (typeof priceInfo?.upperCP === 'string' ? parseFloat(priceInfo.upperCP) : 0);
  const lowerCircuit = typeof priceInfo?.lowerCP === 'number' ? priceInfo.lowerCP : (typeof priceInfo?.lowerCP === 'string' ? parseFloat(priceInfo.lowerCP) : 0);
  
  // Ensure all numeric values are properly converted
  const safeToFixed = (value: any, decimals: number = 2): string => {
    const num = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  // Calculate position of current price within range
  const todayRange = todayHigh - todayLow;
  const todayPosition = todayRange > 0 ? ((currentPrice - todayLow) / todayRange) * 100 : 50;
  
  const week52Range = week52High - week52Low;
  const week52Position = week52Range > 0 ? ((currentPrice - week52Low) / week52Range) * 100 : 50;

  const formatVolume = (vol: number) => {
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
    return vol.toLocaleString("en-IN");
  };

  const formatValue = (val: number) => {
    if (val >= 100000000000) return `${(val / 100000000000).toFixed(2)} L Cr`;
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    return val.toLocaleString("en-IN");
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 shadow-sm bg-card dark:bg-[#1a1a1a]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Performance</CardTitle>
          <InfoIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {/* Today's Low/High - Match Groww style */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Today&apos;s Low</span>
            <span className="font-medium text-gray-900 dark:text-white">{safeToFixed(todayLow)}</span>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
            <div
              className="absolute h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
              style={{ width: `${todayPosition}%` }}
            />
            <div
              className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-gray-700 dark:border-t-gray-500"
              style={{ left: `calc(${todayPosition}% - 6px)`, top: "-6px" }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Today&apos;s High</span>
            <span className="font-medium text-gray-900 dark:text-white">{safeToFixed(todayHigh)}</span>
          </div>
        </div>

        {/* 52 Week Low/High - Match Groww style */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">52W Low</span>
            <span className="font-medium text-gray-900 dark:text-white">{safeToFixed(week52Low)}</span>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
            <div
              className="absolute h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
              style={{ width: `${week52Position}%` }}
            />
            <div
              className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-gray-700 dark:border-t-gray-500"
              style={{ left: `calc(${week52Position}% - 6px)`, top: "-6px" }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">52W High</span>
            <span className="font-medium text-gray-900 dark:text-white">{safeToFixed(week52High)}</span>
          </div>
        </div>

        {/* Other Metrics - Match Groww style */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Open</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{safeToFixed(open)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prev. Close</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{safeToFixed(previousClose)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volume</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{formatVolume(volume)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total traded value</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{formatValue(totalTradedValue)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Upper Circuit</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{safeToFixed(upperCircuit)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lower Circuit</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{safeToFixed(lowerCircuit)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;

