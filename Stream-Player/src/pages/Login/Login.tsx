import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where to redirect after successful login
  const from = (location.state as any)?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Sync context auth errors with local error state
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setLocalError("Please fill in all fields.");
      return;
    }

    try {
      setLocalError(null);
      clearError();
      await login(username.trim(), password);
    } catch (err: any) {
      // Error is caught and set by context sync, but handle extra cases here
      setLocalError(err.message || "Invalid credentials.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-logo">
            Stream<span>Player</span>
          </div>
          <p className="login-subtitle">Enter your details to start streaming</p>

          {localError && (
            <div className="login-error-banner">
              <span className="error-icon">⚠️</span>
              <p>{localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. admin123"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-submit-btn">
              Sign In
            </button>
          </form>

          <div className="login-footer">
            <p>Demo Admin Credentials: <span className="credential-badge">admin</span> / <span className="credential-badge">admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
