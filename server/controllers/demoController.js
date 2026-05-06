const { resetDemoWorkspace } = require("../services/demoService");

// ------------------
// Reset Demo workspace
// ------------------

const resetDemoController = async (req, res) => {
  try {
    const workspaceId = await resetDemoWorkspace(req.user.id);

    res.json({ workspaceId });
  } catch (err) {
    console.error("Reset demo error:", err);
    res.status(500).json({ error: "Failed to reset demo workspace" });
  }
};

module.exports = { resetDemoController };
