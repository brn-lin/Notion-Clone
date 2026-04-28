import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useWorkspace } from "../../context/WorkspaceContext";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import SortableItemList from "../items/SortableItemList";
import "./CenterEditor.css";

const CenterEditor = () => {
  const [itemsById, setItemsById] = useState({}); // Fast lookup by ID
  const [childrenByParentId, setChildrenByParentId] = useState({}); // Children ordered by parent
  const [currentItemId, setCurrentItemId] = useState(null);
  const [itemStack, setItemStack] = useState([]); // Stack to track hierarchy
  const [focusId, setFocusId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const { workspaceId, workspaceName } = useWorkspace();

  const currentItem = itemsById[currentItemId];

  // Debug warning for stale page state
  if (currentItemId && !currentItem && Object.keys(itemsById).length > 0) {
    console.warn("Item missing for currentItemId:", currentItemId);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Reset state when workspace changes
  useEffect(() => {
    setCurrentItemId(null);
    setItemStack([]);
    setItemsById({});
    setChildrenByParentId({});
  }, [workspaceId]);

  // Fetch root pages
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token || !workspaceId) return;

    api
      .get(`/workspaces/${workspaceId}/items`)
      .then((res) => {
        const items = res.data || [];
        const byId = {};
        const children = { null: [] }; // Root pages have parentId = null

        items.forEach((item) => {
          byId[item.id] = item;
          children[null].push(item.id);
        });

        setItemsById(byId);
        setChildrenByParentId(children);
      })
      .catch((err) => {
        console.error("Error fetching pages:", err);
        if (err.response?.status === 401) {
          sessionStorage.removeItem("token");
        }
      });
  }, [workspaceId]);

  // Create a page
  const handleCreatePage = async (parentId = null) => {
    try {
      const res = await api.post(`/workspaces/${workspaceId}/items`, {
        type: "page",
        parentId,
      });

      const newPage = res.data;

      // Fetch auto-created blank block inside the new page
      const childrenRes = await api.get(
        `/workspaces/${workspaceId}/items/${newPage.id}/children`,
      );

      // Store new page and it's children
      setItemsById((prev) => {
        const updated = {
          ...prev,
          [newPage.id]: newPage,
        };

        childrenRes.data.forEach((child) => {
          updated[child.id] = child;
        });

        return updated;
      });

      setChildrenByParentId((prev) => {
        const key = parentId ?? null;
        return {
          ...prev,
          [key]: [...(prev[key] || []), newPage.id],
          [newPage.id]: childrenRes.data.map((child) => child.id),
        };
      });

      setItemStack((prev) => {
        // If currently in a child page, push parent ID into page stack
        if (currentItemId) {
          return [...prev, currentItemId];
        }
        return prev;
      });

      setCurrentItemId(newPage.id);
    } catch (err) {
      console.error("Failed to create page:", err);
    }
  };

  // Delete a page
  const handleDeletePage = async (itemId) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/items/${itemId}`);

      // Remove deleted page from item map
      setItemsById((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });

      // Remove deleted page from all parent lists
      setChildrenByParentId((prev) => {
        const updated = { ...prev };

        for (const key in updated) {
          updated[key] = updated[key].filter((id) => id !== itemId);
        }

        return updated;
      });

      // If ever inside a current page when deleting, return to root level and reset page stack
      if (currentItemId === itemId) {
        setCurrentItemId(null);
        setItemStack([]);
      }

      // UX feedback (replace later with real toast library)
      alert("Page moved to trash");
    } catch (err) {
      console.error("Failed to move page to trash:", err);
    }
  };

  // Open an item (Only pages should be navigated into)
  const openItem = async (itemId) => {
    const item = itemsById[itemId];
    if (!item || item.type !== "page") return;

    if (!childrenByParentId[itemId]) {
      try {
        const res = await api.get(
          `/workspaces/${workspaceId}/items/${item.id}/children`,
        );

        const newItemsById = { ...itemsById };
        const childIds = [];

        res.data.forEach((child) => {
          newItemsById[child.id] = child;
          childIds.push(child.id);
        });

        setItemsById(newItemsById);
        setChildrenByParentId((prev) => ({ ...prev, [itemId]: childIds }));
      } catch (err) {
        console.error(err);
      }
    }

    if (currentItemId) {
      setItemStack((prev) => [...prev, currentItemId]);
    }

    setCurrentItemId(itemId);
  };

  // Go back to parent page
  const goBack = () => {
    if (itemStack.length === 0) {
      setCurrentItemId(null);
      return;
    }
    const newStack = [...itemStack];
    const parentId = newStack.pop();

    setItemStack(newStack);
    setCurrentItemId(parentId);
  };

  // Inline editing for page title
  const handlePageTitleChange = async (itemId, newTitle) => {
    const item = itemsById[itemId];

    if (!item || item.type !== "page") return;

    try {
      await api.patch(`/workspaces/${workspaceId}/items/${itemId}`, {
        title: newTitle,
      });

      setItemsById((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], title: newTitle },
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Pressing 'Enter' on an empty block creates a new block
  const handleEnter = async (currentItem) => {
    try {
      const res = await api.post(`/workspaces/${workspaceId}/items`, {
        type: "block",
        parentId: currentItem.parent_id,
        content: { text: "" },
        afterItemId: currentItem.id,
      });

      const newBlock = res.data;

      // Add new block to current list of items in state
      setItemsById((prev) => ({
        ...prev,
        [newBlock.id]: newBlock,
      }));

      // Add new block to currentl ist of siblings
      setChildrenByParentId((prev) => {
        const parent = currentItem.parent_id ?? null;
        const siblings = [...(prev[parent] || [])];
        const index = siblings.indexOf(currentItem.id);

        siblings.splice(index + 1, 0, newBlock.id);

        return {
          ...prev,
          [parent]: siblings,
        };
      });

      // Focus on new block
      setFocusId(newBlock.id);
    } catch (err) {
      console.error("Failed to create block:", err);
    }
  };

  // Pressing 'Backspace' on an empty block deletes a new block
  const handleDeleteBlock = async (item) => {
    if (!item || item.type !== "block") return;

    const parentId = item.parent_id ?? null;
    const siblings = childrenByParentId[parentId] || [];
    const index = siblings.indexOf(item.id);

    if (index === -1) return;

    const prevSiblingId = siblings[index - 1] || null;

    try {
      await api.delete(`/workspaces/${workspaceId}/items/${item.id}`);

      // Update state
      setChildrenByParentId((prev) => {
        const updated = (prev[parentId] || []).filter((id) => id !== item.id);

        return {
          ...prev,
          [parentId]: updated,
        };
      });

      setItemsById((prev) => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });

      setFocusId(prevSiblingId);
    } catch (err) {
      console.error("Failed to delete block:", err);
    }
  };

  // Drag-and-drop handler
  const handleDragEnd = async (event, parentId = null) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = childrenByParentId[parentId ?? null] || [];
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    let adjustedIndex = newIndex;

    if (oldIndex < newIndex) {
      adjustedIndex = newIndex - 1;
    }

    // Optimistic UI update
    const newItems = arrayMove(items, oldIndex, newIndex);
    setChildrenByParentId((prev) => ({
      ...prev,
      [parentId ?? null]: newItems,
    }));

    try {
      const res = await api.patch(
        `/workspaces/${workspaceId}/items/${active.id}/move`,
        { newParentId: parentId, newIndex: adjustedIndex },
      );

      const updatedItem = res.data;

      setItemsById((prev) => ({
        ...prev,
        [updatedItem.id]: {
          ...prev[updatedItem.id],
          ...updatedItem,
        },
      }));
    } catch (err) {
      console.error("Error moving page:", err);
      setChildrenByParentId((prev) => ({ ...prev, [parentId ?? null]: items }));
    }
  };

  const currentChildren = currentItemId
    ? childrenByParentId[currentItemId] || []
    : childrenByParentId[null] || [];

  return (
    <div className="center-editor">
      {!currentItemId && (
        <div className="root__header">
          <button
            className="page__create-page-button"
            onClick={() => handleCreatePage(null)}
          >
            + New Page
          </button>
        </div>
      )}

      {currentItemId && (
        <div className="page__header">
          <div className="page__header-top">
            <button className="page__back-button" onClick={goBack}>
              {itemStack.length > 0
                ? itemsById[itemStack[itemStack.length - 1]]?.title
                : workspaceName || "Workspace"}
            </button>

            <button
              className="page__create-page-button"
              onClick={() => handleCreatePage(currentItemId)}
            >
              + New Page
            </button>
          </div>

          {currentItem?.type === "page" && (
            <div className="page__title-wrapper">
              <input
                className="page__title-input"
                value={currentItem.title || ""}
                onChange={(e) =>
                  handlePageTitleChange(currentItemId, e.target.value)
                }
              />
            </div>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(event) => {
          setIsDragging(false);
          handleDragEnd(event, currentItemId ?? null);
        }}
      >
        <SortableItemList
          items={currentChildren.map((id) => itemsById[id]).filter(Boolean)}
          onOpen={openItem}
          onDelete={handleDeletePage}
          onEnter={handleEnter}
          onBackspace={handleDeleteBlock}
          focusId={focusId}
          isDragging={isDragging}
        />
      </DndContext>
    </div>
  );
};

export default CenterEditor;
