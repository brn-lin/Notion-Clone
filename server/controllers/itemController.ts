import type { Request, Response } from "express";
import * as itemService from "../services/itemService.js";
import { getUser } from "../utils/getUser.js";
import { getWorkspaceId } from "../utils/getWorkspaceId.js";

// ------------------
// Route Parameter Types
// ------------------

type ItemIdParams = {
  itemId: string;
};

type ParentIdParams = {
  parentId: string;
};

// ------------------
// Create an item
// ------------------

const createItemController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const user = getUser(req);

  const {
    type, // "page" or "block"
    parentId = null,
    title,
    content,
    afterItemId,
  } = req.body;

  try {
    const newItem = await itemService.createItemService({
      workspaceId,
      parentId,
      type,
      title,
      content,
      afterItemId,
      createdBy: user.id,
    });

    res.status(201).json(newItem);
  } catch (err: unknown) {
    console.error("Error creating item:", err);

    if (!(err instanceof Error)) {
      res.status(500).json({
        error: "Failed to create item",
      });

      return;
    }

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
    } as const;

    const status =
      err.message in errorMap
        ? errorMap[err.message as keyof typeof errorMap]
        : 500;

    res.status(status).json({
      error: status === 500 ? "Failed to create item" : err.message,
    });
  }
};

// ------------------
// Get all items in a workspace (root level)
// ------------------

const getItemsInWorkspaceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);

  try {
    const items = await itemService.getItemsInWorkspaceService({
      workspaceId,
    });

    res.status(200).json(items);
  } catch (err: unknown) {
    console.error("Error fetching root items for workspace:", err);

    res.status(500).json({ error: "Failed to fetch items" });
  }
};

// ------------------
// Get all items in a parent container
// ------------------

