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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Fundamentals</CardTitle>
          </div>
          <Button variant="link" className="text-primary text-sm">
            Understand Fundamentals <InfoIcon className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Market Cap</div>
            <div className="font-medium">₹{formatMarketCap(marketCap)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">P/E Ratio(TTM)</div>
            <div className="font-medium">{peRatio.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">P/B Ratio</div>
            <div className="font-medium">{pbRatio.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Industry P/E</div>
            <div className="font-medium">{industryPE.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Debt to Equity</div>
            <div className="font-medium">{debtToEquity.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">ROE</div>
            <div className={`font-medium ${roe < 0 ? "text-red-600" : ""}`}>
              {roe.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">EPS(TTM)</div>
            <div className="font-medium">{eps.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Dividend Yield</div>
            <div className="font-medium">{dividendYield.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Book Value</div>
            <div className="font-medium">{bookValue.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Face Value</div>
            <div className="font-medium">{faceValue}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Fundamentals;

