import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetworkNode } from "@/services/dsfm/networkEngine";

interface CentralityTableProps {
  nodes: NetworkNode[];
  title: string;
  maxRows?: number;
}

const CentralityTable = ({ nodes, title, maxRows = 10 }: CentralityTableProps) => {
  const sortedNodes = [...nodes]
    .sort((a, b) => b.betweenness - a.betweenness)
    .slice(0, maxRows);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Betweenness</TableHead>
              <TableHead className="text-right">Degree</TableHead>
              <TableHead>Sector</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedNodes.map((node, index) => (
              <TableRow key={node.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{node.label}</TableCell>
                <TableCell className="text-right">
                  {node.betweenness.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">{node.degree}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  {node.sector || "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CentralityTable;

