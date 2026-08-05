"use client";

import { useEffect, useState } from "react";
import { Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { EventStyle, Material, MaterialCategory } from "../../lib/api-types";

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

/**
 * Read-only view of the same Knowledge Graph the admin app manages (both
 * GET endpoints have no role guard) — cadastro e edição continuam no admin,
 * isso só dá visibilidade pra quem usa o dia a dia aqui.
 */
function BibliotecaContent() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Estilos");
  const [styles, setStyles] = useState<EventStyle[] | null>(null);
  const [materials, setMaterials] = useState<Material[] | null>(null);
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
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;

  return (
    <>
      <h1>Biblioteca</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        O Knowledge Graph da Bia — estilos e materiais catalogados. Cadastro e edição continuam no painel
        administrativo.
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

      {tab === "Estilos" &&
        (styles === null ? <p style={{ color: colors.textMuted }}>Reunindo os estilos...</p> : <StylesTable styles={styles} />)}
      {tab === "Materiais" &&
        (materials === null ? (
          <p style={{ color: colors.textMuted }}>Reunindo os materiais...</p>
        ) : (
          <MaterialsTable materials={materials} />
        ))}
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
