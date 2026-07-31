"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Material } from "@eve-os/types";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../components/AdminShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

function MaterialsContent() {
  const { accessToken } = useAuth();
  const [materials, setMaterials] = useState<Material[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Material[]>("/knowledge-graph/materials", accessToken)
      .then(setMaterials)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os materiais."));
  }, [accessToken]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Materiais</h1>
        <Link href="/materials/new">
          <Button>Novo material</Button>
        </Link>
      </div>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {materials === undefined && !error && <p style={{ color: colors.textMuted }}>Carregando...</p>}
      {materials && (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm }}>Nome</th>
                <th style={{ padding: spacing.sm }}>Categoria</th>
                <th style={{ padding: spacing.sm }}>Não recomendar</th>
                <th style={{ padding: spacing.sm }}>Custo estimado</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>
                    <Link href={`/materials/${material.id}`}>{material.name}</Link>
                  </td>
                  <td style={{ padding: spacing.sm }}>{material.category}</td>
                  <td style={{ padding: spacing.sm }}>{material.neverRecommend ? "Sim" : "—"}</td>
                  <td style={{ padding: spacing.sm }}>
                    {material.estimatedUnitCost != null ? `R$ ${material.estimatedUnitCost}` : "—"}
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: spacing.sm, color: colors.textMuted }}>
                    Nenhum material cadastrado ainda.
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

export default function MaterialsPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <MaterialsContent />
      </AdminShell>
    </AuthGuard>
  );
}
