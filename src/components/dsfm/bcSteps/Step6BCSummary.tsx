import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { performBFSForBrandes, performDeltaAccumulation } from "@/services/dsfm/bcStepByStep";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Info } from "lucide-react";

interface Step6BCSummaryProps {
  networkGraph: NetworkGraph | null;
  correlationMatrix: CorrelationMatrix | null;
  loading: boolean;
}

const Step6BCSummary = ({ networkGraph, correlationMatrix, loading }: Step6BCSummaryProps) => {
  const [showAllSources, setShowAllSources] = useState(false);

  // Calculate BC summary for all source nodes
  const bcSummary = useMemo(() => {
    if (!networkGraph || !correlationMatrix) return [];

    const summary: Array<{
      source: string;
      reachableNodes: number;
      totalShortestPaths: number;
      bcContribution: number;
    }> = [];

    // For each source node, calculate BFS and delta accumulation
    correlationMatrix.symbols.forEach(source => {
      try {
        const bfsData = performBFSForBrandes(source, networkGraph, correlationMatrix);
        const deltaSteps = performDeltaAccumulation(bfsData, correlationMatrix);

        // Count total shortest paths (sum of all sigma values)
        const totalShortestPaths = Array.from(bfsData.sigma.values())
          .filter(sigma => sigma > 0)
          .reduce((sum, sigma) => sum + sigma, 0);

        // Sum delta contributions (this is the BC contribution from this source)
        const bcContribution = deltaSteps.reduce((sum, step) => sum + step.delta, 0);

        // Count reachable nodes
        const reachableNodes = Array.from(bfsData.dist.values())
          .filter(dist => dist >= 0).length;

        summary.push({
          source: source.replace('.NS', ''),
          reachableNodes,
          totalShortestPaths,
          bcContribution
        });
      } catch (error) {
        console.error(`Error processing source ${source}:`, error);
      }
    });

    return summary.sort((a, b) => b.bcContribution - a.bcContribution);
  }, [networkGraph, correlationMatrix]);

  // Get top 10 contributors
  const top10Contributors = useMemo(() => {
    return bcSummary.slice(0, 10);
  }, [bcSummary]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalSources: bcSummary.length,
      totalShortestPaths: bcSummary.reduce((sum, item) => sum + item.totalShortestPaths, 0),
      totalBCContribution: bcSummary.reduce((sum, item) => sum + item.bcContribution, 0)
    };
  }, [bcSummary]);

  if (loading || !networkGraph || !correlationMatrix) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Step 6: Betweenness Score Summary</h3>
        <p className="text-sm text-gray-500">Loading summary...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 6: Betweenness Score Summary</h3>
        <Card className="p-3 bg-blue-50 border-blue-200 mb-3">
          <div className="flex items-start gap-2">
            <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              Step-6 summarizes how many shortest paths originate from each source and how much that source 
              contributes to overall betweenness centrality. These values are later aggregated into final BC scores in Step-7.
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-blue-50 border-blue-200 rounded-lg shadow-sm">
          <div className="text-xs text-blue-600 font-medium mb-1">Total Sources</div>
          <div className="text-xl font-bold text-blue-900">{totals.totalSources}</div>
        </Card>
        <Card className="p-3 bg-purple-50 border-purple-200 rounded-lg shadow-sm">
          <div className="text-xs text-purple-600 font-medium mb-1">Total Shortest Paths</div>
          <div className="text-xl font-bold text-purple-900">
            {totals.totalShortestPaths.toLocaleString()}
          </div>
        </Card>
        <Card className="p-3 bg-pink-50 border-pink-200 rounded-lg shadow-sm">
          <div className="text-xs text-pink-600 font-medium mb-1">Total BC Contribution</div>
          <div className="text-xl font-bold text-pink-900">
            {totals.totalBCContribution.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Top 10 Contributors Table */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Top 10 Contributors to Betweenness Centrality</h4>
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">Source Node</TableHead>
                <TableHead className="text-right text-xs font-semibold">Reachable</TableHead>
                <TableHead className="text-right text-xs font-semibold">Σσ (Paths)</TableHead>
                <TableHead className="text-right text-xs font-semibold">Σδ (BC Contrib)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top10Contributors.map((item, idx) => (
                <TableRow key={item.source} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-xs">
                    {item.source}
                    {idx < 3 && <span className="ml-2 text-blue-600">★</span>}
                  </TableCell>
                  <TableCell className="text-right text-xs">{item.reachableNodes}</TableCell>
                  <TableCell className="text-right text-xs">{item.totalShortestPaths.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs">
                    <span className={idx < 3 ? 'font-semibold text-blue-600' : ''}>
                      {item.bcContribution.toFixed(4)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Expandable "Show All Sources" Section */}
      <Collapsible open={showAllSources} onOpenChange={setShowAllSources}>
        <CollapsibleTrigger className="w-full">
          <Card className="p-2 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showAllSources ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  Show All Sources ({bcSummary.length} total)
                </span>
              </div>
            </div>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 border rounded-lg shadow-sm">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Source Node</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Reachable</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Σσ (Paths)</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Σδ (BC Contrib)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bcSummary.map((item, idx) => (
                    <TableRow key={item.source} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-xs">{item.source}</TableCell>
                      <TableCell className="text-right text-xs">{item.reachableNodes}</TableCell>
                      <TableCell className="text-right text-xs">{item.totalShortestPaths.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">{item.bcContribution.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default Step6BCSummary;
