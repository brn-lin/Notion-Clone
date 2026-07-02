import jwt from "jsonwebtoken";
import pool from "../db.js";
import type { Request, Response, NextFunction } from "express";

type AuthTokenPayload = {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
};

type AuthRequest = Request & {
  user?: AuthTokenPayload;
};

// Middleware to protect routes
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is missing.");
    }

    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload &
      AuthTokenPayload;

    // Check if user is deleted
    const userResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
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
    if (err instanceof Error) {
      console.log("JWT verification error:", err.message);
    } else {
      console.log("Unknown error:", err);
    }
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
