const validator = require("validator");
const workspaceService = require("../services/workspaceService");

// ------------------
// Create a new workspace
// ------------------

const createWorkspaceController = async (req, res) => {
  const name = String(req.body.name || "").trim();

  // If name is empty, respond with 400 Bad Request
  if (!name) {
    return res.status(400).json({ error: "Workspace name required" });
  }

  try {
    const workspace = await workspaceService.createWorkspaceService({
      name,
      ownerId: req.user.id,
    });

    // Successful response
    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create workspace" });
  }
};

// ------------------
// Rename workspace (owner-only)
// ------------------

const renameWorkspaceController = async (req, res) => {
  const name = String(req.body.name || "").trim();

  // Validate input
  if (!name) {
    return res.status(400).json({ error: "Workspace name required" });
  }

  try {
    const workspace = await workspaceService.renameWorkspaceService(
      req.workspaceId,
      name,
    );

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    return res.status(200).json(workspace);
  } catch (err) {
    console.error("Rename workspace error:", err);
    return res.status(500).json({ error: "Failed to rename workspace" });
  }
};

// ------------------
// Get all workspaces for current user
// ------------------

const getAllWorkspacesController = async (req, res) => {
  try {
    const workspaces = await workspaceService.getAllWorkspacesService(
      req.user.id,
    );

    // Successful response
    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get workspaces" });
  }
};

// ------------------
// Get a single workspace by ID
// ------------------

const getWorkspaceController = async (req, res) => {
  try {
    const workspace = await workspaceService.getWorkspaceService(
      req.workspaceId,
    );

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    // Successful response
    return res.status(200).json(workspace);
  } catch (err) {
    console.error("Get workspace error:", err);

    return res.status(500).json({
      error: "Failed to get workspace",
    });
  }
};

// ------------------
// Hard delete a workspace (owner-only)
// ------------------

const deleteWorkspaceController = async (req, res) => {
  try {
    const result = await workspaceService.deleteWorkspaceService(
      req.workspaceId,
    );

    // Successful response
    return res.status(200).json({
      message: "Workspace successfully deleted",
      id: result.id,
    });
  } catch (err) {
    if (err.message === "Workspace not found") {
      return res.status(404).json({
        error: "Workspace not found",
      });
    }

    console.error("Delete workspace error:", err);

    return res.status(500).json({
      error: "Failed to delete workspace",
    });
  }
};

// ------------------
// Invite a member to workspace (owner-only)
// ------------------

const addMemberController = async (req, res) => {
  const { userId, role = "member" } = req.body;
  const roleNormalized = String(role || "").trim();

  // Validate user ID
  if (!validator.isUUID(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // Validate role
  if (!["member", "viewer"].includes(roleNormalized)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const members = await workspaceService.addMemberService(
      req.workspaceId,
      userId,
      roleNormalized,
    );

    // Successful response
    res.status(201).json(members);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "User already a member" });
    }

    console.error(err);
    res.status(500).json({ error: "Failed to add member" });
  }
};

// ------------------
// Change member role (owner-only)
// ------------------

const updateMemberRoleController = async (req, res) => {
  const targetUserId = req.params.userId;
  const { role } = req.body;
  const roleNormalized = String(role || "").trim();

  // Validate user ID
  if (!validator.isUUID(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // Validate role
  if (!["member", "viewer"].includes(roleNormalized)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const member = await workspaceService.updateMemberRoleService(
      req.workspaceId,
      targetUserId,
      roleNormalized,
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Successful response
    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update member role" });
  }
};

// ------------------
// Remove member (owner only)
// ------------------

const removeMemberController = async (req, res) => {
  const targetUserId = req.params.userId;

  // Validate user ID
  if (!validator.isUUID(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const removed = await workspaceService.removeMemberService(
      req.workspaceId,
      targetUserId,
    );

    if (!removed) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Successful response
    res.status(200).json({ message: "Member successfully removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove member" });
  }
};

module.exports = {
  createWorkspaceController,
  renameWorkspaceController,
  getAllWorkspacesController,
  getWorkspaceController,
  deleteWorkspaceController,
  addMemberController,
  updateMemberRoleController,
  removeMemberController,
};
