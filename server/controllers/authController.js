const authService = require("../services/authService");

// ------------------
// Signup
// ------------------

const signup = async (req, res) => {
  const { email, password } = req.body;

  // Checks if email and password is a string
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Checks if there is an email and password
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await authService.signup(email, password);

    // Successful response
    res.status(201).json(result);
  } catch (err) {
    console.error("Signup error:", err);

    if (err.message === "Email already in use") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};

// ------------------
// Login
// ------------------

const login = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password is a string
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Check if email or password is present
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await authService.login(email, password);

    // Successful response
    res.json(result);
  } catch (err) {
    console.error("Login error:", err);

    if (err.message === "Invalid credentials") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to login" });
  }
};

// ------------------
// Reactivate account (Within 30 days)
// ------------------

const reactivateAccount = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password is a string
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Check if email or password is present
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await authService.reactivateAccount(email, password);

    res.json(result);
  } catch (err) {
    console.error("Reactivation error:", err.message);

    const knownErrors = [
      "Invalid credentials",
      "Account is already active",
      "Account permanently deleted",
    ];

    if (knownErrors.includes(err.message)) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to reactivate account" });
  }
};

// ------------------
// Get current user
// ------------------

const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    // Successful response
    res.json(user);
  } catch (err) {
    console.error("Get current user error:", err);

    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ------------------
// Soft delete current user
// ------------------

const softDeleteCurrentUser = async (req, res) => {
  try {
    const result = await authService.softDeleteCurrentUser(req.user.id);

    // Successful response
    res.json(result);
  } catch (err) {
    console.error("Soft delete current user error:", err);

    if (err.message === "User not found or user already deleted") {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to delete account" });
  }
};

module.exports = {
  signup,
  login,
  reactivateAccount,
  getCurrentUser,
  softDeleteCurrentUser,
};
