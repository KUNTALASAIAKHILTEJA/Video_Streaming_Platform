import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Stream<span>Player</span>
      </div>

      <nav className="sidebar-nav">
        <a href="/">Dashboard</a>
        <a href="/series">Series</a>
        <a href="/auditlog">Audit Log</a>
      </nav>

      <div className="sidebar-bottom">
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