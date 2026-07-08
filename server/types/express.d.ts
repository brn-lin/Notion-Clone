import type { AuthTokenPayload } from "../middleware/authMiddleware.js";
import type { Role } from "../utils/permissions.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      workspaceId?: string;
      memberRole?: Role;
    }
  }
}

export {};
