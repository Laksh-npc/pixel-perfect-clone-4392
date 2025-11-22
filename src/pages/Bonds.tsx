import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type BondsTab = "open" | "applied";

interface Bond {
  id: string;
  company: string;
  logo: string;
  closingDate: string;
  rating: string;
  interest: string;
  status: string;
}

const Bonds = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BondsTab>("open");

  // Open Bonds data
  const openBonds: Bond[] = [
    {
      id: "1",
      company: "ICL Fincorp Limited NCD",
      logo: "ICL",
      closingDate: "28 Nov '25",
      rating: "BBB-",
      interest: "12.62%",
      status: "--",
    },
  ];

  const getCompanyLogo = (logo: string, company: string) => {
    // Generate a colorful square logo similar to the image (red, yellow, green, blue segments)
    return (
      <div className="w-10 h-10 rounded overflow-hidden grid grid-cols-2 grid-rows-2">
        <div className="bg-red-500"></div>
        <div className="bg-yellow-500"></div>
        <div className="bg-green-500"></div>
        <div className="bg-blue-500"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Header />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Corporate Bonds IPO
          </h1>
          <button className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <Info className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["open", "applied"] as BondsTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors border ${
                activeTab === tab
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "open" && (
          <>
            {/* Bonds Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a] mb-6">
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
                        Rating
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Interest up to
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {openBonds.map((bond) => (
                      <tr
                        key={bond.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {getCompanyLogo(bond.logo, bond.company)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {bond.company}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {bond.closingDate}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
                            {bond.rating}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-500">
                            {bond.interest}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                          {bond.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "applied" && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Active Applications
            </h2>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#1a1a1a] p-12">
              <div className="flex flex-col items-center justify-center">
                {/* Binoculars illustration - two binoculars side by side */}
                <div className="w-32 h-24 mb-4 flex items-center justify-center gap-2">
                  <svg
                    className="w-12 h-12 text-blue-400 dark:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <svg
                    className="w-12 h-12 text-blue-400 dark:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Currently, you have no active applications
                </p>
              </div>
            </div>
            <button className="text-sm text-primary hover:underline mt-4 border-b border-dashed border-primary pb-0.5">
              View past applications
            </button>
          </div>
        )}

        {/* FAQ Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#1a1a1a] overflow-hidden">
          <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            <AccordionItem value="item-1" className="border-b border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  What are corporate Bonds?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  It's a fixed-income investment where an investor lends money to a company for a set period in exchange for periodic interest payments and the return of the principal amount at maturity.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Where will I receive the interest payments?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interest payouts are credited to your demat linked bank account.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  When will I receive my principal amount back?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Principal amount is credited to the demat linked bank account on the maturity date of the Bond.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Can I sell Bonds before maturity?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, you can sell them before maturity in the secondary market, similar to stocks. However, there might not be any potential buyers, which could result in your sell order not getting executed.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-b border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  How are Bonds taxed?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>
                    <strong>Interest payouts:</strong> Interest payouts are taxed at applicable slab rates. Additionally, a TDS (Tax deducted at source) of 10% will be deducted before interest payment and the remaining amount will be credited to the demat linked bank account.
                  </p>
                  <p>
                    <strong>Capital gains:</strong> Short-term capital gains (STCG) are taxed at applicable slab rates if a Bond is redeemed before 12 months. Long-term capital gains (LTCG) are taxed at 12.5% without indexation if held for more than 12 months. Unlisted bonds are taxed at applicable slab rates irrespective of tenure.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-b border-gray-200 dark:border-gray-800">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Can I cancel my application?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, you can cancel your application before the closing date of the Bond IPO. Once the IPO closes, you cannot cancel your application.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-b-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Can I place multiple applications for the same Bond IPO?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, you can place multiple applications for the same Bond IPO using different demat accounts or different PAN numbers. However, each application will be processed separately.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Bonds;

