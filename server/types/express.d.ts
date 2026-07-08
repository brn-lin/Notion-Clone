import type { AuthTokenPayload } from "../middleware/authMiddleware.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      workspaceId: string;
    }
  }
}

export {};
