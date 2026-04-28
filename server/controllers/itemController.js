const itemService = require("../services/itemService");

// ------------------
// Create an item
// ------------------

const createItemController = async (req, res) => {
  const workspaceId = req.workspace.id;
  const userId = req.user.id;

  const {
    type, // "page" or "block"
    parentId = null,
    title,
    content,
    position,
    afterItemId,
  } = req.body;

  try {
    const newItem = await itemService.createItemService({
      workspaceId,
      parentId,
      type,
      title,
      content,
      position,
      afterItemId,
      createdBy: userId,
    });

    return res.status(201).json(newItem);
  } catch (err) {
    console.error("Error creating item:", err);

    const errorMap = {
      // Parent / hierarchy
      "Parent not found": 404,
      "Invalid nesting: A block cannot be the parent of a page": 400,

      // Type validation
      "Invalid type": 400,
      "Only pages can exist at the root level": 400,

      // afterItemId insertion errors
      "After item not found": 404,
      "Cannot insert after item in different parent": 400,
    };

    const status = errorMap[err.message] || 500;

    return res.status(status).json({
      error: status === 500 ? "Failed to create item" : err.message,
    });
  }
};

// ------------------
// Get all items in a workspace (root level)
// ------------------

const getItemsInWorkspaceController = async (req, res) => {
  const workspaceId = req.workspace.id;

  try {
    const items = await itemService.getItemsInWorkspaceService({
      workspaceId,
    });

    return res.status(200).json(items);
  } catch (err) {
    console.error("Error fetching root items for workspace:", err);

    return res.status(500).json({ error: "Failed to fetch items" });
  }
};

// ------------------
// Get all items in a parent container
// ------------------

const getItemInParentController = async (req, res) => {
  const workspaceId = req.workspace.id;
  const { parentId } = req.params;

  try {
    const items = await itemService.getItemInParentService({
      workspaceId,
      parentId,
    });

    return res.status(200).json(items);
  } catch (err) {
    console.error("Error fetching children:", err);

    if (err.message === "Parent not found") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to fetch items" });
  }
};

// ------------------
// Update page title & block content
// ------------------

const updateItemController = async (req, res) => {
  const workspaceId = req.workspace.id;
  const { itemId } = req.params;
  const { title, content } = req.body;

  try {
    const hasUpdate = title !== undefined || content !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        error: "Provide title or content to update.",
      });
    }

    const updatedItem = await itemService.updateItemService({
      workspaceId,
      itemId,
      title,
      content,
    });

    return res.status(200).json(updatedItem);
  } catch (err) {
    console.error("Error updating item:", err);

    if (err.message === "Item not found") {
      return res.status(404).json({ error: err.message });
    }

    if (
      err.message === "Pages cannot have content" ||
      err.message === "Blocks cannot have a title" ||
      err.message === "Block content must be an object"
    ) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to update item" });
  }
};

// ------------------
// Move an item
// ------------------

const moveItemController = async (req, res) => {
  const workspaceId = req.workspace.id;
  const { itemId } = req.params;
  const { newParentId = null, newIndex } = req.body;

  if (newIndex !== undefined && (!Number.isInteger(newIndex) || newIndex < 0)) {
    return res.status(400).json({ error: "Invalid newIndex" });
  }

  try {
    const updatedItem = await itemService.moveItemService({
      workspaceId,
      itemId,
      newParentId,
      newIndex,
    });

    return res.status(200).json(updatedItem);
  } catch (err) {
    console.error("Error moving item:", err);

    const errorMap = {
      "Item not found": 404,
      "Cannot move item into itself": 400,
      "Cannot move item into its own descendant": 400,
      "Invalid nesting": 400,
    };

    const status = errorMap[err.message] || 500;

    return res.status(status).json({
      error: status === 500 ? "Failed to move item" : err.message,
    });
  }
};

// ------------------
// Soft delete an item
// ------------------

const softDeleteItemController = async (req, res) => {
  const workspaceId = req.workspace.id;
  const { itemId } = req.params;

  try {
    const result = await itemService.softDeleteItemService({
      workspaceId,
      itemId,
    });

    return res.status(200).json({
      message: "Item and descendants successfully soft deleted",
      deletedIds: result.deletedIds,
      count: result.count,
    });
  } catch (err) {
    console.error("Error soft deleting item:", err);

    if (err.message === "Item not found") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({
      error: "Failed to soft delete item",
    });
  }
};

// ------------------
// Restore a soft deleted item and all descendants (Within 30 day window)
// ------------------

const restoreItemController = async (req, res) => {
  const workspaceId = req.workspace.id;
  const { itemId } = req.params;

  try {
    const result = await itemService.restoreItemService({
      workspaceId,
      itemId,
    });

    return res.status(200).json({
      message: "Item and descendants restored",
      restoredIds: result.restoredIds,
      count: result.count,
    });
  } catch (err) {
    console.error("Error restoring item:", err);

    if (err.message === "Item not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message === "Item is not deleted") {
      return res.status(400).json({ error: err.message });
    }

    if (err.message === "Restore window expired") {
      return res.status(410).json({ error: err.message });
    }

    return res.status(500).json({
      error: "Failed to restore item",
    });
  }
};

module.exports = {
  createItemController,
  getItemsInWorkspaceController,
  getItemInParentController,
  updateItemController,
  moveItemController,
  softDeleteItemController,
  restoreItemController,
};
