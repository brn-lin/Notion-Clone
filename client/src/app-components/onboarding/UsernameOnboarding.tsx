import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import api from "../../api/axios";
import type { User } from "../../types/auth";
import type { Workspace } from "../../types/workspace";
import "./UsernameOnboarding.css";

const UsernameOnboarding = () => {
  const { user, setUser, authLoading } = useAuth();
  const { setWorkspaceId, setWorkspaceName } = useWorkspace();

  const [username, setUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Populate the input if the user already has a saved username
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  // Don't show anything while authentication is being determined
  if (authLoading) {
    return null;
  }

  // No authenticated user
  if (!user) {
    return null;
  }

  const handleSubmit = async () => {
    const usernameNormalized = username.trim().toLowerCase();

    // Don't allow an empty username
    if (!usernameNormalized) {
      setError("Username required");
      return;
    }

    setUsernameLoading(true);
    setError("");

    try {
      // Step 1: Save the username if the user doesn't already have one
      if (!user.username) {
        const userRes = await api.patch<User>("/auth/me/username", {
          username: usernameNormalized,
        });

        // Update AuthContext with the user returned by the backend
        setUser(userRes.data);
      }

      // Step 2: Check whether the user already has a workspace
      const workspacesRes = await api.get<Workspace[]>("/workspaces");

      let workspace = workspacesRes.data[0];

      // Step 3: Create a workspace if the user doesn't have one
      if (!workspace) {
        const workspaceRes = await api.post<Workspace>("/workspaces", {
          name: `${usernameNormalized}'s Space`,
        });

        workspace = workspaceRes.data;
      }

      // Create the default page for the default workspace
      await api.post(`/workspaces/${workspace.id}/items`, {
        type: "page",
        title: "New Page",
        parentId: null,
      });

      // Step 4: Update WorkspaceContext
      setWorkspaceId(workspace.id);
      setWorkspaceName(workspace.name);

      // Step 5: Navigate to the editor once workspace setup succeeds
      navigate("/editor");
    } catch (err: any) {
      console.error("Failed to update username:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to complete account setup. Please try again.",
      );
    } finally {
      setUsernameLoading(false);
    }
  };

  return (
    <div className="username-onboarding">
      <div className="username-onboarding__content">
        <h2 className="username-onboarding__title">Create your username</h2>

        <p className="username-onboarding__text">
          Choose a username to complete your account setup.
        </p>

        <input
          className="username-onboarding__input"
          type="text"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={usernameLoading}
        />

        {error && <p className="username-onboarding__error">{error}</p>}

        <button
          className="username-onboarding__button"
          type="button"
          onClick={handleSubmit}
          disabled={usernameLoading}
        >
          {usernameLoading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default UsernameOnboarding;
