import { resetDemoWorkspace } from "../services/demoService.js";
import type { Request, Response } from "express";
import { getUser } from "../utils/getUser.js";

// ------------------
// Reset Demo workspace
// ------------------

export const resetDemoController = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);

    const workspaceId = await resetDemoWorkspace(user.id);

    res.json({ workspaceId });
  } catch (err: unknown) {
    console.error("Reset demo error:", err);

    const message = err instanceof Error ? err.message : "";

    if (message === "Demo workspace membership missing") {
      return res.status(500).json({ error: message });
    }

    res.status(500).json({ error: "Failed to reset demo workspace" });
  }
};
