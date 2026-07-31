"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, colors, spacing } from "@eve-os/ui";
import { useAuth } from "../lib/auth-context";

const NAV_LINKS = [
  { href: "/styles", label: "Estilos" },
  { href: "/materials", label: "Materiais" },
  { href: "/venues", label: "Espaços" },
  { href: "/suppliers", label: "Fornecedores" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: `1px solid ${colors.border}`,
          padding: spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: spacing.md,
        }}
      >
        <Link href="/" style={{ color: colors.textPrimary, fontWeight: "bold", textDecoration: "none" }}>
          EVE OS Admin
        </Link>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: colors.textPrimary }}>
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {user && <p style={{ color: colors.textMuted, fontSize: "0.85rem", margin: 0 }}>{user.email}</p>}
          <Button variant="ghost" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: spacing.xl }}>{children}</main>
    </div>
  );
}
