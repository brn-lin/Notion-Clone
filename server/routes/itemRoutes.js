const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { workspaceAuth } = require("../middleware/workspaceAuth");

const itemController = require("../controllers/itemController");

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
// Restore a soft deleted item and all descendants (Within 30 day window)
// ------------------

router.post(
  "/:workspaceId/items/:itemId/restore",
  authMiddleware,
  workspaceAuth("member"),
  itemController.restoreItemController,
);

module.exports = router;
