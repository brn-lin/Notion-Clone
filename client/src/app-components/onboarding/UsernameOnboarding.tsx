import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import type { User } from "../../types/auth";
import "./UsernameOnboarding.css";

const UsernameOnboarding = () => {
  const { user, setUser, authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Don't show anything while authentication is being determined
  if (authLoading) {
    return null;
  }

  // No authenticated user
  if (!user) {
    return null;
  }

  // User already has a username
  if (user.username !== null) {
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
      const res = await api.patch<User>("/auth/me/username", {
        username: usernameNormalized,
      });

      // Update AuthContext with the user returned by the backend
      setUser(res.data);

      // Navigate to editor once username setup is complete
      navigate("/editor");
    } catch (err: any) {
      console.error("Failed to update username:", err);

      setError(
        err.response?.data?.error ||
          "Failed to create username. Please try again.",
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
