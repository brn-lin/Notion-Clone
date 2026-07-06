import type { Request } from "express";
import type { AuthTokenPayload } from "../middleware/authMiddleware.js";

export function getUser(req: Request): AuthTokenPayload {
  if (!req.user) {
    throw new Error("Unauthorized");
  }

  return req.user;
}
