"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Venue } from "@eve-os/types";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../components/AdminShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

function VenuesContent() {
  const { accessToken } = useAuth();
  const [venues, setVenues] = useState<Venue[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Venue[]>("/knowledge-graph/venues", accessToken)
      .then(setVenues)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os espaços."));
  }, [accessToken]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Espaços</h1>
        <Link href="/venues/new">
          <Button>Novo espaço</Button>
        </Link>
      </div>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {venues === undefined && !error && <p style={{ color: colors.textMuted }}>Carregando...</p>}
      {venues && (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm }}>Nome</th>
                <th style={{ padding: spacing.sm }}>Capacidade</th>
                <th style={{ padding: spacing.sm }}>Clima típico</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => (
                <tr key={venue.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>
                    <Link href={`/venues/${venue.id}`}>{venue.name}</Link>
                  </td>
                  <td style={{ padding: spacing.sm }}>{venue.guestCapacity ?? "—"}</td>
                  <td style={{ padding: spacing.sm }}>{venue.typicalClimate ?? "—"}</td>
                </tr>
              ))}
              {venues.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: spacing.sm, color: colors.textMuted }}>
                    Nenhum espaço cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

export default function VenuesPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <VenuesContent />
      </AdminShell>
    </AuthGuard>
  );
}
