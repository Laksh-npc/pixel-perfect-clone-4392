import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FinancialsProps {
  corporateInfo: any;
}

const Financials = ({ corporateInfo }: FinancialsProps) => {
  const [selectedTab, setSelectedTab] = useState<"Revenue" | "Profit" | "Net Worth">("Revenue");
  const [timePeriod, setTimePeriod] = useState<"Quarterly" | "Yearly">("Quarterly");

  // Mock financial data - in production, this would come from corporateInfo
  const quarterlyRevenue = [
    { quarter: "Jun '24", value: 2069 },
    { quarter: "Sep '24", value: 1963 },
    { quarter: "Dec '24", value: 2159 },
    { quarter: "Mar '25", value: 2066 },
    { quarter: "Jun '25", value: 2025 },
  ];

  const yearlyRevenue = [
    { quarter: "FY 2021", value: 7500 },
    { quarter: "FY 2022", value: 8200 },
    { quarter: "FY 2023", value: 8900 },
    { quarter: "FY 2024", value: 9500 },
    { quarter: "FY 2025", value: 10200 },
  ];

  const quarterlyProfit = [
    { quarter: "Jun '24", value: 450 },
    { quarter: "Sep '24", value: 380 },
    { quarter: "Dec '24", value: 520 },
    { quarter: "Mar '25", value: 480 },
    { quarter: "Jun '25", value: 420 },
  ];

  const yearlyProfit = [
    { quarter: "FY 2021", value: 1800 },
    { quarter: "FY 2022", value: 2100 },
    { quarter: "FY 2023", value: 2400 },
    { quarter: "FY 2024", value: 2700 },
    { quarter: "FY 2025", value: 3000 },
  ];

  const quarterlyNetWorth = [
    { quarter: "Jun '24", value: 15000 },
    { quarter: "Sep '24", value: 15200 },
    { quarter: "Dec '24", value: 15450 },
    { quarter: "Mar '25", value: 15600 },
    { quarter: "Jun '25", value: 15750 },
  ];

  const yearlyNetWorth = [
    { quarter: "FY 2021", value: 12000 },
    { quarter: "FY 2022", value: 13000 },
    { quarter: "FY 2023", value: 14000 },
    { quarter: "FY 2024", value: 15000 },
    { quarter: "FY 2025", value: 16000 },
  ];

  const getChartData = () => {
    const isYearly = timePeriod === "Yearly";
    switch (selectedTab) {
      case "Revenue":
        return isYearly ? yearlyRevenue : quarterlyRevenue;
      case "Profit":
        return isYearly ? yearlyProfit : quarterlyProfit;
      case "Net Worth":
        return isYearly ? yearlyNetWorth : quarterlyNetWorth;
      default:
        return isYearly ? yearlyRevenue : quarterlyRevenue;
    }
  };

  const formatValue = (value: number) => {
    return `${(value / 100).toFixed(0)} Cr`;
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 shadow-sm bg-card dark:bg-[#1a1a1a]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Financials</CardTitle>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">*All values are in Rs. Cr</p>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 h-10 bg-transparent p-0 border-b border-gray-200 dark:border-gray-800 rounded-none">
            <TabsTrigger value="Revenue" className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 rounded-none text-gray-600 dark:text-gray-400">Revenue</TabsTrigger>
            <TabsTrigger value="Profit" className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 rounded-none text-gray-600 dark:text-gray-400">Profit</TabsTrigger>
            <TabsTrigger value="Net Worth" className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-500 rounded-none text-gray-600 dark:text-gray-400">Net Worth</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="quarter"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickFormatter={(value) => formatValue(value)}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`₹${formatValue(value)}`, selectedTab]}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <Button
                  variant={timePeriod === "Quarterly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimePeriod("Quarterly")}
                  className={timePeriod === "Quarterly" ? "bg-green-500 hover:bg-green-600 text-white border-0" : ""}
                >
                  Quarterly
                </Button>
                <Button
                  variant={timePeriod === "Yearly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimePeriod("Yearly")}
                  className={timePeriod === "Yearly" ? "bg-green-500 hover:bg-green-600 text-white border-0" : ""}
                >
                  Yearly
                </Button>
              </div>
              <Button variant="link" className="text-primary text-sm p-0 h-auto font-normal">
                See Details
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Financials;

