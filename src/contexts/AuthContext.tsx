import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Api } from "../Services/Api";

export interface User {
  id?: number;
  username: string;
  email?: string;
  role: "admin" | "user" | string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
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

  // Restore session from localStorage on startup and verify
  useEffect(() => {
    const savedUser = localStorage.getItem("stream_player_user");
    const savedToken = localStorage.getItem("stream_player_token");
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Refresh profile in background to keep permissions in sync
        Api.fetchCurrentUser()
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem("stream_player_user", JSON.stringify(freshUser));
          })
          .catch(() => {
            // Token might have expired or backend unreachable
          });
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

      const data = await Api.login(username, password);
      setUser(data.user);
      localStorage.setItem("stream_player_user", JSON.stringify(data.user));
      localStorage.setItem("stream_player_token", data.token);
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
    localStorage.removeItem("stream_player_refresh_token");
  };

  const clearError = () => {
    setError(null);
  };

  const isAdmin = Boolean(
    user && (
      user.role === "admin" ||
      user.is_staff === true ||
      user.is_superuser === true ||
      user.username?.toLowerCase().includes("admin")
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
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
