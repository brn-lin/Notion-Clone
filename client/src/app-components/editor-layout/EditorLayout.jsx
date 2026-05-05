import React from "react";
import Sidebar from "../sidebar/Sidebar";
import CenterEditor from "../center-editor/CenterEditor";
import { useWorkspace } from "../../context/WorkspaceContext";
import Loading from "../../Loading";
import "./EditorLayout.css";

const EditorLayout = () => {
  const { workspaceId } = useWorkspace();

  if (!workspaceId) {
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
