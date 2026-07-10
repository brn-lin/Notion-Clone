import express, { type Request, type Response } from "express";
import "dotenv/config"; // Load .env variables
import cors from "cors";

import pool from "./db.js";

import demoRoutes from "./routes/demoRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";

import "./jobs/cleanUpJobs.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ------------------
// Middleware
// ------------------

// Enable CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://notion-clone-lilac-two.vercel.app",
    ],
    credentials: true,
  }),
);

// Parse JSON bodies
app.use(express.json());

// ------------------
// Test route
// ------------------

app.get("/", (_req: Request, res: Response) => {
  res.send("Notion Clone API is running!");
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/ready", async (_req: Request, res: Response): Promise<void> => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({ status: "ready" });
  } catch (err) {
    console.error("Readiness check failed:", err);

    res.status(503).json({ status: "not ready" });
  }
});

// ------------------
// Demo Routes
// ------------------
app.use("/demo", demoRoutes);

// ------------------
// Auth Routes
// ------------------

app.use("/auth", authRoutes);

// ------------------
// Workspace Routes
// ------------------

app.use("/workspaces", workspaceRoutes);

// ------------------
// Item Routes (For pages & blocks)
// ------------------
app.use("/workspaces", itemRoutes);

// ------------------
// Start server
// ------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
