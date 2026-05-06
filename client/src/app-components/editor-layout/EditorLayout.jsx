import { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import CenterEditor from "../center-editor/CenterEditor";
import { useWorkspace } from "../../context/WorkspaceContext";
import Loading from "../../Loading";
import "./EditorLayout.css";

const EditorLayout = () => {
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
    <div className="editor-layout">
      <Sidebar />
      <CenterEditor />
    </div>
  );
};

export default EditorLayout;
