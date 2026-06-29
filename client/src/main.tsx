import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </StrictMode>,
);
