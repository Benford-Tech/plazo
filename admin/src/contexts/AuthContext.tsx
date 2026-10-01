import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminApi, clearTokens, getTokens, setTokens } from "@/lib/api";
import type { Staff } from "@/lib/types";

interface AuthContextType {
  user: Staff | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Drops the local session without calling the API (e.g. after a password change revoked it). */
  forget: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      setUser(await adminApi.getMe());
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getTokens()?.access?.token) fetchMe();
    else setIsLoading(false);
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const data = await adminApi.login(email, password);
    setTokens(data.tokenData);
    setUser(data.user);
  };

  const forget = () => {
    clearTokens();
    setUser(null);
  };

  const logout = async () => {
    await adminApi.logout().catch(() => undefined);
    forget();
  };

  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, forget }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
