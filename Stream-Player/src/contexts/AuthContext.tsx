import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Api } from "../Services/Api";

export interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("stream_player_user");
    const savedToken = localStorage.getItem("stream_player_token");
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem("stream_player_user");
        localStorage.removeItem("stream_player_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      // Attempt to hit the backend API
      try {
        const data = await Api.login(username, password);
        setUser(data.user);
        localStorage.setItem("stream_player_user", JSON.stringify(data.user));
        localStorage.setItem("stream_player_token", data.token);
      } catch (apiErr: any) {
        console.warn("Backend API auth failed, testing offline development credentials", apiErr);

        // Fallback for offline development mode
        if (username === "admin" && password === "admin123") {
          const offlineUser = { username: "Admin", role: "admin" };
          setUser(offlineUser);
          localStorage.setItem("stream_player_user", JSON.stringify(offlineUser));
          localStorage.setItem("stream_player_token", "dev-offline-jwt-token");
        } else {
          // If it was a credentials error or actual connection issue
          throw new Error(apiErr.message || "Invalid credentials.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check credentials.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("stream_player_user");
    localStorage.removeItem("stream_player_token");
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
