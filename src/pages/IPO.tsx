import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, CheckCircle2, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IPOTab = "open" | "closed" | "upcoming" | "applied";

interface OpenIPO {
  id: string;
  company: string;
  logo: string;
  closingDate: string;
  subscription: string;
  buttonType: "apply" | "pre-apply";
}

interface ClosedIPO {
  id: string;
  company: string;
  logo: string;
  listingDate: string;
  listingReturns: string | null;
  isPositive: boolean;
  subscription: string;
  hasAllotment: boolean;
}

interface UpcomingIPO {
  id: string;
  company: string;
  logo: string;
  openingDate: string;
  hasIPODoc: boolean;
}

const IPO = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<IPOTab>("open");
  const [selectedIPO, setSelectedIPO] = useState<string | null>(null);
  const [ipoType, setIpoType] = useState("all");

  // Open IPOs data
  const openIPOs: OpenIPO[] = [
    {
      id: "1",
      company: "Sudeep Pharma",
      logo: "SP",
      closingDate: "25 Nov",
      subscription: "1.42x",
      buttonType: "apply",
    },
    {
      id: "2",
      company: "SME SSMD Agrotech",
      logo: "HOM",
      closingDate: "26 Nov",
      subscription: "--",
      buttonType: "pre-apply",
    },
    {
      id: "3",
      company: "SME K K Silk Mills",
      logo: "KK",
      closingDate: "28 Nov",
      subscription: "--",
      buttonType: "pre-apply",
    },
    {
      id: "4",
      company: "SME Mother Nutri Foods",
      logo: "MNF",
      closingDate: "28 Nov",
      subscription: "--",
      buttonType: "pre-apply",
    },
  ];

  // Closed IPOs data
  const closedIPOs: ClosedIPO[] = [
    {
      id: "1",
      company: "Excelsoft Technologies",
      logo: "ET",
      listingDate: "26 Nov",
      listingReturns: null,
      isPositive: false,
      subscription: "42.83x",
      hasAllotment: true,
    },
    {
      id: "2",
      company: "SME Gallard Steel",
      logo: "GS",
      listingDate: "26 Nov",
      listingReturns: null,
      isPositive: false,
      subscription: "346.00x",
      hasAllotment: true,
    },
    {
      id: "3",
      company: "Capillary Technologies",
      logo: "CT",
      listingDate: "21 Nov",
      listingReturns: "-0.88%",
      isPositive: false,
      subscription: "51.75x",
      hasAllotment: false,
    },
    {
      id: "4",
      company: "Fujiyama Power",
      logo: "FP",
      listingDate: "20 Nov",
      listingReturns: "-3.51%",
      isPositive: false,
      subscription: "2.02x",
      hasAllotment: true,
    },
    {
      id: "5",
      company: "Tenneco Clean Air",
      logo: "TCA",
      listingDate: "19 Nov",
      listingReturns: "+27.20%",
      isPositive: true,
      subscription: "53.81x",
      hasAllotment: true,
    },
    {
      id: "6",
      company: "SME Mahamaya Lifesciences",
      logo: "ML",
      listingDate: "18 Nov",
      listingReturns: "+1.75%",
      isPositive: true,
      subscription: "1.57x",
      hasAllotment: true,
    },
    {
      id: "7",
      company: "EMMVEE Emmvee Photovoltaic",
      logo: "EP",
      listingDate: "18 Nov",
      listingReturns: "+0.00%",
      isPositive: true,
      subscription: "0.96x",
      hasAllotment: true,
    },
    {
      id: "8",
      company: "PhysicsWallah",
      logo: "PW",
      listingDate: "18 Nov",
      listingReturns: "+33.03%",
      isPositive: true,
      subscription: "1.80x",
      hasAllotment: true,
    },
    {
      id: "9",
      company: "SME Workmates Core2Cloud",
      logo: "WC",
      listingDate: "18 Nov",
      listingReturns: "+90.00%",
      isPositive: true,
      subscription: "130.20x",
      hasAllotment: true,
    },
    {
      id: "10",
      company: "Pine Labs",
      logo: "PL",
      listingDate: "14 Nov",
      listingReturns: "+9.50%",
      isPositive: true,
      subscription: "2.44x",
      hasAllotment: true,
    },
    {
      id: "11",
      company: "SME Curis Lifesciences",
      logo: "CL",
      listingDate: "14 Nov",
      listingReturns: "+14.14%",
      isPositive: true,
      subscription: "51.48x",
      hasAllotment: true,
    },
  ];

  // Upcoming IPOs data
  const upcomingIPOs: UpcomingIPO[] = [
    {
      id: "1",
      company: "InCred Holdings",
      logo: "IH",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
    {
      id: "2",
      company: "Meesho",
      logo: "M",
      openingDate: "To be announced",
      hasIPODoc: true,
    },
    {
      id: "3",
      company: "Hero Fincorp",
      logo: "HF",
      openingDate: "To be announced",
      hasIPODoc: true,
    },
    {
      id: "4",
      company: "Allchem Lifescience",
      logo: "AL",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
    {
      id: "5",
      company: "Juniper Green Energy",
      logo: "JG",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
    {
      id: "6",
      company: "CarDekho",
      logo: "CD",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
    {
      id: "7",
      company: "Haldiram's Snacks Foods",
      logo: "HS",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
    {
      id: "8",
      company: "Amagi Media Labs",
      logo: "AM",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
    {
      id: "9",
      company: "Prestige Hospitality",
      logo: "PH",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
    {
      id: "10",
      company: "Fractal Analytics",
      logo: "FA",
      openingDate: "To be announced",
      hasIPODoc: true,
    },
    {
      id: "11",
      company: "ICICI Prudential AMC",
      logo: "IP",
      openingDate: "To be announced",
      hasIPODoc: false,
    },
  ];

  const getTitle = () => {
    switch (activeTab) {
      case "open":
        return "IPO - Initial Public Offering";
      case "closed":
        return "Closed & Listed IPO";
      case "upcoming":
        return "Upcoming IPOs in 2025";
      case "applied":
        return "Applied IPOs";
      default:
        return "IPO - Initial Public Offering";
    }
  };

  const getCompanyLogo = (logo: string, company: string) => {
    // Generate a simple colored circle logo
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const colorIndex = company.charCodeAt(0) % colors.length;
    return (
      <div
        className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-semibold`}
      >
        {logo.substring(0, 2)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Header />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - IPO List */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              {getTitle()}
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(["open", "closed", "upcoming", "applied"] as IPOTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors border ${
                      activeTab === tab
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* Info Banner (only for Open tab) */}
            {activeTab === "open" && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 mb-4 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Regulatory changes to SME IPOs
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            )}

            {/* Filter */}
            <div className="mb-4">
              <Select value={ipoType} onValueChange={setIpoType}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-700 text-sm">
                  <SelectValue>
                    <span className="text-gray-600 dark:text-gray-400">IPO type: </span>
                    <span className="text-gray-900 dark:text-white capitalize">{ipoType === "all" ? "All" : ipoType === "main" ? "Main Board" : "SME"}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="main">Main Board</SelectItem>
                  <SelectItem value="sme">SME</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IPO Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a]">
              {activeTab === "open" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Closing date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Overall subscription
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {openIPOs.map((ipo) => (
                        <tr
                          key={ipo.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedIPO(ipo.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {getCompanyLogo(ipo.logo, ipo.company)}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {ipo.company}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {ipo.closingDate}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {ipo.subscription}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              className={
                                ipo.buttonType === "apply"
                                  ? "bg-green-600 hover:bg-green-700 text-white border-0"
                                  : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border-0"
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle apply/pre-apply
                              }}
                            >
                              {ipo.buttonType === "apply"
                                ? "Apply"
                                : "Pre-apply"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "closed" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Listing date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Listing returns
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Overall Subscription
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Allotment Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {closedIPOs.map((ipo) => (
                        <tr
                          key={ipo.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedIPO(ipo.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {getCompanyLogo(ipo.logo, ipo.company)}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {ipo.company}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {ipo.listingDate}
                          </td>
                          <td className="px-4 py-3">
                            {ipo.listingReturns ? (
                              <span
                                className={`text-sm font-medium ${
                                  ipo.isPositive
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {ipo.listingReturns}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                --
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {ipo.subscription}
                          </td>
                          <td className="px-4 py-3">
                            {ipo.hasAllotment ? (
                              <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                                <CheckCircle2 className="w-4 h-4" />
                                Check allotment status
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                --
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "upcoming" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Opening date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {upcomingIPOs.map((ipo) => (
                        <tr
                          key={ipo.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedIPO(ipo.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {getCompanyLogo(ipo.logo, ipo.company)}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {ipo.company}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {ipo.openingDate}
                              </span>
                              {ipo.hasIPODoc && (
                                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                                  IPO Doc
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "applied" && (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No applied IPOs yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - IPO Details */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#1a1a1a] p-8">
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                {/* Graphic matching the image - list with arrow */}
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <div className="relative">
                    {/* List items */}
                    <div className="space-y-2">
                      <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-32 h-8 bg-blue-500 dark:bg-blue-600 rounded relative">
                        {/* Arrow pointing to selected item */}
                        <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                          <svg
                            className="w-6 h-6 text-blue-500 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
                  Select an IPO to view details or click on "Apply" to apply for
                  IPO
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default IPO;

