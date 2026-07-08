import pool from "../db.js";
import type { Request, Response, NextFunction } from "express";
import { hasRole, type Role } from "../utils/permissions.js";
import { getUser } from "../utils/getUser.js";
import type { AuthTokenPayload } from "./authMiddleware.js";

type WorkspaceMemberRow = {
  id: string;
  role: Role;
};

export const workspaceAuth = (requiredRole: Role = "viewer") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required" });
    }

    try {
      const user = getUser(req);

      // Fetch membership directly from DB
      const result = await pool.query<WorkspaceMemberRow>(
        `
        SELECT w.id, wm.role
        FROM workspaces w
        JOIN workspace_members wm
          ON w.id = wm.workspace_id
        WHERE w.id = $1
          AND wm.user_id = $2
        `,
        [workspaceId, user.id],
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: "Not a workspace member" });
      }

      const member = result.rows[0];

      if (!member) {
        return res.status(403).json({ error: "Not a workspace member" });
      }

      const { id, role } = member;

      // Checks if authenticaed user has the required workspace permissions, if not, return error
      if (!hasRole(role, requiredRole)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // Saves workspace and member role in a request
      req.workspaceId = id;
      req.memberRole = role;

      next();
    } catch (err: unknown) {
      console.error("Workspace auth error:", err);

      res.status(500).json({ error: "Authorization failed" });
    }
  };
};
