const express = require("express");
const router = express.Router();

const { resetDemoController } = require("../controllers/demoController");
const { authMiddleware } = require("../middleware/authMiddleware");

// ------------------
// Reset Demo workspace
// ------------------

router.post("/reset", authMiddleware, resetDemoController);

module.exports = router;
