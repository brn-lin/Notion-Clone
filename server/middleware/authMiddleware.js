const jwt = require("jsonwebtoken");
const pool = require("../db");

// Middleware to protect routes
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is deleted
    const userResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [decoded.id],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Account deleted" });
    }

    // Saves decoded JWT payload in a request
    req.user = decoded;

    next();
  } catch (err) {
    console.log("JWT verification error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware };
