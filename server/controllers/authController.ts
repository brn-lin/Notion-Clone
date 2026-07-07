import type { Request, Response } from "express";
import * as authService from "../services/authService.js";
import { getUser } from "../utils/getUser.js";

// ------------------
// Signup
// ------------------

const signup = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Checks if email and password is a string
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  // Checks if there is an email and password
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  try {
    const result = await authService.signup(email, password);

    // Successful response
    res.status(201).json(result);
  } catch (err: unknown) {
    console.error("Signup error:", err);

    if (err instanceof Error && err.message === "Email already in use") {
      res.status(400).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};

// ------------------
// Login
// ------------------

const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Check if email and password is a string
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  // Check if email or password is present
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  try {
    const result = await authService.login(email, password);

    // Successful response
    res.json(result);
  } catch (err: unknown) {
    console.error("Login error:", err);

    if (err instanceof Error && err.message === "Invalid credentials") {
      res.status(400).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Failed to login" });
  }
};

// ------------------
// Reactivate account (Within 30 days)
// ------------------

const reactivateAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  // Check if email and password is a string
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  // Check if email or password is present
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  try {
    const result = await authService.reactivateAccount(email, password);

    res.json(result);
  } catch (err: unknown) {
    console.error("Reactivation error:", err);

    if (err instanceof Error) {
      const knownErrors = [
        "Invalid credentials",
        "Account is already active",
        "Account permanently deleted",
      ];

      if (knownErrors.includes(err.message)) {
        res.status(400).json({ error: err.message });
        return;
      }
    }

    res.status(500).json({ error: "Failed to reactivate account" });
  }
};

// ------------------
// Get current user
// ------------------

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = getUser(req);

    const user = await authService.getCurrentUser(authUser.id);

    // Successful response
    res.json(user);
  } catch (err: unknown) {
    console.error("Get current user error:", err);

    if (err instanceof Error && err.message === "User not found") {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ------------------
// Soft delete current user
// ------------------

const softDeleteCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authUser = getUser(req);

    const result = await authService.softDeleteCurrentUser(authUser.id);

    // Successful response
    res.json(result);
  } catch (err: unknown) {
    console.error("Soft delete current user error:", err);

    if (
      err instanceof Error &&
      err.message === "User not found or user already deleted"
    ) {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Failed to delete account" });
  }
};

export {
  signup,
  login,
  reactivateAccount,
  getCurrentUser,
  softDeleteCurrentUser,
};
