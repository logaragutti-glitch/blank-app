"use client";

import { useEffect, useState } from "react";
import { Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type {
  Supplier,
  SupplierCatalogCategory,
  SupplierCatalogResponse,
  WeddingKnowledgeResponse,
  WeddingVenueResearch,
} from "../../lib/api-types";
import { SUPPLIER_CATEGORY_LABEL } from "../../lib/labels";

const CATALOG_TYPE_LABEL: Record<SupplierCatalogCategory["categoryType"], string> = {
  FURNITURE: "Mobiliário",
  LIGHTING: "Iluminação",
  DECOR: "Decoração",
  STRUCTURE: "Estrutura",
  TEXTILE: "Têxtil",
  ACCESSORY: "Acessório",
  OTHER: "Outro",
};

const EVIDENCE_LABEL: Record<WeddingVenueResearch["evidenceLevel"], string> = {
  OFFICIAL: "Site oficial",
  DIRECTORY: "Diretório especializado",
  SOCIAL_LEAD: "Lead de rede social",
};

const STATUS_LABEL: Record<WeddingVenueResearch["status"], string> = {
  VALIDATED: "Validado",
  REQUIRES_CONFIRMATION: "Requer confirmação",
};

function FornecedoresContent() {
  const { accessToken } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [catalog, setCatalog] = useState<SupplierCatalogResponse | null>(null);
  const [research, setResearch] = useState<WeddingKnowledgeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function load() {
      try {
        const [supplierList, knowledge] = await Promise.all([
          apiClient.get<Supplier[]>("/knowledge-graph/suppliers", accessToken),
          apiClient.get<WeddingKnowledgeResponse>("/knowledge-graph/wedding-knowledge", accessToken),
        ]);
        if (cancelled) return;
        setSuppliers(supplierList);
        setResearch(knowledge);

        const mineirart = supplierList.find((supplier) => supplier.name === "Mineirart — Região dos Lagos");
        if (mineirart) {
          const supplierCatalog = await apiClient.get<SupplierCatalogResponse>(
            `/knowledge-graph/suppliers/${mineirart.id}/catalog`,
            accessToken,
          );
          if (!cancelled) setCatalog(supplierCatalog);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os fornecedores e pesquisas.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!suppliers || !research) return <p style={{ color: colors.textMuted }}>Reunindo fornecedores e pesquisas...</p>;

  return (
    <>
      <h1>Fornecedores</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Catálogo do Knowledge Graph, com pesquisas regionais, fontes e nível de confirmação. Cadastro e edição continuam no painel administrativo.
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
                  <td style={{ padding: spacing.sm }}>{SUPPLIER_CATEGORY_LABEL[supplier.category]}</td>
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

      {catalog && (
        <section style={{ marginTop: spacing.lg }}>
          <h2 style={{ marginBottom: spacing.xs }}>Catálogo regional — {catalog.supplier.name}</h2>
          <p style={{ color: colors.textMuted, marginTop: 0 }}>
            Categorias e produtos identificados na loja Região dos Lagos, preservando a fonte e o status de extração.
          </p>
          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: spacing.sm }}>Categoria</th>
                  <th style={{ padding: spacing.sm }}>Tipo</th>
                  <th style={{ padding: spacing.sm }}>Anúncios</th>
                  <th style={{ padding: spacing.sm }}>Extração</th>
                  <th style={{ padding: spacing.sm }}>Fonte</th>
                </tr>
              </thead>
              <tbody>
                {catalog.categories.map((category) => (
                  <tr key={category.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: spacing.sm }}>
                      <strong>{category.name}</strong>
                      {category.productNames.length > 0 && (
                        <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.8rem" }}>
                          {category.productNames.slice(0, 4).join(", ")}
                          {category.productNames.length > 4 ? "…" : ""}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: spacing.sm }}>{CATALOG_TYPE_LABEL[category.categoryType]}</td>
                    <td style={{ padding: spacing.sm }}>{category.listedProductCount ?? "—"}</td>
                    <td style={{ padding: spacing.sm }}>{category.extractionStatus}</td>
                    <td style={{ padding: spacing.sm }}>
                      <a href={category.sourceUrl} target="_blank" rel="noreferrer">Abrir</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      <section style={{ marginTop: spacing.lg }}>
        <h2 style={{ marginBottom: spacing.xs }}>Espaços para casamentos pesquisados</h2>
        <p style={{ color: colors.textMuted, marginTop: 0 }}>
          Locais da Região dos Lagos classificados por município. Preços e disponibilidade devem ser confirmados diretamente.
        </p>
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: spacing.sm }}>Espaço</th>
                <th style={{ padding: spacing.sm }}>Município</th>
                <th style={{ padding: spacing.sm }}>Tipo</th>
                <th style={{ padding: spacing.sm }}>Capacidade</th>
                <th style={{ padding: spacing.sm }}>Evidência</th>
                <th style={{ padding: spacing.sm }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {research.venues.map((venue) => (
                <tr key={venue.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}>
                    <strong>{venue.name}</strong>
                    {venue.priceNote && (
                      <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.8rem" }}>
                        {venue.priceNote}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: spacing.sm }}>{venue.municipality}</td>
                  <td style={{ padding: spacing.sm }}>{venue.venueType}</td>
                  <td style={{ padding: spacing.sm }}>
                    {venue.capacityMin == null && venue.capacityMax == null
                      ? "—"
                      : `${venue.capacityMin ?? ""}${venue.capacityMin != null ? "–" : "até "}${venue.capacityMax ?? ""}`}
                  </td>
                  <td style={{ padding: spacing.sm }}>{EVIDENCE_LABEL[venue.evidenceLevel]}</td>
                  <td style={{ padding: spacing.sm }}>
                    <span
                      style={{
                        color: venue.status === "VALIDATED" ? colors.primary : colors.textMuted,
                        border: `1px solid ${venue.status === "VALIDATED" ? colors.primary : colors.border}`,
                        borderRadius: 9999,
                        padding: "2px 7px",
                        fontSize: "0.78rem",
                      }}
                    >
                      {STATUS_LABEL[venue.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
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
