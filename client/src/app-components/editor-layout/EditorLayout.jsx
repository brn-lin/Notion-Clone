import React from "react";
import Sidebar from "../sidebar/Sidebar";
import CenterEditor from "../center-editor/CenterEditor";
import "./EditorLayout.css";

const EditorLayout = () => {
  return (
    <div className="editor-layout">
      <Sidebar />
      <CenterEditor />
    </div>
  );
};

export default EditorLayout;
