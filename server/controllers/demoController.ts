import type { Request, Response } from "express";
import { resetDemoWorkspace } from "../services/demoService.js";
import { getUser } from "../utils/getUser.js";

// ------------------
// Reset Demo workspace
// ------------------

const resetDemoController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = getUser(req);

    const workspaceId = await resetDemoWorkspace(user.id);

    res.json({ workspaceId });
  } catch (err: unknown) {
    console.error("Reset demo error:", err);

    const message = err instanceof Error ? err.message : "";

    if (message === "Demo workspace membership missing") {
      res.status(500).json({ error: message });
      return;
    }

    res.status(500).json({ error: "Failed to reset demo workspace" });
  }
};

export default resetDemoController;
