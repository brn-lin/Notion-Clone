import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useWorkspace } from "../../context/WorkspaceContext";
import { RiDeleteBinLine } from "react-icons/ri";
import "./Trash.css";

const Trash = () => {
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/workspaces/${workspaceId}/items/trash`);

      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load trash:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    fetchTrash();
  }, [workspaceId]);

  // Restore item
  const handleRestore = async (itemId) => {
    try {
      await api.post(`/workspaces/${workspaceId}/items/${itemId}/restore`);

      // Remove item from UI
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const handlePermanentDelete = async (itemId) => {
    const confirmed = window.confirm(
      "This will permanently delete this page. This action cannot be undone. Continue?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/items/${itemId}/permanent`);

      // Remove item from UI
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };

  const handleEmptyTrash = async () => {
    const confirmed = window.confirm(
      "This will permanently delete ALL pages in Trash. This action cannot be undone. Continue?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/items/trash/empty`);

      // Clear Trash UI
      setItems([]);
    } catch (err) {
      console.error("Failed to empty trash:", err);
    }
  };

  if (loading) {
    return <div className="trash">Loading trash...</div>;
  }

  return (
    <div className="trash">
      <div className="trash__header">
        <h2 className="trash__title">Trash</h2>

        {items.length > 0 && (
          <button className="trash__empty-button" onClick={handleEmptyTrash}>
            Empty Trash
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="trash__empty">Trash is empty</div>
      ) : (
        <div className="trash__list">
          {items.map((item) => (
            <div key={item.id} className="trash__item">
              <div className="trash__item-info">
                <div className="trash__item-title">
                  {item.title || "Untitled"}
                </div>
                <div className="trash__item-meta">
                  Deleted: {new Date(item.deleted_at).toLocaleString()}
                </div>
              </div>

              <div className="trash__actions">
                <button
                  className="trash__restore-button"
                  onClick={() => handleRestore(item.id)}
                >
                  Restore
                </button>

                <button
                  className="trash__delete-button"
                  onClick={() => handlePermanentDelete(item.id)}
                >
                  <RiDeleteBinLine />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;
