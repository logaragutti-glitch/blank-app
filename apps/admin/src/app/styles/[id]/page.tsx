"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { EventStyle, StyleDimensionScores } from "@eve-os/types";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../../components/AdminShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";

// One "Dimensão: valor" pair per line — the simplest honest editor for an
// open-ended Record<string, number> (dimensionScores has no fixed set of
// keys; new dimensions are added over time, see 05-database-bible.md).
function parseDimensionScores(text: string): StyleDimensionScores {
  const scores: StyleDimensionScores = {};
  for (const line of text.split("\n")) {
    const [dimension, value] = line.split(":").map((part) => part.trim());
    if (dimension && value && !Number.isNaN(Number(value))) {
      scores[dimension] = Number(value);
    }
  }
  return scores;
}

function formatDimensionScores(scores: StyleDimensionScores): string {
  return Object.entries(scores)
    .map(([dimension, value]) => `${dimension}: ${value}`)
    .join("\n");
}

function EditStyleContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [style, setStyle] = useState<EventStyle | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dimensionScoresText, setDimensionScoresText] = useState("");
  const [paletteColors, setPaletteColors] = useState("");
  const [furnitureNotes, setFurnitureNotes] = useState("");
  const [loungeNotes, setLoungeNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<EventStyle>(`/knowledge-graph/styles/${id}`, accessToken)
      .then((result) => {
        setStyle(result);
        setName(result.name);
        setDescription(result.description ?? "");
        setDimensionScoresText(formatDimensionScores(result.dimensionScores));
        setPaletteColors(result.paletteColors.join(", "));
        setFurnitureNotes(result.furnitureNotes.join(", "));
        setLoungeNotes(result.loungeNotes.join(", "));
      })
      .catch((err) => {
        setStyle(null);
        setError(err instanceof ApiError ? err.message : "Não conseguimos carregar esse estilo.");
      });
  }, [accessToken, id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.patch<EventStyle>(
        `/knowledge-graph/styles/${id}`,
        {
          name,
          description: description || null,
          dimensionScores: parseDimensionScores(dimensionScoresText),
          paletteColors: paletteColors.split(",").map((c) => c.trim()).filter(Boolean),
          furnitureNotes: furnitureNotes.split(",").map((n) => n.trim()).filter(Boolean),
          loungeNotes: loungeNotes.split(",").map((n) => n.trim()).filter(Boolean),
        },
        accessToken,
      );
      router.push("/styles");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não consegui salvar esse estilo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (style === undefined) return <p style={{ color: colors.textMuted }}>Carregando...</p>;
  if (style === null) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <h1>Editar estilo</h1>
      <Card>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <label>
            Nome
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Descrição
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            Dimensões de intensidade (0-10, uma por linha, &quot;Dimensão: valor&quot;)
            <textarea
              rows={5}
              value={dimensionScoresText}
              onChange={(e) => setDimensionScoresText(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: spacing.sm,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </label>
          <label>
            Paleta de cores (separadas por vírgula)
            <Input value={paletteColors} onChange={(e) => setPaletteColors(e.target.value)} />
          </label>
          <label>
            Notas de mobiliário (separadas por vírgula)
            <Input value={furnitureNotes} onChange={(e) => setFurnitureNotes(e.target.value)} />
          </label>
          <label>
            Notas de lounge (separadas por vírgula)
            <Input value={loungeNotes} onChange={(e) => setLoungeNotes(e.target.value)} />
          </label>
          <p style={{ color: colors.textMuted, fontSize: "0.85rem" }}>
            Salvar recalcula automaticamente o embedding de busca semântica (requer credenciais de IA
            configuradas na API).
          </p>
          {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </Card>
    </>
  );
}

export default function EditStylePage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <AdminShell>
        <EditStyleContent id={params.id} />
      </AdminShell>
    </AuthGuard>
  );
}
