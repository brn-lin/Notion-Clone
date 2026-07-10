import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { workspaceAuth } from "../middleware/workspaceAuth.js";
import * as itemController from "../controllers/itemController.js";

const router = express.Router();

// ------------------
// Create an item
// ------------------

router.post(
  "/:workspaceId/items",
  authMiddleware,
  workspaceAuth("member"),
  itemController.createItemController,
);

// ------------------
// Get all items in a workspace (root level)
// ------------------

router.get(
  "/:workspaceId/items",
  authMiddleware,
  workspaceAuth("member"),
  itemController.getItemsInWorkspaceController,
);

// ------------------
// Get all items in a parent container
// ------------------

router.get(
  "/:workspaceId/items/:parentId/children",
  authMiddleware,
  workspaceAuth("member"),
  itemController.getItemInParentController,
);

// ------------------
// Update page title & block content
// ------------------

router.patch(
  "/:workspaceId/items/:itemId",
  authMiddleware,
  workspaceAuth("member"),
  itemController.updateItemController,
);

// ------------------
// Move an item
// ------------------

router.patch(
  "/:workspaceId/items/:itemId/move",
  authMiddleware,
  workspaceAuth("member"),
  itemController.moveItemController,
);

// ------------------
// Soft delete an item
// ------------------

router.delete(
  "/:workspaceId/items/:itemId",
  authMiddleware,
  workspaceAuth("member"),
  itemController.softDeleteItemController,
);

// ------------------
// Get trash items (pages only)
// ------------------

router.get(
  "/:workspaceId/items/trash",
  authMiddleware,
  workspaceAuth("member"),
  itemController.getTrashItemsController,
);

// ------------------
// Restore a soft deleted item and all descendants (Within 30 day window)
// ------------------

router.post(
  "/:workspaceId/items/:itemId/restore",
  authMiddleware,
  workspaceAuth("member"),
  itemController.restoreItemController,
);

// ------------------
// Permanently delete an item and all descendants
// ------------------

router.delete(
  "/:workspaceId/items/:itemId/permanent",
  authMiddleware,
  workspaceAuth("member"),
  itemController.permanentlyDeleteItemController,
);

// ------------------
// Permanently delete all trash items
// ------------------

router.delete(
  "/:workspaceId/items/trash/empty",
  authMiddleware,
  workspaceAuth("member"),
  itemController.emptyTrashController,
);

export default router;
