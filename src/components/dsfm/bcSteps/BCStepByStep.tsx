import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StockData } from "@/services/dsfm/dataFetcher";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import Step1PriceReturns from "./Step1PriceReturns";
import Step2CorrelationMatrix from "./Step2CorrelationMatrix";
import Step3DistanceTransformation from "./Step3DistanceTransformation";
import Step4GraphConstruction from "./Step4GraphConstruction";
import Step5ShortestPath from "./Step5ShortestPath";
import Step6BCSummary from "./Step6BCSummary";
import Step7FinalBC from "./Step7FinalBC";

interface BCStepByStepProps {
  stockData: StockData[];
  correlationMatrix: CorrelationMatrix | null;
  networkGraph: NetworkGraph | null;
  sectorMap: Map<string, string>;
  loading: boolean;
}

const BCStepByStep = ({
  stockData,
  correlationMatrix,
  networkGraph,
  sectorMap,
  loading
}: BCStepByStepProps) => {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([0])); // Step 1 open by default

  const toggleStep = (step: number) => {
    setOpenSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(step)) {
        newSet.delete(step);
      } else {
        newSet.add(step);
      }
      return newSet;
    });
  };

  const steps = [
    {
      number: 1,
      title: "Price & Returns Visualization",
      description: "Fetch NIFTY50 price data, compute log returns, and visualize prices and return distributions"
    },
    {
      number: 2,
      title: "Correlation Matrix Explainer",
      description: "Compute Pearson correlation matrix and visualize relationships between stocks"
    },
    {
      number: 3,
      title: "Correlation → Distance Transformation",
      description: "Convert correlation to distance using d = √(2×(1-corr))"
    },
    {
      number: 4,
      title: "Graph Construction",
      description: "Build network graph using threshold-based edge construction"
    },
    {
      number: 5,
      title: "Shortest Path Explainer (Brandes BFS Phase)",
      description: "Visualize BFS tree and shortest paths for a selected source"
    },
    {
      number: 6,
      title: "Betweenness Score Summary",
      description: "Summary of shortest paths and BC contributions for each source node"
    },
    {
      number: 7,
      title: "Final Betweenness Centrality",
      description: "Final BC rankings and interpretation"
    }
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Betweenness Centrality: Step-by-Step Educational Module
        </h2>
        <p className="text-sm text-gray-700">
          This interactive module demonstrates how betweenness centrality is computed from raw price data
          through to final network interpretation. Each step is collapsible for focused learning.
        </p>
      </Card>

      {steps.map((step, idx) => (
        <Collapsible
          key={step.number}
          open={openSteps.has(idx)}
          onOpenChange={() => toggleStep(idx)}
        >
          <CollapsibleTrigger className="w-full">
            <Card className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {openSteps.has(idx) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-left">
                      Step {step.number}: {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 text-left mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Step {step.number}/7
                </div>
              </div>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2 border-t-4 border-blue-500">
              {step.number === 1 && (
                <Step1PriceReturns stockData={stockData} loading={loading} />
              )}
              {step.number === 2 && (
                <Step2CorrelationMatrix 
                  correlationMatrix={correlationMatrix} 
                  stockData={stockData}
                  loading={loading} 
                />
              )}
              {step.number === 3 && (
                <Step3DistanceTransformation 
                  correlationMatrix={correlationMatrix} 
                  loading={loading} 
                />
              )}
              {step.number === 4 && (
                <Step4GraphConstruction 
                  correlationMatrix={correlationMatrix}
                  sectorMap={sectorMap}
                  loading={loading} 
                />
              )}
              {step.number === 5 && (
                <Step5ShortestPath 
                  networkGraph={networkGraph}
                  correlationMatrix={correlationMatrix}
                  loading={loading} 
                />
              )}
              {step.number === 6 && (
                <Step6BCSummary 
                  networkGraph={networkGraph}
                  correlationMatrix={correlationMatrix}
                  loading={loading} 
                />
              )}
              {step.number === 7 && (
                <Step7FinalBC 
                  networkGraph={networkGraph}
                  loading={loading} 
                />
              )}
            </Card>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default BCStepByStep;
