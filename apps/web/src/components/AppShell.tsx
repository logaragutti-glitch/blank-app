"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button, colors, radii, spacing } from "@eve-os/ui";
import { useAuth } from "../lib/auth-context";

// Items with no `href` have no real screen behind them yet — shown greyed
// out with an "em breve" badge instead of a dead link, so the sidebar
// matches the target layout without pretending a module is finished before
// it has real data behind it (Clientes/Financeiro/Relatórios/Biblioteca).
const NAV_ITEMS: { label: string; href?: string; icon: string }[] = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "Projetos", href: "/projects", icon: "📁" },
  { label: "Inspiração", href: "/inspiracao", icon: "💡" },
  { label: "Agenda", href: "/agenda", icon: "📅" },
  { label: "Clientes", href: "/clientes", icon: "🧑‍🤝‍🧑" },
  { label: "Fornecedores", href: "/fornecedores", icon: "🚚" },
  { label: "Financeiro", icon: "💰" },
  { label: "Relatórios", icon: "📊" },
  { label: "Biblioteca", href: "/biblioteca", icon: "📚" },
  { label: "Configurações", href: "/team", icon: "⚙️" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        padding: spacing.lg,
        boxSizing: "border-box",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", marginBottom: spacing.xl }}>
        <div style={{ color: colors.primary, fontWeight: 700, fontSize: "1.2rem", letterSpacing: "0.05em" }}>
          EVE OS
        </div>
        <div style={{ color: colors.textMuted, fontSize: "0.65rem", letterSpacing: "0.1em" }}>
          EVENT INTELLIGENCE OS
        </div>
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
        {NAV_ITEMS.map((item) => {
          const active = item.href ? isActive(pathname, item.href) : false;
          const content = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.sm,
                padding: `${spacing.sm} ${spacing.sm}`,
                borderRadius: radii.md,
                backgroundColor: active ? colors.background : "transparent",
                color: item.href ? colors.textPrimary : colors.textMuted,
                opacity: item.href ? 1 : 0.6,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </span>
              {!item.href && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: colors.textMuted,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.full,
                    padding: "1px 6px",
                  }}
                >
                  em breve
                </span>
              )}
            </div>
          );

          return item.href ? (
            <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
              {content}
            </Link>
          ) : (
            <div key={item.label} style={{ cursor: "not-allowed" }}>
              {content}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Real, if modest: jumps to the projects list filtered by name/venue —
    // there's no unified search index yet (see the "Pesquisa Global" gap in
    // the roadmap analysis), so this only searches what /projects already
    // returns rather than promising a scope it doesn't have.
    router.push(query.trim() ? `/projects?q=${encodeURIComponent(query.trim())}` : "/projects");
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        padding: `${spacing.md} ${spacing.xl}`,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 420 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar projetos, clientes, fornecedores..."
          style={{
            width: "100%",
            padding: spacing.sm,
            borderRadius: radii.full,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.background,
            boxSizing: "border-box",
          }}
        />
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        <Link href="/projects/new" style={{ textDecoration: "none" }}>
          <Button>✨ Criar Novo Projeto</Button>
        </Link>
        {user && <span style={{ color: colors.textMuted, fontSize: "0.9rem" }}>{user.name}</span>}
        <Button variant="ghost" onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  );
}

/** Shared shell for every authenticated screen — sidebar nav + top bar + centered content column. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar />
        <main style={{ padding: spacing.xl, maxWidth: 960, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