const getItemInParentController = async (
  req: Request<ParentIdParams>,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const { parentId } = req.params;

  try {
    const items = await itemService.getItemInParentService({
      workspaceId,
      parentId,
    });

    res.status(200).json(items);
  } catch (err: unknown) {
    console.error("Error fetching children:", err);

    if (err instanceof Error && err.message === "Parent not found") {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Failed to fetch items" });
  }
};

// ------------------
// Update page title & block content
// ------------------

const updateItemController = async (
  req: Request<ItemIdParams>,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const { itemId } = req.params;
  const { title, content } = req.body;

  try {
    const hasUpdate = title !== undefined || content !== undefined;

    if (!hasUpdate) {
      res.status(400).json({
        error: "Provide title or content to update.",
      });

      return;
    }

    const updatedItem = await itemService.updateItemService({
      workspaceId,
      itemId,
      title,
      content,
    });

    res.status(200).json(updatedItem);
  } catch (err: unknown) {
    console.error("Error updating item:", err);

    if (err instanceof Error && err.message === "Item not found") {
      res.status(404).json({ error: err.message });
      return;
    }

    if (
      err instanceof Error &&
      (err.message === "Pages cannot have content" ||
        err.message === "Blocks cannot have a title" ||
        err.message === "Block content must be an object")
    ) {
      res.status(400).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Failed to update item" });
  }
};

// ------------------
// Move an item
// ------------------

const moveItemController = async (
  req: Request<ItemIdParams>,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const { itemId } = req.params;
  const { newParentId = null, newIndex } = req.body;

  if (newIndex !== undefined && (!Number.isInteger(newIndex) || newIndex < 0)) {
    res.status(400).json({ error: "Invalid newIndex" });
    return;
  }

  try {
    const updatedItem = await itemService.moveItemService({
      workspaceId,
      itemId,
      newParentId,
      newIndex,
    });

    res.status(200).json(updatedItem);
  } catch (err: unknown) {
    console.error("Error moving item:", err);

    const errorMap = {
      "Item not found": 404,
      "Cannot move item into itself": 400,
      "Cannot move item into its own descendant": 400,
      "Invalid nesting": 400,
    } as const;

    if (!(err instanceof Error)) {
      res.status(500).json({
        error: "Failed to move item",
      });

      return;
    }

    const status =
      err.message in errorMap
        ? errorMap[err.message as keyof typeof errorMap]
        : 500;

    res.status(status).json({
      error: status === 500 ? "Failed to move item" : err.message,
    });
  }
};

// ------------------
// Soft delete an item
// ------------------

const softDeleteItemController = async (
  req: Request<ItemIdParams>,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const user = getUser(req);
  const userId = user.id;
  const { itemId } = req.params;

  try {
    const result = await itemService.softDeleteItemService({
      workspaceId,
      itemId,
      userId,
    });

    res.status(200).json({
      message: "Item and descendants successfully soft deleted",
      deletedIds: result.deletedIds,
      count: result.count,
    });
  } catch (err: unknown) {
    console.error("Error soft deleting item:", err);

    if (!(err instanceof Error)) {
      res.status(500).json({
        error: "Failed to soft delete item",
      });

      return;
    }

    if (err.message === "Item not found") {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({
      error: "Failed to soft delete item",
    });
  }
};

// ------------------
// Get trash items (pages only)
// ------------------

const getTrashItemsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const user = getUser(req);
  const userId = user.id;

  try {
    const items = await itemService.getTrashItemsService({
      workspaceId,
      userId,
    });

    res.status(200).json(items);
  } catch (err: unknown) {
    console.error("Error fetching trash items:", err);

    res.status(500).json({
      error: "Failed to fetch trash items",
    });
  }
};

// ------------------
// Restore a soft deleted item and all descendants (Within 30 day window)
// ------------------

const restoreItemController = async (
  req: Request<ItemIdParams>,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const { itemId } = req.params;

  try {
    const result = await itemService.restoreItemService({
      workspaceId,
      itemId,
    });

    res.status(200).json({
      message: "Item and descendants restored",
      restoredIds: result.restoredIds,
      count: result.count,
    });
  } catch (err: unknown) {
    console.error("Error restoring item:", err);

    if (!(err instanceof Error)) {
      res.status(500).json({
        error: "Failed to restore item",
      });

      return;
    }

    if (err.message === "Item not found") {
      res.status(404).json({ error: err.message });
      return;
    }

    if (err.message === "Item is not deleted") {
      res.status(400).json({ error: err.message });
      return;
    }

    if (err.message === "Restore window expired") {
      res.status(410).json({ error: err.message });
      return;
    }

    res.status(500).json({
      error: "Failed to restore item",
    });
  }
};

// ------------------
// Permanently delete an item and all descendants
// ------------------

const permanentlyDeleteItemController = async (
  req: Request<ItemIdParams>,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const { itemId } = req.params;

  try {
    const result = await itemService.permanentlyDeleteItemService({
      workspaceId,
      itemId,
    });

    res.status(200).json({
      message: "Item permanently deleted",
      deletedIds: result.deletedIds,
      count: result.count,
    });
  } catch (err: unknown) {
    console.error("Error permanently deleting item:", err);

    if (!(err instanceof Error)) {
      res.status(500).json({
        error: "Failed to permanently delete item",
      });

      return;
    }

    if (err.message === "Deleted item not found") {
      res.status(404).json({
        error: err.message,
      });

      return;
    }

    res.status(500).json({
      error: "Failed to permanently delete item",
    });
  }
};

// ------------------
// Permanently delete all trash items
// ------------------

const emptyTrashController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const workspaceId = getWorkspaceId(req);
  const user = getUser(req);
  const userId = user.id;

  try {
    const result = await itemService.emptyTrashService({
      workspaceId,
      userId,
    });

    res.status(200).json({
      message: "Trash emptied",
      deletedIds: result.deletedIds,
      count: result.count,
    });
  } catch (err: unknown) {
    console.error("Error emptying trash:", err);

    res.status(500).json({
      error: "Failed to empty trash",
    });
  }
};

export {
  createItemController,
  getItemsInWorkspaceController,
  getItemInParentController,
  updateItemController,
  moveItemController,
  softDeleteItemController,
  getTrashItemsController,
  restoreItemController,
  permanentlyDeleteItemController,
  emptyTrashController,
};
