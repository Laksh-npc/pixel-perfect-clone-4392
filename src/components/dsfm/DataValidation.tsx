import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { StockData } from "@/services/dsfm/dataFetcher";
import { CorrelationMatrix } from "@/services/dsfm/correlationEngine";
import { NetworkGraph } from "@/services/dsfm/networkEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataValidationProps {
  stockData: StockData[];
  correlationMatrix: CorrelationMatrix | null;
  networkGraph: NetworkGraph | null;
  timeRange: string;
}

const DataValidation = ({
  stockData,
  correlationMatrix,
  networkGraph,
  timeRange
}: DataValidationProps) => {
  const validateData = () => {
    const issues: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // 1. Check stock data
    if (stockData.length === 0) {
      issues.push("No stock data available");
      return { issues, warnings, info };
    }

    info.push(`Total stocks loaded: ${stockData.length}`);

    // 2. Check data completeness
    const stocksWithInsufficientData = stockData.filter(
      stock => stock.returns.length < 10
    );
    if (stocksWithInsufficientData.length > 0) {
      warnings.push(
        `${stocksWithInsufficientData.length} stocks have less than 10 data points`
      );
    }

    // 3. Check return series length consistency
    const returnLengths = stockData.map(s => s.returns.length);
    const minLength = Math.min(...returnLengths);
    const maxLength = Math.max(...returnLengths);
    if (maxLength - minLength > 5) {
      warnings.push(
        `Return series length varies significantly: min=${minLength}, max=${maxLength}`
      );
    }
    info.push(`Return series length: ${minLength}-${maxLength} data points`);

    // 4. Check correlation matrix
    if (!correlationMatrix) {
      issues.push("Correlation matrix not computed");
      return { issues, warnings, info };
    }

    // Check for NaN or invalid correlations
    let invalidCorrelations = 0;
    for (let i = 0; i < correlationMatrix.matrix.length; i++) {
      for (let j = 0; j < correlationMatrix.matrix[i].length; j++) {
        const corr = correlationMatrix.matrix[i][j];
        if (isNaN(corr) || !isFinite(corr) || corr < -1 || corr > 1) {
          invalidCorrelations++;
        }
      }
    }
    if (invalidCorrelations > 0) {
      issues.push(`${invalidCorrelations} invalid correlation values found`);
    }

    // Check diagonal (should be 1.0)
    let diagonalIssues = 0;
    for (let i = 0; i < correlationMatrix.matrix.length; i++) {
      if (Math.abs(correlationMatrix.matrix[i][i] - 1.0) > 0.01) {
        diagonalIssues++;
      }
    }
    if (diagonalIssues > 0) {
      issues.push(`${diagonalIssues} diagonal values are not 1.0`);
    }

    // Check symmetry (should be symmetric)
    let symmetryIssues = 0;
    for (let i = 0; i < correlationMatrix.matrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix.matrix.length; j++) {
        const diff = Math.abs(
          correlationMatrix.matrix[i][j] - correlationMatrix.matrix[j][i]
        );
        if (diff > 0.01) {
          symmetryIssues++;
        }
      }
    }
    if (symmetryIssues > 0) {
      issues.push(`${symmetryIssues} correlation pairs are not symmetric`);
    }

    // 5. Check network graph
    if (!networkGraph) {
      issues.push("Network graph not computed");
      return { issues, warnings, info };
    }

    info.push(`Network nodes: ${networkGraph.nodes.length}`);
    info.push(`Network edges: ${networkGraph.edges.length}`);

    // Check betweenness centrality values
    const betweennessValues = networkGraph.nodes.map(n => n.betweenness);
    const maxBetweenness = Math.max(...betweennessValues);
    const minBetweenness = Math.min(...betweennessValues);
    info.push(
      `Betweenness range: ${minBetweenness.toFixed(4)} - ${maxBetweenness.toFixed(4)}`
    );

    // Check for negative betweenness (shouldn't happen)
    const negativeBetweenness = betweennessValues.filter(v => v < 0).length;
    if (negativeBetweenness > 0) {
      issues.push(`${negativeBetweenness} nodes have negative betweenness`);
    }

    // Check degree centrality
    const degreeValues = networkGraph.nodes.map(n => n.degree);
    const maxDegree = Math.max(...degreeValues);
    const avgDegree = degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length;
    info.push(`Average degree: ${avgDegree.toFixed(2)}`);
    info.push(`Max degree: ${maxDegree}`);

    // 6. Statistical checks
    const allCorrelations: number[] = [];
    for (let i = 0; i < correlationMatrix.matrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix.matrix.length; j++) {
        allCorrelations.push(Math.abs(correlationMatrix.matrix[i][j]));
      }
    }
    const avgCorrelation =
      allCorrelations.reduce((a, b) => a + b, 0) / allCorrelations.length;
    info.push(`Average absolute correlation: ${avgCorrelation.toFixed(4)}`);

    const strongCorrelations = allCorrelations.filter(c => c >= 0.7).length;
    info.push(`Strong correlations (≥0.7): ${strongCorrelations}`);

    return { issues, warnings, info };
  };

  const exportValidationReport = () => {
    const validation = validateData();
    const report = {
      timestamp: new Date().toISOString(),
      timeRange,
      stockCount: stockData.length,
      validation: validation,
      sampleData: {
        stocks: stockData.slice(0, 3).map(s => ({
          symbol: s.symbol,
          dataPoints: s.returns.length,
          sampleReturns: s.returns.slice(0, 5)
        })),
        correlations: correlationMatrix
          ? {
              sample: correlationMatrix.matrix
                .slice(0, 3)
                .map(row => row.slice(0, 3))
            }
          : null,
        network: networkGraph
          ? {
              topNodes: networkGraph.nodes
                .sort((a, b) => b.betweenness - a.betweenness)
                .slice(0, 5)
                .map(n => ({
                  symbol: n.label,
                  betweenness: n.betweenness,
                  degree: n.degree
                }))
            }
          : null
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsfm_validation_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validation = validateData();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Data Validation Report</h3>
        <Button variant="outline" size="sm" onClick={exportValidationReport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="space-y-4">
        {/* Issues */}
        {validation.issues.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">Issues</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-red-600">
              {validation.issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600">
                Warnings
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-orange-600">
              {validation.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Info */}
        {validation.info.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">
                Information
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-600">
              {validation.info.map((info, idx) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sample Data Table */}
        {correlationMatrix && networkGraph && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold mb-2">Sample Betweenness Values</h4>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Rank</TableHead>
                    <TableHead className="text-xs">Symbol</TableHead>
                    <TableHead className="text-xs text-right">Betweenness</TableHead>
                    <TableHead className="text-xs text-right">Degree</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networkGraph.nodes
                    .sort((a, b) => b.betweenness - a.betweenness)
                    .slice(0, 5)
                    .map((node, idx) => (
                      <TableRow key={node.id}>
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {node.label}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {node.betweenness.toFixed(6)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {node.degree}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {validation.issues.length === 0 &&
          validation.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">
                All validations passed!
              </span>
            </div>
          )}
      </div>
    </Card>
  );
};

export default DataValidation;

