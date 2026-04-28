const pool = require("../db");
const { hasRole } = require("../utils/permissions");

const workspaceAuth = (requiredRole = "viewer") => {
  return async (req, res, next) => {
    const workspaceId = req.params.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required" });
    }

    try {
      // Fetch membership directly from DB
      const result = await pool.query(
        `
        SELECT w.id, wm.role
        FROM workspaces w
        JOIN workspace_members wm
          ON w.id = wm.workspace_id
        WHERE w.id = $1
          AND wm.user_id = $2
          AND w.deleted_at is NULL
        `,
        [workspaceId, req.user.id],
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: "Not a workspace member" });
      }

      const { id, role } = result.rows[0];

      // Checks if authenticaed user has the required workspace permissions, if not, return error
      if (!hasRole(role, requiredRole)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // Saves workspace and member role in a request
      req.workspace = { id };
      req.memberRole = role;

      next();
    } catch (err) {
      console.error("Workspace auth error:", err);
      res.status(500).json({ error: "Authorization failed" });
    }
  };
};

module.exports = { workspaceAuth };
