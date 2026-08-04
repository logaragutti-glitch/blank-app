"use client";

import { useEffect, useState } from "react";
import { Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { Supplier, SupplierCategory } from "../../lib/api-types";

const CATEGORY_LABEL: Record<SupplierCategory, string> = {
  FLORIST: "Florista",
  CATERING: "Buffet",
  LIGHTING: "Iluminação",
  FURNITURE_RENTAL: "Locação de mobiliário",
  PHOTOGRAPHY: "Fotografia",
  MUSIC: "Música",
  ASSEMBLY_CREW: "Equipe de montagem",
  OTHER: "Outro",
};

/**
 * Read-only view of the same Knowledge Graph supplier catalog the admin app
 * manages (GET /knowledge-graph/suppliers has no role guard) — cadastro
 * continua no admin, isso só dá visibilidade pra quem usa o dia a dia aqui.
 */
function FornecedoresContent() {
  const { accessToken } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Supplier[]>("/knowledge-graph/suppliers", accessToken)
      .then(setSuppliers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os fornecedores."));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!suppliers) return <p style={{ color: colors.textMuted }}>Reunindo os fornecedores...</p>;

  return (
    <>
      <h1>Fornecedores</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Catálogo do Knowledge Graph. Cadastro e edição continuam no painel administrativo.
      </p>

      {suppliers.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Nenhum fornecedor cadastrado ainda.</p>
      ) : (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm }}>Nome</th>
                <th style={{ padding: spacing.sm }}>Categoria</th>
                <th style={{ padding: spacing.sm }}>Custo estimado</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>{supplier.name}</td>
                  <td style={{ padding: spacing.sm }}>{CATEGORY_LABEL[supplier.category]}</td>
                  <td style={{ padding: spacing.sm }}>
                    {supplier.estimatedCost != null
                      ? `R$ ${supplier.estimatedCost.toLocaleString("pt-BR")}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

export default function FornecedoresPage() {
  return (
    <AuthGuard>
      <AppShell>
        <FornecedoresContent />
      </AppShell>
    </AuthGuard>
  );
}
