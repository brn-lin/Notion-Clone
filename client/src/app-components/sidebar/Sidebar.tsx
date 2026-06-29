import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import api from "../../api/axios";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";
import "./Sidebar.css";

type Workspace = {
  id: string;
  name: string;
};

const Sidebar = () => {
  const navigate = useNavigate();

  const { workspaceId, setWorkspaceId, setWorkspaceName } = useWorkspace();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Renaming workspace state
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");

  // Resize sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(245);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get<Workspace[]>("/workspaces");

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

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, 245), 480);

      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    document.body.style.userSelect = isDragging ? "none" : "";

    return () => {
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

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
      const workspaceRes = await api.post<Workspace>("/workspaces", {
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

  const openWorkspace = (id: string) => {
    const ws = workspaces.find((w) => w.id === id);
    setWorkspaceId(id);
    setWorkspaceName(ws?.name || "");

    navigate("/editor");
  };

  // Rename workspace
  const handleRenameWorkspace = async (id: string) => {
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
      "Are you sure you want to permanently delete this workspace? This will permanently delete the workspace and all of its pages. This action cannot be undone.",
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
    <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
      <div className="sidebar-header">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="sidebar-header__workspace-button"
            onClick={() => openWorkspace(ws.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") openWorkspace(ws.id);
            }}
          >
            {editingWorkspaceId === ws.id ? (
              <input
                className="sidebar-header___workspace-input"
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
                <div className="sidebar-header__workspace-left">
                  {/* Rename button on left */}
                  {workspaceId === ws.id && (
                    <button
                      className="sidebar-header__rename-workspace-button"
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
                  <span className="sidebar-header__active-workspace">✓</span>
                )}
              </>
            )}
          </div>
        ))}
        <button
          className="sidebar-header__create-new-workspace-button"
          onClick={handleCreateWorkspace}
        >
          + New workspace
        </button>
      </div>

      <div className="sidebar-footer">
        {workspaceId && (
          <button
            className="sidebar-footer__delete-workspace-button"
            onClick={handleDeleteWorkspace}
          >
            Delete workspace
          </button>
        )}

        <button
          className="sidebar-footer__trash-button"
          onClick={() => navigate("/editor/trash")}
        >
          <RiDeleteBinLine />
          <span>Trash</span>
        </button>

        <button
          className="sidebar-footer__logout-button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>

      <div
        className="sidebar__resize-handle"
        onMouseDown={() => setIsDragging(true)}
      />
    </div>
  );
};

export default Sidebar;
