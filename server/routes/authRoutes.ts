import express from "express";
import rateLimit from "express-rate-limit";

import { authMiddleware } from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// ------------------
// Rate Limiters
// ------------------

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Try again later.",
});

// Signup rate limiter
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many accounts created. Try again later.",
});

// ------------------
// Sign up
// ------------------

router.post("/signup", signupLimiter, authController.signup);

// ------------------
// Login
// ------------------

router.post("/login", loginLimiter, authController.login);

// ------------------
// Reactivate account (Within 30 days)
// ------------------

router.post("/reactivate", authController.reactivateAccount);

// ------------------
// Get current user
// ------------------

router.get("/me", authMiddleware, authController.getCurrentUser);

// ------------------
// Soft delete current user
// ------------------

router.delete("/me", authMiddleware, authController.softDeleteCurrentUser);

export default router;
