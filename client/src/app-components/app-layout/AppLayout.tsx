import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { useWorkspace } from "../../context/WorkspaceContext";
import Loading from "../../Loading";
import "./AppLayout.css";

const AppLayout = () => {
  const [workspaceReady, setWorkspaceReady] = useState(false);

  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) return;

    setWorkspaceReady(false);

    const timer = setTimeout(() => {
      setWorkspaceReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [workspaceId]);

  if (!workspaceId || !workspaceReady) {
    return <Loading />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default AppLayout;
