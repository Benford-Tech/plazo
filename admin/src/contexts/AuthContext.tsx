import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminApi, ApiError, clearTokens, clearViewAs, getTokens, getViewAs, setTokens, setViewAs, VIEW_AS_ENDED_EVENT, VIEW_AS_STORAGE_KEY } from "@/lib/api";
import type { Staff, TokenData } from "@/lib/types";

interface AuthContextType {
  user: Staff | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Opens a session already issued by the API (e.g. after accepting an invitation). */
  signIn: (tokenData: TokenData, user: Staff) => void;
  logout: () => Promise<void>;
  /** Drops the local session without calling the API (e.g. after a password change revoked it). */
  forget: () => void;
  /** Reads the signed-in person again (e.g. after confirming the email). */
  refresh: () => Promise<void>;
  /** Platform admin: act inside an operator's space. Callers clear the query cache. */
  startViewAs: (operatorId: string) => Promise<void>;
  /** Back to the platform (the view-as session is revoked). Callers clear the query cache. */
  stopViewAs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchMe = useCallback(async () => {
    try {
      setUser(await adminApi.getMe());
    } catch (err) {
      // An ended view-as session leaves the person's own session alone (the page reloads).
      if (err instanceof ApiError && err.code === "view_as_ended") return;
      clearTokens();
      clearViewAs();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getTokens()?.access?.token) fetchMe();
    else setIsLoading(false);
  }, [fetchMe]);

  // An expired view-as session: start again from the platform space, with nothing cached.
  useEffect(() => {
    const ended = () => window.location.assign(`${import.meta.env.BASE_URL}plateforme`);
    window.addEventListener(VIEW_AS_ENDED_EVENT, ended);
    return () => window.removeEventListener(VIEW_AS_ENDED_EVENT, ended);
  }, []);

  // The consultation is shared by every tab: another tab that opens another parking (or goes back to its own space)
  // makes this one follow, with nothing cached from the parking it showed, instead of showing one parking's name
  // over another parking's data.
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (e.key !== VIEW_AS_STORAGE_KEY && e.key !== null) return;
      queryClient.clear();
      void fetchMe();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [fetchMe, queryClient]);

  const login = async (email: string, password: string) => {
    const data = await adminApi.login(email, password);
    clearViewAs();
    setTokens(data.tokenData);
    setUser(data.user);
  };

  const signIn = (tokenData: TokenData, next: Staff) => {
    clearViewAs();
    setTokens(tokenData);
    setUser(next);
  };

  const forget = () => {
    clearTokens();
    clearViewAs();
    setUser(null);
  };

  const endViewAsSession = async () => {
    const session = getViewAs();
    clearViewAs();
    if (session) await adminApi.endViewAs(session.token).catch(() => undefined);
  };

  const logout = async () => {
    await endViewAsSession();
    await adminApi.logout().catch(() => undefined);
    forget();
  };

  const startViewAs = async (operatorId: string) => {
    const { access, operator } = await adminApi.startViewAs(operatorId);
    // Going straight from one parking to another (10/11/2026): the new consultation is in place before the previous
    // one is closed, so no call goes out meanwhile with the person's own session (24/11/2026).
    const previous = getViewAs();
    setViewAs({ token: access.token, expires: access.expires, operator });
    if (previous) await adminApi.endViewAs(previous.token).catch(() => undefined);
    await fetchMe();
  };

  const stopViewAs = async () => {
    await endViewAsSession();
    await fetchMe();
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signIn, logout, forget, refresh: fetchMe, startViewAs, stopViewAs }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
