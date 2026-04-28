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
      AND deleted_at IS NULL
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
      AND w.deleted_at IS NULL
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
// Soft delete a workspace by ID (And all pages in it)
// ------------------

const softDeleteWorkspaceService = async (workspaceId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify workspace exists and is not already deleted
    const existingWorkspace = await client.query(
      `
      SELECT id
      FROM workspaces
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [workspaceId],
    );

    if (existingWorkspace.rows.length === 0) {
      throw new Error("Workspace not found");
    }

    // Soft delete workspace
    await client.query(
      `
      UPDATE workspaces
      SET deleted_at = NOW()
      WHERE id = $1
      `,
      [workspaceId],
    );

    // Soft delete all pages in the workspace recursively
    await client.query(
      `
      WITH RECURSIVE page_tree AS (
        SELECT id from pages
        WHERE workspace_id = $1
          AND parent_id IS NULL
          AND deleted_at IS NULL
        
        UNION ALL

        SELECT p.id
        FROM pages p
        INNER JOIN page_tree pt
          ON p.parent_id = pt.id
        WHERE p.workspace_id = $1
      )

      UPDATE pages
      SET deleted_at = NOW()
      WHERE id IN (SELECT id FROM page_tree)
        AND deleted_at IS NULL
      `,
      [workspaceId],
    );

    await client.query("COMMIT");

    // Return soft deleted workspace ID
    return { id: workspaceId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Restore a soft deleted workspace and all pages in it (Within 30 days)
// ------------------

const restoreWorkspaceService = async (workspaceId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch workspace
    const workspaceResult = await client.query(
      `
      SELECT id, deleted_at
      FROM workspaces
      WHERE id = $1
      `,
      [workspaceId],
    );

    if (workspaceResult.rows.length === 0) {
      throw new Error("Workspace not found");
    }

    const workspace = workspaceResult.rows[0];

    // Workspace must be deleted
    if (!workspace.deleted_at) {
      throw new Error("Workspace is not deleted");
    }

    // Check 30 day restore window
    const expiredResult = await client.query(
      `
      SELECT NOW() - $1::timestamp > INTERVAL '30 days' AS expired
      `,
      [workspace.deleted_at],
    );

    if (expiredResult.rows[0].expired) {
      throw new Error("Restore window expired");
    }

    // Restore workspace
    await client.query(
      `
      UPDATE workspaces
      SET deleted_at = NULL
      WHERE id = $1
      `,
      [workspaceId],
    );

    // Restore only pages that were deleted with the workspace
    await client.query(
      `
      WITH RECURSIVE page_tree AS (
        SELECT id
        FROM pages
        WHERE workspace_id = $1
          AND parent_id IS NULL
        
        UNION ALL

        SELECT p.id
        FROM pages p
        INNER JOIN page_tree pt
          ON p.parent_id = pt.id
        WHERE p.workspace_id = $1
      )

      UPDATE pages
      SET deleted_at = NULL
      WHERE id IN (SELECT id FROM page_tree)
        AND deleted_at IS NOT NULL
        AND deleted_at >= $2
      `,
      [workspaceId, workspace.deleted_at],
    );

    await client.query("COMMIT");

    return { id: workspaceId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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
  softDeleteWorkspaceService,
  restoreWorkspaceService,
  addMemberService,
  updateMemberRoleService,
  removeMemberService,
};
