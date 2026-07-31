"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@eve-os/ui";
import { useAuth } from "./auth-context";

/** Wraps a page that requires an authenticated user, redirecting to /login otherwise. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { accessToken, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !accessToken) router.replace("/login");
  }, [loading, accessToken, router]);

  if (loading || !accessToken) {
    return <p style={{ color: colors.textMuted, padding: 40 }}>Um instante...</p>;
  }

  return <>{children}</>;
}
