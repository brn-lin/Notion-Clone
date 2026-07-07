import express from "express";
const router = express.Router();

import { authMiddleware } from "../middleware/authMiddleware.js";
import { resetDemoController } from "../controllers/demoController.js";

// ------------------
// Reset Demo workspace
// ------------------

router.post("/reset", authMiddleware, resetDemoController);
