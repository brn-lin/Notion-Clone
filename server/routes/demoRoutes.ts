import express from "express";
const router = express.Router();

import { resetDemoController } from "../controllers/demoController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

// ------------------
// Reset Demo workspace
// ------------------

router.post("/reset", authMiddleware, resetDemoController);
