import type { Request } from "express";

export const getWorkspaceId = (req: Request): string => {
  if (!req.workspaceId) {
    throw new Error("Workspace ID missing");
  }

  return req.workspaceId;
};
