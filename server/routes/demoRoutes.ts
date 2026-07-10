import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import resetDemoController from "../controllers/demoController.js";

const router = express.Router();

// ------------------
// Reset Demo workspace
// ------------------

router.post("/reset", authMiddleware, resetDemoController);

export default router;
