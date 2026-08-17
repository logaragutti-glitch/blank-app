"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type {
  EventStyle,
  Material,
  MaterialCategory,
  WeddingFormatResearch,
  WeddingKnowledgeResponse,
  WeddingTrendResearch,
} from "../../lib/api-types";

const MATERIAL_CATEGORY_LABEL: Record<MaterialCategory, string> = {
  FLOWER: "Flor",
  FABRIC: "Tecido",
  FURNITURE: "Mobiliário",
  LIGHTING: "Iluminação",
  OTHER: "Outro",
};

const TABS = ["Estilos", "Materiais"] as const;

function ColorSwatches({ colors: hexColors }: { colors: string[] }) {
  if (hexColors.length === 0) return <span style={{ color: colors.textMuted }}>—</span>;
  return (
    <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
      {hexColors.map((color) => (
        <span
          key={color}
          title={color}
          style={{
            padding: `2px ${spacing.sm}`,
            borderRadius: 9999,
            border: `1px solid ${colors.border}`,
            fontSize: "0.8rem",
          }}
        >
          {color}
        </span>
      ))}
    </div>
  );
}

function StylesTable({ styles }: { styles: EventStyle[] }) {
  if (styles.length === 0) return <p style={{ color: colors.textMuted }}>Nenhum estilo cadastrado ainda.</p>;
  return (
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
                <strong>{style.name}</strong>
                {style.description && (
                  <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.85rem" }}>
                    {style.description}
                  </p>
                )}
              </td>
              <td style={{ padding: spacing.sm }}>
                {Object.entries(style.dimensionScores)
                  .map(([dimension, score]) => `${dimension}: ${score}`)
                  .join(", ") || "—"}
              </td>
              <td style={{ padding: spacing.sm }}>
                <ColorSwatches colors={style.paletteColors} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function MaterialsTable({ materials }: { materials: Material[] }) {
  if (materials.length === 0) return <p style={{ color: colors.textMuted }}>Nenhum material cadastrado ainda.</p>;
  return (
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
            <th style={{ padding: spacing.sm }}>Nome</th>
            <th style={{ padding: spacing.sm }}>Categoria</th>
            <th style={{ padding: spacing.sm }}>Emoções</th>
            <th style={{ padding: spacing.sm }}>Custo estimado</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => (
            <tr key={material.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
              <td style={{ padding: spacing.sm }}>
                {material.name}
                {material.neverRecommend && (
                  <span
                    style={{
                      marginLeft: spacing.sm,
                      color: colors.danger,
                      fontSize: "0.7rem",
                      border: `1px solid ${colors.danger}`,
                      borderRadius: 9999,
                      padding: "1px 6px",
                    }}
                  >
                    nunca recomendar
                  </span>
                )}
              </td>
              <td style={{ padding: spacing.sm }}>{MATERIAL_CATEGORY_LABEL[material.category]}</td>
              <td style={{ padding: spacing.sm }}>{material.emotions.join(", ") || "—"}</td>
              <td style={{ padding: spacing.sm }}>
                {material.estimatedUnitCost != null
                  ? `R$ ${material.estimatedUnitCost.toLocaleString("pt-BR")}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function guestRange(format: WeddingFormatResearch) {
  if (format.guestMin == null && format.guestMax == null) return "—";
  if (format.guestMin == null) return `até ${format.guestMax}`;
  if (format.guestMax == null) return `a partir de ${format.guestMin}`;
  return `${format.guestMin}–${format.guestMax}`;
}

function WeddingResearchSection({ formats, trends }: { formats: WeddingFormatResearch[]; trends: WeddingTrendResearch[] }) {
  return (
    <section style={{ marginTop: spacing.lg }}>
      <h2 style={{ marginBottom: spacing.xs }}>Pesquisa de casamentos</h2>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Formatos e tendências pesquisados para apoiar o briefing, a curadoria e as recomendações da Bia.
      </p>
      <Card>
        <h3 style={{ marginTop: 0 }}>Formatos</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
              <th style={{ padding: spacing.sm }}>Formato</th>
              <th style={{ padding: spacing.sm }}>Eixo</th>
              <th style={{ padding: spacing.sm }}>Convidados</th>
              <th style={{ padding: spacing.sm }}>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {formats.map((format) => (
              <tr key={format.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: spacing.sm }}><strong>{format.name}</strong></td>
                <td style={{ padding: spacing.sm }}>{format.axis}</td>
                <td style={{ padding: spacing.sm }}>{guestRange(format)}</td>
                <td style={{ padding: spacing.sm, color: colors.textMuted }}>{format.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card style={{ marginTop: spacing.md }}>
        <h3 style={{ marginTop: 0 }}>Tendências</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
              <th style={{ padding: spacing.sm }}>Tendência</th>
              <th style={{ padding: spacing.sm }}>Categoria</th>
              <th style={{ padding: spacing.sm }}>Paleta</th>
              <th style={{ padding: spacing.sm }}>Materiais associados</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend) => (
              <tr key={trend.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: spacing.sm }}>
                  <strong>{trend.name}</strong>
                  <p style={{ color: colors.textMuted, margin: `${spacing.xs} 0 0`, fontSize: "0.85rem" }}>
                    {trend.description}
                  </p>
                </td>
                <td style={{ padding: spacing.sm }}>{trend.category}</td>
                <td style={{ padding: spacing.sm }}><ColorSwatches colors={trend.paletteColors} /></td>
                <td style={{ padding: spacing.sm }}>{trend.materials.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

function ResearchMaterials({ trends }: { trends: WeddingTrendResearch[] }) {
  const materials = useMemo(
    () => Array.from(new Set(trends.flatMap((trend) => trend.materials))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [trends],
  );
  return (
    <section style={{ marginTop: spacing.lg }}>
      <h2 style={{ marginBottom: spacing.xs }}>Materiais identificados nas pesquisas</h2>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Materiais citados nas tendências editoriais e de mercado; precisam ser validados no orçamento e no espaço real.
      </p>
      <Card>
        <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
          {materials.map((material) => (
            <span key={material} style={{ border: `1px solid ${colors.border}`, borderRadius: 9999, padding: `4px ${spacing.sm}` }}>
              {material}
            </span>
          ))}
        </div>
      </Card>
    </section>
  );
}

function BibliotecaContent() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Estilos");
  const [styles, setStyles] = useState<EventStyle[] | null>(null);
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [knowledge, setKnowledge] = useState<WeddingKnowledgeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<EventStyle[]>("/knowledge-graph/styles", accessToken)
      .then(setStyles)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os estilos."));
    apiClient
      .get<Material[]>("/knowledge-graph/materials", accessToken)
      .then(setMaterials)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os materiais."));
    apiClient
      .get<WeddingKnowledgeResponse>("/knowledge-graph/wedding-knowledge", accessToken)
      .then(setKnowledge)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar a pesquisa de casamentos."));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;

  return (
    <>
      <h1>Biblioteca</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        O Knowledge Graph da Bia — estilos, materiais e pesquisa de casamentos catalogados. Cadastro e edição continuam no painel administrativo.
      </p>

      <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: 9999,
              border: `1px solid ${tab === t ? colors.primary : colors.border}`,
              backgroundColor: tab === t ? colors.primary : "transparent",
              color: tab === t ? "#FFFFFF" : colors.textPrimary,
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Estilos" && (
        styles === null || knowledge === null ? (
          <p style={{ color: colors.textMuted }}>Reunindo estilos e pesquisas...</p>
        ) : (
          <>
            <StylesTable styles={styles} />
            <WeddingResearchSection formats={knowledge.formats} trends={knowledge.trends} />
          </>
        )
      )}
      {tab === "Materiais" && (
        materials === null || knowledge === null ? (
          <p style={{ color: colors.textMuted }}>Reunindo materiais e pesquisas...</p>
        ) : (
          <>
            <MaterialsTable materials={materials} />
            <ResearchMaterials trends={knowledge.trends} />
          </>
        )
      )}
    </>
  );
}

export default function BibliotecaPage() {
  return (
    <AuthGuard>
      <AppShell>
        <BibliotecaContent />
      </AppShell>
    </AuthGuard>
  );
}
