"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiClient } from "./api-client";
import type { AuthResponse, User } from "./api-types";

const STORAGE_KEY = "eveOsAuth";

interface StoredAuth {
  user: User;
  accessToken: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  /** True until the initial read from localStorage completes — avoids a login-page flash on refresh. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { organizationId: string; email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setAuth(JSON.parse(raw) as StoredAuth);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  function persist(result: AuthResponse) {
    const next: StoredAuth = { user: result.user, accessToken: result.accessToken };
    setAuth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function login(email: string, password: string) {
    const result = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    persist(result);
  }

  async function register(input: { organizationId: string; email: string; password: string; name: string }) {
    const result = await apiClient.post<AuthResponse>("/auth/register", input);
    persist(result);
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        accessToken: auth?.accessToken ?? null,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
