const express = require("express");
require("dotenv").config(); // Load .env variables
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const pool = require("./db");

const demoRoutes = require("./routes/demoRoutes");
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const itemRoutes = require("./routes/itemRoutes");

require("./jobs/cleanUpJobs");

const app = express();
const PORT = process.env.PORT || 5000;

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
// Rate Limiting
// ------------------

// Global limiter (protects everything)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// ------------------
// Test route
// ------------------

app.get("/", (req, res) => {
  res.send("Notion Clone API is running!");
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
