const pool = require("../db");

const resetDemoWorkspace = async (demoUserId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Delete existing demo data
    await client.query(
      `
      DELETE FROM items
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = $1
      )
      `,
      [demoUserId],
    );

    await client.query(
      `
      DELETE FROM workspace_members
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = $1
      )
      `,
      [demoUserId],
    );

    await client.query(
      `
      DELETE FROM workspaces
      WHERE owner_id = $1
      `,
      [demoUserId],
    );

    // Recreate workspace
    const workspaceResult = await client.query(
      `
      INSERT INTO workspaces (name, owner_id)
      VALUES ('Demo Workspace', $1)
      RETURNING id
      `,
      [demoUserId],
    );

    const workspaceId = workspaceResult.rows[0].id;

    // Make user owner of workspace
    await client.query(
      `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, 'owner')
      `,
      [workspaceId, demoUserId],
    );

    // Seed starter page
    const pageResult = await client.query(
      `
      INSERT INTO items (
        workspace_id,
        parent_id,
        type,
        title,
        content,
        position,
        created_by
      )
      VALUES ($1, NULL, 'page', 'Demo page', '{}', 1000, $2)
      RETURNING id
      `,
      [workspaceId, demoUserId],
    );

    const pageId = pageResult.rows[0].id;

    // Seed starter block
    await client.query(
      `
      INSERT INTO items (
        workspace_id,
        parent_id,
        type,
        title,
        content,
        position,
        created_by
      )
      VALUES ($1, $2, 'block', NULL, '{"text":"Try editing this block"}', 1000, $3)
      `,
      [workspaceId, pageId, demoUserId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { resetDemoWorkspace };
