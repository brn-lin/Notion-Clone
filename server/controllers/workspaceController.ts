import type { Request, Response } from "express";
import validator from "validator";
import * as workspaceService from "../services/workspaceService.js";
import { getUser } from "../utils/getUser.js";
import { isMemberRole } from "../utils/permissions.js";

// ------------------
// Create a new workspace
// ------------------

const createWorkspaceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const name = String(req.body.name || "").trim();

  // If name is empty, respond with 400 Bad Request
  if (!name) {
    res.status(400).json({ error: "Workspace name required" });
    return;
  }

  try {
    const user = getUser(req);
    const workspace = await workspaceService.createWorkspaceService({
      name,
      ownerId: user.id,
    });

    // Successful response
    res.status(201).json(workspace);
  } catch (err: unknown) {
    console.error(err);

    res.status(500).json({ error: "Failed to create workspace" });
  }
};

// ------------------
// Rename workspace (owner-only)
// ------------------

const renameWorkspaceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const name = String(req.body.name || "").trim();

  // Validate input
  if (!name) {
    res.status(400).json({ error: "Workspace name required" });
    return;
  }

  try {
    const workspace = await workspaceService.renameWorkspaceService(
      req.workspaceId,
      name,
    );

    if (!workspace) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    res.status(200).json(workspace);
  } catch (err: unknown) {
    console.error("Rename workspace error:", err);

    res.status(500).json({ error: "Failed to rename workspace" });
  }
};

// ------------------
// Get all workspaces for current user
// ------------------

const getAllWorkspacesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getUser(req);

    const workspaces = await workspaceService.getAllWorkspacesService(user.id);

    // Successful response
    res.json(workspaces);
  } catch (err: unknown) {
    console.error(err);

    res.status(500).json({ error: "Failed to get workspaces" });
  }
};

// ------------------
// Get a single workspace by ID
// ------------------

const getWorkspaceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const workspace = await workspaceService.getWorkspaceService(
      req.workspaceId,
    );

    if (!workspace) {
      res.status(404).json({
        error: "Workspace not found",
      });
      return;
    }

    // Successful response
    res.status(200).json(workspace);
  } catch (err: unknown) {
    console.error("Get workspace error:", err);

    res.status(500).json({
      error: "Failed to get workspace",
    });
  }
};

// ------------------
// Hard delete a workspace (owner-only)
// ------------------

const deleteWorkspaceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await workspaceService.deleteWorkspaceService(
      req.workspaceId,
    );

    // Successful response
    res.status(200).json({
      message: "Workspace successfully deleted",
      id: result.id,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Workspace not found") {
      res.status(404).json({
        error: "Workspace not found",
      });
      return;
    }

    console.error("Delete workspace error:", err);

    res.status(500).json({
      error: "Failed to delete workspace",
    });
  }
};

// ------------------
// Invite a member to workspace (owner-only)
// ------------------

const addMemberController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId, role = "member" } = req.body;

  const roleNormalized = String(role || "").trim();

  // Validate user ID
  if (!validator.isUUID(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  // Validate role
  if (!isMemberRole(roleNormalized)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  try {
    const members = await workspaceService.addMemberService(
      req.workspaceId,
      userId,
      roleNormalized,
    );

    // Successful response
    res.status(201).json(members);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "23505"
    ) {
      res.status(400).json({ error: "User already a member" });
      return;
    }

    console.error(err);

    res.status(500).json({ error: "Failed to add member" });
  }
};

// ------------------
// Change member role (owner-only)
// ------------------

const updateMemberRoleController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const targetUserId = req.params.userId;
  const { role } = req.body;
  const roleNormalized = String(role || "").trim();

  if (typeof targetUserId !== "string") {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  // Validate user ID
  if (!validator.isUUID(targetUserId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  // Validate role
  if (!isMemberRole(roleNormalized)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  try {
    const member = await workspaceService.updateMemberRoleService(
      req.workspaceId,
      targetUserId,
      roleNormalized,
    );

    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    // Successful response
    res.json(member);
  } catch (err: unknown) {
    console.error(err);

    res.status(500).json({ error: "Failed to update member role" });
  }
};

// ------------------
// Remove member (owner only)
// ------------------

const removeMemberController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const targetUserId = req.params.userId;

  if (typeof targetUserId !== "string") {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  // Validate user ID
  if (!validator.isUUID(targetUserId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  try {
    const removed = await workspaceService.removeMemberService(
      req.workspaceId,
      targetUserId,
    );

    if (!removed) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    // Successful response
    res.status(200).json({ message: "Member successfully removed" });
  } catch (err: unknown) {
    console.error(err);

    res.status(500).json({ error: "Failed to remove member" });
  }
};

export {
  createWorkspaceController,
  renameWorkspaceController,
  getAllWorkspacesController,
  getWorkspaceController,
  deleteWorkspaceController,
  addMemberController,
  updateMemberRoleController,
  removeMemberController,
};
