const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

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

module.exports = router;
