import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AboutCompanyProps {
  stockDetails: any;
  corporateInfo: any;
}

const AboutCompany = ({ stockDetails, corporateInfo }: AboutCompanyProps) => {
  const [expanded, setExpanded] = useState(false);

  const info = stockDetails?.info || {};
  const metadata = stockDetails?.metadata || {};

  // Mock company description - in production, this would come from corporate info
  const fullDescription = `${
    info.companyName || "This company"
  } is a leading private power generation company in India, operating a diverse portfolio of thermal, solar, and hydroelectric projects to build the nation's energy infrastructure. The company operates with a dual commitment: sustaining essential energy infrastructure while actively shifting towards scalable, renewable energy solutions. Through strategic investments and innovative technologies, the company aims to contribute significantly to India's energy security and sustainable development goals.`;

  const shortDescription = fullDescription.substring(0, 200);
  const shouldTruncate = fullDescription.length > 200;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About {info.companyName || "Company"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {expanded || !shouldTruncate ? fullDescription : `${shortDescription}...`}
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-primary hover:underline ml-1"
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </p>

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Parent Organisation</span>
            <span className="text-sm font-medium">{info.companyName || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Managing Director</span>
            <span className="text-sm font-medium">N/A</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">NSE Symbol</span>
            <span className="text-sm font-medium">{info.symbol || metadata.symbol || "N/A"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutCompany;

