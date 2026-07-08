import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { workspaceAuth } from "../middleware/workspaceAuth.js";
import * as workspaceController from "../controllers/workspaceController.js";

const router = express.Router();

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
// Hard delete a workspace (owner-only)
// ------------------

router.delete(
  "/:workspaceId",
  authMiddleware,
  workspaceAuth("owner"),
  workspaceController.deleteWorkspaceController,
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

export default router;
