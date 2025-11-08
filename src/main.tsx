import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #dc2626;">Failed to load application</h1>
        <pre style="text-align: left; background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow: auto; max-width: 800px;">
          ${error instanceof Error ? error.message : String(error)}
        </pre>
        <button 
          onclick="window.location.reload()" 
          style="margin-top: 1rem; padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 0.25rem; cursor: pointer;"
        >
          Reload Page
        </button>
      </div>
    </div>
  `;
}
