import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./SignUp.css";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/signup", {
        email,
        password,
      });

      // Automatically log in
      const token = res.data.token;
      sessionStorage.setItem("token", token);

      navigate("/editor");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Sign up failed. Please try again.");
    }
  };

  return (
    <div className="signup__container">
      <form className="signup__form" onSubmit={handleSignUp}>
        <label className="signup__input-label">
          Email
          <input
            className="signup__input-field"
            type="email"
            placeholder="Enter email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="signup__input-label">
          Password
          <input
            className="signup__input-field"
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="signup__button" type="submit">
          Sign Up
        </button>
      </form>
      <div className="signup__login-row">
        <span className="signup__login-text">Existing user?</span>
        <span className="signup__login-link" onClick={() => navigate("/")}>
          Log in
        </span>
      </div>
    </div>
  );
}
export default SignUp;
