import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { VisibilityProvider } from "@/hooks/useVisibility";
import Index from "./pages/Index";
import StockDetail from "./pages/StockDetail";
import MostBoughtStocks from "./pages/MostBoughtStocks";
import Terminal from "./pages/Terminal";
import DSFMAnalysis from "./pages/DSFMAnalysis";
import Holdings from "./pages/Holdings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
        <pre className="text-sm text-gray-600 mb-4 bg-gray-100 p-4 rounded max-w-2xl overflow-auto">
          {error.message}
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500">Stack trace</summary>
              <pre className="text-xs mt-2 text-left">{error.stack}</pre>
            </details>
          )}
        </pre>
        <div className="flex gap-4 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary 
    FallbackComponent={ErrorFallback}
    onError={(error, info) => {
      console.error("Error caught by boundary:", error, info);
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VisibilityProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/stock/:symbol" element={<StockDetail />} />
              <Route path="/terminal/:symbol" element={<Terminal />} />
              <Route path="/most-bought-stocks" element={<MostBoughtStocks />} />
              <Route path="/dsfm-analysis" element={<DSFMAnalysis />} />
              <Route path="/holdings" element={<Holdings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </VisibilityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
