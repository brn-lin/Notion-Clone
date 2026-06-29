import { createContext, useContext, useState, useEffect } from "react";

import type { ReactNode, Dispatch, SetStateAction } from "react";

type WorkspaceContextType = {
  workspaceId: string | null;
  setWorkspaceId: Dispatch<SetStateAction<string | null>>;
  workspaceName: string;
  setWorkspaceName: Dispatch<SetStateAction<string>>;
};

type WorkspaceProviderProps = {
  children: ReactNode;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");

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
    } else {
      localStorage.removeItem("workspaceId");
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
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
};
