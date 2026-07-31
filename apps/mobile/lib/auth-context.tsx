import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@eve-os/types";
import { apiClient } from "./api-client";
import type { AuthResponse } from "./api-types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// No persisted session across app restarts (no AsyncStorage/SecureStore
// dependency yet) — the team logs in again each time the app is opened.
// A real, disclosed limitation for this first version, not an oversight;
// see docs/08-roadmap.md.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  async function login(email: string, password: string) {
    const result = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    setUser(result.user);
    setAccessToken(result.accessToken);
  }

  function logout() {
    setUser(null);
    setAccessToken(null);
  }

  return <AuthContext.Provider value={{ user, accessToken, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
