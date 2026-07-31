"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EventStyle } from "@eve-os/types";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../components/AdminShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

function StylesContent() {
  const { accessToken } = useAuth();
  const [styles, setStyles] = useState<EventStyle[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<EventStyle[]>("/knowledge-graph/styles", accessToken)
      .then(setStyles)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os estilos."));
  }, [accessToken]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Estilos</h1>
        <Link href="/styles/new">
          <Button>Novo estilo</Button>
        </Link>
      </div>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {styles === undefined && !error && <p style={{ color: colors.textMuted }}>Carregando...</p>}
      {styles && (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm }}>Nome</th>
                <th style={{ padding: spacing.sm }}>Dimensões</th>
                <th style={{ padding: spacing.sm }}>Paleta</th>
              </tr>
            </thead>
            <tbody>
              {styles.map((style) => (
                <tr key={style.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>
                    <Link href={`/styles/${style.id}`}>{style.name}</Link>
                  </td>
                  <td style={{ padding: spacing.sm }}>
                    {Object.entries(style.dimensionScores)
                      .map(([dimension, score]) => `${dimension}: ${score}`)
                      .join(", ")}
                  </td>
                  <td style={{ padding: spacing.sm }}>{style.paletteColors.join(", ") || "—"}</td>
                </tr>
              ))}
              {styles.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: spacing.sm, color: colors.textMuted }}>
                    Nenhum estilo cadastrado ainda.
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

export default function StylesPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <StylesContent />
      </AdminShell>
    </AuthGuard>
  );
}
