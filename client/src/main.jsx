import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </StrictMode>,
);
