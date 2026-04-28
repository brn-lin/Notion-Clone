import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import api from "../../api/axios";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  const { workspaceId, setWorkspaceId, setWorkspaceName } = useWorkspace();
  const [workspaces, setWorkspaces] = useState([]);

  // Renaming workspace state
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get("/workspaces");

        setWorkspaces(res.data);

        // Auto-select first workspace if none selected
        if (res.data.length > 0 && !workspaceId) {
          const first = res.data[0];
          setWorkspaceId(first.id);
          setWorkspaceName(first.name);
        }
      } catch (err) {
        console.error("Failed to fetch workspaces:", err);
      }
    };

    fetchWorkspaces();
  }, []);

  // Log out
  const handleLogout = () => {
    // Remove JWT from sessionStorage
    sessionStorage.removeItem("token");
    setWorkspaceId(null);

    // Redirect to Login page
    navigate("/");
  };

  const handleCreateWorkspace = async () => {
    try {
      const workspaceRes = await api.post("/workspaces", {
        name: "New Workspace",
      });

      const workspaceId = workspaceRes.data.id;
      const workspaceName = workspaceRes.data.name;

      await api.post(`/workspaces/${workspaceId}/items`, {
        type: "page",
        title: "New page",
        parentId: null,
      });

      // Update global state
      setWorkspaceId(workspaceId);
      setWorkspaceName(workspaceName);

      // Update sidebar to immediatley display all workspaces
      setWorkspaces((prev) => [...prev, workspaceRes.data]);
    } catch (err) {
      console.error(err);
      alert("Failed to create workspace");
    }
  };

  const openWorkspace = (id) => {
    const ws = workspaces.find((w) => w.id === id);
    setWorkspaceId(id);
    setWorkspaceName(ws?.name || "");
  };

  // Rename workspace
  const handleRenameWorkspace = async (id) => {
    if (!editingName.trim()) return;

    try {
      await api.patch(`/workspaces/${id}`, { name: editingName });

      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === id ? { ...ws, name: editingName } : ws)),
      );

      if (workspaceId === id) {
        setWorkspaceName(editingName);
      }

      setEditingWorkspaceId(null);
      setEditingName("");
    } catch (err) {
      console.error("Failed to rename workspace:", err);
      alert("Failed to rename workspace");
    }
  };

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workspace? This action cannot be undone.",
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/workspaces/${workspaceId}`);

      // Create updated workspaces array
      const updatedWorkspaces = workspaces.filter(
        (ws) => ws.id !== workspaceId,
      );

      // Re-renders updated workspaces list
      setWorkspaces(updatedWorkspaces);

      if (updatedWorkspaces.length > 0) {
        const firstWorkspaceId = updatedWorkspaces[0].id;
        setWorkspaceId(firstWorkspaceId);
      } else {
        setWorkspaceId(null);
      }
    } catch (err) {
      console.error("Failed to delete workspace:", err);
      alert("Failed to delete workspace");
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={"sidebar__workspace-button"}
            onClick={() => openWorkspace(ws.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") openWorkspace(ws.id);
            }}
          >
            {editingWorkspaceId === ws.id ? (
              <input
                className="sidebar___workspace-input"
                value={editingName}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => {
                  setEditingWorkspaceId(null);
                  setEditingName("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameWorkspace(ws.id);
                }}
              />
            ) : (
              <>
                <div className="sidebar__workspace-left">
                  {/* Rename button on left */}
                  {workspaceId === ws.id && (
                    <button
                      className="sidebar__rename-workspace-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkspaceId(ws.id);
                        setEditingName(ws.name);
                      }}
                    >
                      <MdOutlineDriveFileRenameOutline />
                    </button>
                  )}
                  <span>{ws.name}</span>
                </div>

                {/* Active checkmark */}
                {workspaceId === ws.id && (
                  <span className="sidebar__active-workspace">✓</span>
                )}
              </>
            )}
          </div>
        ))}
        <button
          className="sidebar__create-new-workspace-button"
          onClick={handleCreateWorkspace}
        >
          + New workspace
        </button>
      </div>

      <div className="sidebar__footer">
        {workspaceId && (
          <button
            className="sidebar__delete-workspace-button"
            onClick={handleDeleteWorkspace}
          >
            Delete workspace
          </button>
        )}
        <button className="sidebar__logout-button" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
