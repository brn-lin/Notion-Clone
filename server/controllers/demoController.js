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

    if (err.message === "Demo workspace membership missing") {
      return res.status(500).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to reset demo workspace" });
  }
};

module.exports = { resetDemoController };
