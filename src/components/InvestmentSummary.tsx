const InvestmentSummary = () => {
  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4">Your investments</h3>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Current</div>
          <div className="text-2xl font-semibold">₹418</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">1D returns</div>
          <div className="text-sm text-destructive">-₹2.75 (0.65%)</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Total returns</div>
          <div className="text-sm text-destructive">-₹96.90 (18.82%)</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">Invested</div>
          <div className="text-sm font-medium">₹515</div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummary;
