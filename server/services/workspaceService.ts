import pool from "../db.js";
import type { Role } from "../utils/permissions.js";

type Workspace = {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
};

type WorkspaceMember = {
  workspace_id: string;
  user_id: string;
  role: Role;
};

type CreateWorkspaceInput = {
  name: string;
  ownerId: string;
};

type DeletedWorkspace = {
  id: string;
};

// ------------------
// Create a new workspace
// ------------------

const createWorkspaceService = async ({
  name,
  ownerId,
}: CreateWorkspaceInput): Promise<Workspace> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert into workspaces table
    const workspaceResult = await client.query<Workspace>(
      `
      INSERT INTO workspaces (name, owner_id)
      Values ($1, $2)
      RETURNING *
      `,
      [name, ownerId],
    );

    const workspace = workspaceResult.rows[0];

    if (!workspace) {
      throw new Error("Failed to create workspace");
    }

    // Add owner as workspace member
    await client.query(
      `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, 'owner')
      `,
      [workspace.id, ownerId],
    );

    await client.query("COMMIT");

    return workspace;
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Rename workspace
// ------------------

const renameWorkspaceService = async (
  workspaceId: string,
  name: string,
): Promise<Workspace | undefined> => {
  const result = await pool.query<Workspace>(
    `
    UPDATE workspaces
    SET name = $1
    WHERE id = $2
    RETURNING *
    `,
    [name, workspaceId],
  );

  return result.rows[0]; // returns undefined if not found
};

// ------------------
// Get all workspaces for current user
// ------------------

const getAllWorkspacesService = async (
  userId: string,
): Promise<Workspace[]> => {
  const result = await pool.query<Workspace>(
    `
    SELECT w.*
    FROM workspaces w
    JOIN workspace_members wm
      ON w.id = wm.workspace_id
    WHERE wm.user_id = $1
    `,
    [userId],
  );

  return result.rows;
};

// ------------------
// Get a single workspace by ID
// ------------------

const getWorkspaceService = async (
  workspaceId: string,
): Promise<Workspace | undefined> => {
  const result = await pool.query<Workspace>(
    `
    SELECT *
    FROM workspaces
    WHERE id = $1
    `,
    [workspaceId],
  );

  return result.rows[0]; // returns undefined if not found
};

// ------------------
// Hard delete a workspace by ID (And all pages in it)
// ------------------

const deleteWorkspaceService = async (
  workspaceId: string,
): Promise<DeletedWorkspace> => {
  const result = await pool.query<DeletedWorkspace>(
    `
    DELETE FROM workspaces
    WHERE id = $1
    RETURNING id
    `,
    [workspaceId],
  );

  const workspace = result.rows[0];

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
};

// ------------------
// Add a member to workspace
// ------------------

const addMemberService = async (
  workspaceId: string,
  userId: string,
  role: Role,
): Promise<WorkspaceMember> => {
  const result = await pool.query<WorkspaceMember>(
    `
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [workspaceId, userId, role],
  );

  const member = result.rows[0];

  if (!member) {
    throw new Error("Failed to add member");
  }

  return member;
};

// ------------------
// Update a member's role
// ------------------

const updateMemberRoleService = async (
  workspaceId: string,
  userId: string,
  role: Role,
): Promise<WorkspaceMember | undefined> => {
  const result = await pool.query<WorkspaceMember>(
    `
    UPDATE workspace_members
    SET role = $1
    WHERE workspace_id = $2
      AND user_id = $3
    RETURNING *
    `,
    [role, workspaceId, userId],
  );

  return result.rows[0]; // returns undefined if not found
};

// ------------------
// Remove member from workspace
// ------------------

const removeMemberService = async (
  workspaceId: string,
  userId: string,
): Promise<boolean> => {
  const result = await pool.query(
    `
    DELETE FROM workspace_members
    WHERE workspace_id = $1
      AND user_id = $2
    RETURNING *
    `,
    [workspaceId, userId],
  );

  if (result.rowCount === null) {
    return false;
  }

  return result.rowCount > 0;
};

export {
  createWorkspaceService,
  renameWorkspaceService,
  getAllWorkspacesService,
  getWorkspaceService,
  deleteWorkspaceService,
  addMemberService,
  updateMemberRoleService,
  removeMemberService,
};
