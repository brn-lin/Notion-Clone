const cron = require("node-cron");
const pool = require("../db");

// ------------------
// Nightly hard delete clean up
// ------------------

// Run every day at midnight
const nightlyCleanUp = cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running nightly clean up job...");

    // Hard delete users
    const usersResult = await pool.query(
      `
      DELETE FROM users
      WHERE deleted_at IS NOT NULL
         AND deleted_at < NOW() - INTERVAL '30 days'
      `,
    );

    // Hard delete workspaces
    const workspacesResult = await pool.query(
      `
      DELETE FROM workspaces
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '30 days'
      `,
    );

    // Hard delete items
    const itemsResult = await pool.query(
      `
      DELETE FROM items
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '30 days'
      `,
    );

    console.log(
      `Clean up complete: ${usersResult.rowCount} users, ${workspacesResult.rowCount} workspaces, and 
      ${itemsResult.rowCount} items deleted.`,
    );
  } catch (err) {
    console.error("Clean up cron error:", err);
  }
});

module.exports = nightlyCleanUp;
