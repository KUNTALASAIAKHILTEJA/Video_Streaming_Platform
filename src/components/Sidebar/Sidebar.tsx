import { NavLink } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Stream<span>Player</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to="/series" className={({ isActive }) => (isActive ? "active" : "")}>
          Series
        </NavLink>
        {isAdmin && (
          <NavLink to="/auditlog" className={({ isActive }) => (isActive ? "active" : "")}>
            Audit Log
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        {user && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            marginBottom: "8px",
            fontSize: "0.85rem"
          }}>
            <span style={{ fontWeight: 600, color: "var(--text-color)" }}>👤 {user.username}</span>
            <span style={{
              fontSize: "0.72rem",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: 700,
              textTransform: "uppercase",
              background: isAdmin ? "rgba(229, 9, 20, 0.2)" : "rgba(33, 150, 243, 0.2)",
              color: isAdmin ? "#ff4d4f" : "#40a9ff",
              border: `1px solid ${isAdmin ? "rgba(229, 9, 20, 0.4)" : "rgba(33, 150, 243, 0.4)"}`
            }}>
              {isAdmin ? "Admin" : "User"}
            </span>
          </div>
        )}
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? (
            <>
              <span className="theme-icon">☀️</span>
              <span className="theme-text">Light Mode</span>
            </>
          ) : (
            <>
              <span className="theme-icon">🌙</span>
              <span className="theme-text">Dark Mode</span>
            </>
          )}
        </button>
        <button className="logout-btn" onClick={logout} aria-label="Logout">
          <span className="theme-icon">🚪</span>
          <span className="theme-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}