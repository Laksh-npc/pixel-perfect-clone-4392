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
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">About {info.companyName || "Company"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-gray-600 leading-relaxed">
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

        <div className="pt-4 border-t border-gray-200 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Parent Organisation</span>
            <span className="text-sm font-medium text-gray-900">{info.companyName || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">NSE Symbol</span>
            <span className="text-sm font-medium text-gray-900">{info.symbol || metadata.symbol || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Managing Director</span>
            <span className="text-sm font-medium text-gray-900">Mr. Ravinder Takkar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutCompany;

