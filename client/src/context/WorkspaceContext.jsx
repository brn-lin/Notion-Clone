import { createContext, useContext, useState, useEffect } from "react";

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");

  // Load from LocalStorage on app start
  useEffect(() => {
    const stored = localStorage.getItem("workspaceId");
    if (stored) {
      setWorkspaceId(stored);
    }
  }, []);

  // Sync to LocalStorage whenever it changes
  useEffect(() => {
    if (workspaceId) {
      localStorage.setItem("workspaceId", workspaceId);
    }
  }, [workspaceId]);

  return (
    <WorkspaceContext.Provider
      value={{ workspaceId, setWorkspaceId, workspaceName, setWorkspaceName }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

// Custom hook for cleaner usage
export const useWorkspace = () => useContext(WorkspaceContext);
