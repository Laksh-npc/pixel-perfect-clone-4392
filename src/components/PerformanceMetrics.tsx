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
  const upperCircuit = priceInfo?.upperCP || 0;
  const lowerCircuit = priceInfo?.lowerCP || 0;

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
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">Performance</CardTitle>
          <InfoIcon className="w-4 h-4 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Low/High */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today&apos;s Low</span>
            <span className="font-medium">{todayLow.toFixed(2)}</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full">
            <div
              className="absolute h-2 bg-primary rounded-full"
              style={{ width: `${todayPosition}%` }}
            />
            <div
              className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-foreground"
              style={{ left: `calc(${todayPosition}% - 6px)`, top: "-6px" }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today&apos;s High</span>
            <span className="font-medium">{todayHigh.toFixed(2)}</span>
          </div>
        </div>

        {/* 52 Week Low/High */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">52W Low</span>
            <span className="font-medium">{week52Low.toFixed(2)}</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full">
            <div
              className="absolute h-2 bg-primary rounded-full"
              style={{ width: `${week52Position}%` }}
            />
            <div
              className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-foreground"
              style={{ left: `calc(${week52Position}% - 6px)`, top: "-6px" }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">52W High</span>
            <span className="font-medium">{week52High.toFixed(2)}</span>
          </div>
        </div>

        {/* Other Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Open</div>
            <div className="font-medium">{open.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Prev. Close</div>
            <div className="font-medium">{previousClose.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Volume</div>
            <div className="font-medium">{formatVolume(volume)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total traded value</div>
            <div className="font-medium">{formatValue(totalTradedValue)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Upper Circuit</div>
            <div className="font-medium">{upperCircuit}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Lower Circuit</div>
            <div className="font-medium">{lowerCircuit}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;

