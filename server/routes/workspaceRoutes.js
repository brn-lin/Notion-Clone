const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { workspaceAuth } = require("../middleware/workspaceAuth");

const workspaceController = require("../controllers/workspaceController");

// ------------------
// Create a new workspace
// ------------------

router.post("/", authMiddleware, workspaceController.createWorkspaceController);

// ------------------
// Rename workspace (owner only)
// ------------------

router.patch(
  "/:workspaceId",
  authMiddleware,
  workspaceAuth("owner"),
  workspaceController.renameWorkspaceController,
);

// ------------------
// Get all workspaces for current user
// ------------------

router.get("/", authMiddleware, workspaceController.getAllWorkspacesController);

// ------------------
// Get a single workspace by ID
// ------------------

router.get(
  "/:workspaceId",
  authMiddleware,
  workspaceAuth("viewer"),
  workspaceController.getWorkspaceController,
);

// ------------------
// Soft delete a workspace (owner-only)
// ------------------

router.delete(
  "/:workspaceId",
  authMiddleware,
  workspaceAuth("owner"),
  workspaceController.softDeleteWorkspaceController,
);

// ------------------
// Restore a workspace (owner only)
// ------------------

router.post(
  "/:workspaceId/restore",
  authMiddleware,
  workspaceAuth("owner"),
  workspaceController.restoreWorkspaceController,
);

// ------------------
// Invite a member to workspace (owner-only)
// ------------------

router.post(
  "/:workspaceId/members",
  authMiddleware,
  workspaceAuth("owner"),
  workspaceController.addMemberController,
);

// ------------------
// Change member role (owner-only)
// ------------------

router.patch(
  "/:workspaceId/members/:userId",
  authMiddleware,
  workspaceAuth("owner"),
  workspaceController.updateMemberRoleController,
);

// ------------------
// Remove member (owner only)
// ------------------

router.delete(
  "/:workspaceId/members/:userId",
  authMiddleware,
  workspaceAuth("owner"),
  workspaceController.removeMemberController,
);

module.exports = router;
