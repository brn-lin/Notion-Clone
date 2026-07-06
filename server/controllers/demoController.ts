import { resetDemoWorkspace } from "../services/demoService.js";
import type { Request, Response } from "express";

type AuthRequest = Request & {
  user: {
    id: string;
  };
};

// ------------------
// Reset Demo workspace
// ------------------

export const resetDemoController = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = await resetDemoWorkspace(req.user.id);

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
