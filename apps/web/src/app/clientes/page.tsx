"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Input, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { Client } from "../../lib/api-types";

function clientName(client: Client): string {
  return [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & ");
}

function ClientesContent() {
  const { accessToken } = useAuth();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Client[]>("/clients", accessToken)
      .then(setClients)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os clientes."));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!clients) return <p style={{ color: colors.textMuted }}>Reunindo os clientes...</p>;

  const filtered = query.trim()
    ? clients.filter((c) => clientName(c).toLowerCase().includes(query.trim().toLowerCase()))
    : clients;

  return (
    <>
      <h1>Clientes</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Todos os casais que já passaram por um briefing, com seus projetos.
      </p>
      <Input
        placeholder="Buscar por nome..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: spacing.lg, maxWidth: 360 }}
      />

      {filtered.length === 0 ? (
        <p style={{ color: colors.textMuted }}>
          {clients.length === 0 ? "Nenhum cliente ainda — crie um projeto para começar." : "Nenhum cliente encontrado."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {filtered.map((client) => (
            <Link key={client.id} href={`/clientes/${client.id}`} style={{ textDecoration: "none" }}>
              <Card>
                <strong style={{ color: colors.textPrimary }}>{clientName(client)}</strong>
                <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0` }}>
                  {[client.email, client.phone, client.city].filter(Boolean).join(" · ") || "Sem dados de contato"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function ClientesPage() {
  return (
    <AuthGuard>
      <AppShell>
        <ClientesContent />
      </AppShell>
    </AuthGuard>
  );
}
