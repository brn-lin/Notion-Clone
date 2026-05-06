import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useWorkspace } from "../context/WorkspaceContext";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { setWorkspaceId } = useWorkspace();

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (sessionStorage.getItem("token")) {
      navigate("/editor");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.token;

      sessionStorage.setItem("token", token);

      // Clear old workspace in local storage
      setWorkspaceId(null);

      // Fetch user's workspace
      const wsRes = await api.get("/workspaces");

      const firstWorkspace = wsRes.data[0];

      if (firstWorkspace) {
        setWorkspaceId(firstWorkspace.id);
      } else {
        console.warn("No workspace found for user");
      }

      // Redirect to center editor
      navigate("/editor");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);

    try {
      // Wake up backend first
      await api.get("/ready");

      // Now login
      const res = await api.post("/auth/login", {
        email: "demo@example.com",
        password: "demo123",
      });

      const token = res.data.token;
      sessionStorage.setItem("token", token);

      const demoRes = await api.post("/demo/reset");

      const workspaceId = demoRes.data.workspaceId;

      setWorkspaceId(workspaceId);

      navigate("/editor");
    } catch (err) {
      console.error(err);
      alert("Demo login failed");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="login__container">
      <button
        className="login__demo-button"
        type="button"
        onClick={handleDemoLogin}
        disabled={demoLoading}
      >
        {demoLoading ? "Starting demo server..." : "Try Demo"}
      </button>
      <form className="login__form" onSubmit={handleLogin}>
        <label className="login__input-label">
          Email
          <input
            className="login__input-field"
            type="email"
            placeholder="Enter email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginLoading}
          />
        </label>

        <label className="login__input-label">
          Password
          <input
            className="login__input-field"
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginLoading}
          />
        </label>

        <button className="login__button" type="submit" disabled={loginLoading}>
          {loginLoading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="login__signup-row">
        <span className="login__signup-text">New user?</span>
        <span
          className="login__signup-link"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </span>
      </div>
    </div>
  );
}

export default Login;
