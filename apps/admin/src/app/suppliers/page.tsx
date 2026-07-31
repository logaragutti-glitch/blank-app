"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Supplier } from "@eve-os/types";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../components/AdminShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

function SuppliersContent() {
  const { accessToken } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Supplier[]>("/knowledge-graph/suppliers", accessToken)
      .then(setSuppliers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os fornecedores."));
  }, [accessToken]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Fornecedores</h1>
        <Link href="/suppliers/new">
          <Button>Novo fornecedor</Button>
        </Link>
      </div>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {suppliers === undefined && !error && <p style={{ color: colors.textMuted }}>Carregando...</p>}
      {suppliers && (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm }}>Nome</th>
                <th style={{ padding: spacing.sm }}>Categoria</th>
                <th style={{ padding: spacing.sm }}>Custo estimado</th>
                <th style={{ padding: spacing.sm }}>Preferencial em</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>
                    <Link href={`/suppliers/${supplier.id}`}>{supplier.name}</Link>
                  </td>
                  <td style={{ padding: spacing.sm }}>{supplier.category}</td>
                  <td style={{ padding: spacing.sm }}>
                    {supplier.estimatedCost != null ? `R$ ${supplier.estimatedCost}` : "—"}
                  </td>
                  <td style={{ padding: spacing.sm }}>{supplier.preferredVenueIds.length} espaço(s)</td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: spacing.sm, color: colors.textMuted }}>
                    Nenhum fornecedor cadastrado ainda.
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

export default function SuppliersPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <SuppliersContent />
      </AdminShell>
    </AuthGuard>
  );
}
