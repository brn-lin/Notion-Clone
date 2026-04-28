const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const { resetDemoWorkspace } = require("./demoService");

// ------------------
// Signup
// ------------------

const signup = async (email, password) => {
  const emailNormalized = email.toLowerCase().trim();

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // Insert new user
    const result = await pool.query(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email
      `,
      [emailNormalized, passwordHash],
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (err) {
    // Handle unique constraint violation
    if (err.code === "23505") {
      throw new Error("Email already in use");
    }

    throw err;
  }
};

// ------------------
// Login
// ------------------

const login = async (email, password) => {
  const emailNormalized = email.toLowerCase().trim();

  // Fetch user by email
  const result = await pool.query(
    `
      SELECT id, email, password_hash, is_demo
      FROM users
      WHERE email = $1
        AND deleted_at IS NULL
      `,
    [emailNormalized],
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  if (user.is_demo) {
    await resetDemoWorkspace(user.id);
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

// ------------------
// Reactivate account (Within 30 days)
// ------------------

const reactivateAccount = async (email, password) => {
  const emailNormalized = email.toLowerCase().trim();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT id, email, password_hash, deleted_at
      FROM users
      WHERE email = $1
      `,
      [emailNormalized],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = result.rows[0];

    // Must be soft deleted to reactivate
    if (!user.deleted_at) {
      throw new Error("Account is already active");
    }

    // Check 30 day window
    const deletionExpired = await client.query(
      `SELECT NOW() - $1::timestamp > INTERVAL '30 days' AS expired`,
      [user.deleted_at],
    );

    if (deletionExpired.rows[0].expired) {
      throw new Error("Account permanently deleted");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Reactivate user account
    await client.query(
      `
      UPDATE users
      SET deleted_at = NULL
      WHERE id = $1
      `,
      [user.id],
    );

    // Reactivate owned workspaces
    await client.query(
      `
      UPDATE workspaces
      SET deleted_at = NULL
      WHERE owner_id = $1
        AND deleted_at IS NOT NULL
      `,
      [user.id],
    );

    await client.query("COMMIT");

    // Issue new JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return {
      message: "Account and owned workspaces reactivated",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Get current user
// ------------------

const getCurrentUser = async (userId) => {
  const result = await pool.query(
    `
      SELECT id, email
      FROM users
      WHERE id = $1
        AND deleted_at IS NULL
      `,
    [userId],
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  return result.rows[0];
};

// ------------------
// Soft delete current user
// ------------------

const softDeleteCurrentUser = async (userId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Soft delete user
    const userResult = await client.query(
      `
      UPDATE users
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id
      `,
      [userId],
    );

    if (userResult.rowCount === 0) {
      throw new Error("User not found or user already deleted");
    }

    // Soft delete workspaces owned by user
    await client.query(
      `
      UPDATE workspaces
      SET deleted_at =  NOW()
      WHERE owner_id = $1
        AND deleted_at IS NULL
      `,
      [userId],
    );

    await client.query("COMMIT");

    return {
      message: "Account and owned workspaces scheduled for deletion",
      deletion_effective_in_days: 30,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  signup,
  login,
  reactivateAccount,
  getCurrentUser,
  softDeleteCurrentUser,
};
