const pool = require("../db");

// ------------------
// Create a new workspace
// ------------------

const createWorkspaceService = async ({ name, ownerId }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert into workspaces table
    const workspaceResult = await client.query(
      `
      INSERT INTO workspaces (name, owner_id)
      Values ($1, $2)
      RETURNING *
      `,
      [name, ownerId],
    );

    const workspace = workspaceResult.rows[0];

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
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Rename workspace
// ------------------

const renameWorkspaceService = async (workspaceId, name) => {
  const result = await pool.query(
    `
    UPDATE workspaces
    SET name = $1
    WHERE id = $2
    RETURNING *
    `,
    [name, workspaceId],
  );

  return result.rows[0]; // undefined if not found
};

// ------------------
// Get all workspaces for current user
// ------------------

const getAllWorkspacesService = async (userId) => {
  const result = await pool.query(
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

const getWorkspaceService = async (workspaceId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM workspaces
    WHERE id = $1
    `,
    [workspaceId],
  );
  return result.rows[0];
};

// ------------------
// Hard delete a workspace by ID (And all pages in it)
// ------------------

const deleteWorkspaceService = async (workspaceId) => {
  const result = await pool.query(
    `
    DELETE FROM workspaces
    WHERE id = $1
    RETURNING id
    `,
    [workspaceId],
  );

  if (result.rowCount === 0) {
    throw new Error("Workspace not found");
  }

  return result.rows[0];
};

// ------------------
// Add a member to workspace
// ------------------

const addMemberService = async (workspaceId, userId, role) => {
  const result = await pool.query(
    `
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [workspaceId, userId, role],
  );
  return result.rows[0];
};

// ------------------
// Update a member's role
// ------------------

const updateMemberRoleService = async (workspaceId, userId, role) => {
  const result = await pool.query(
    `
    UPDATE workspace_members
    SET role = $1
    WHERE workspace_id = $2
      AND user_id = $3
    RETURNING *
    `,
    [role, workspaceId, userId],
  );
  return result.rows[0];
};

// ------------------
// Remove member from workspace
// ------------------

const removeMemberService = async (workspaceId, userId) => {
  const result = await pool.query(
    `
    DELETE FROM workspace_members
    WHERE workspace_id = $1
      AND user_id = $2
    RETURNING *
    `,
    [workspaceId, userId],
  );
  return result.rowCount > 0;
};

module.exports = {
  createWorkspaceService,
  renameWorkspaceService,
  getAllWorkspacesService,
  getWorkspaceService,
  deleteWorkspaceService,
  addMemberService,
  updateMemberRoleService,
  removeMemberService,
};
