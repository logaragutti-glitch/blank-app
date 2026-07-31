"use client";

import Link from "next/link";
import { Card, colors, spacing } from "@eve-os/ui";
import { AuthGuard } from "../lib/auth-guard";
import { AdminShell } from "../components/AdminShell";

const SECTIONS = [
  { href: "/styles", label: "Estilos", description: "Estilos de evento e suas dimensões emocionais (0-10)." },
  { href: "/materials", label: "Materiais", description: "Flores, tecidos, mobiliário e iluminação do catálogo." },
  { href: "/venues", label: "Espaços", description: "Locais e suas restrições estruturais." },
  { href: "/suppliers", label: "Fornecedores", description: "Fornecedores por categoria e custo estimado." },
];

function AdminHomeContent() {
  return (
    <>
      <h1>EVE OS Admin</h1>
      <p style={{ color: colors.textMuted }}>Gestão do Knowledge Graph — a base de dados que alimenta as propostas.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: spacing.md }}>
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} style={{ textDecoration: "none" }}>
            <Card>
              <h3 style={{ marginTop: 0 }}>{section.label}</h3>
              <p style={{ color: colors.textMuted, margin: 0 }}>{section.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function AdminHomePage() {
  return (
    <AuthGuard>
      <AdminShell>
        <AdminHomeContent />
      </AdminShell>
    </AuthGuard>
  );
}
