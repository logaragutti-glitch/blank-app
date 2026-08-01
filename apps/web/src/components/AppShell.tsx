"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, colors, spacing } from "@eve-os/ui";
import { useAuth } from "../lib/auth-context";

/** Shared header for every authenticated screen — nav + who's logged in + sign out. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${spacing.md} ${spacing.xl}`,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <nav style={{ display: "flex", gap: spacing.lg, alignItems: "baseline" }}>
          <Link href="/" style={{ color: colors.primary, fontWeight: 600, textDecoration: "none" }}>
            EVE OS
          </Link>
          <Link href="/projects/new" style={{ color: colors.textPrimary, textDecoration: "none" }}>
            Novo Projeto
          </Link>
          <Link href="/team" style={{ color: colors.textPrimary, textDecoration: "none" }}>
            Equipe
          </Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
          {user && <span style={{ color: colors.textMuted, fontSize: "0.9rem" }}>{user.name}</span>}
          <Button variant="ghost" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>
      <main style={{ padding: spacing.xl, maxWidth: 960, margin: "0 auto" }}>{children}</main>
    </div>
  );
}
