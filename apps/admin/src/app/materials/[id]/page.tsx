"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { EventStyle, Material, MaterialCategory } from "@eve-os/types";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../../components/AdminShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";

const CATEGORIES: MaterialCategory[] = ["FLOWER", "FABRIC", "FURNITURE", "LIGHTING", "OTHER"];

function selectedOptions(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

function EditMaterialContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [styles, setStyles] = useState<EventStyle[]>([]);
  const [material, setMaterial] = useState<Material | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("FLOWER");
  const [emotions, setEmotions] = useState("");
  const [seasons, setSeasons] = useState("");
  const [neverRecommend, setNeverRecommend] = useState(false);
  const [compatibleStyleIds, setCompatibleStyleIds] = useState<string[]>([]);
  const [incompatibleStyleIds, setIncompatibleStyleIds] = useState<string[]>([]);
  const [estimatedUnitCost, setEstimatedUnitCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiClient.get<EventStyle[]>("/knowledge-graph/styles", accessToken).then(setStyles).catch(() => setStyles([]));
    apiClient
      .get<Material>(`/knowledge-graph/materials/${id}`, accessToken)
      .then((result) => {
        setMaterial(result);
        setName(result.name);
        setCategory(result.category);
        setEmotions(result.emotions.join(", "));
        setSeasons(result.seasons.join(", "));
        setNeverRecommend(result.neverRecommend);
        setCompatibleStyleIds(result.compatibleStyleIds);
        setIncompatibleStyleIds(result.incompatibleStyleIds);
        setEstimatedUnitCost(result.estimatedUnitCost != null ? String(result.estimatedUnitCost) : "");
      })
      .catch((err) => {
        setMaterial(null);
        setError(err instanceof ApiError ? err.message : "Não conseguimos carregar esse material.");
      });
  }, [accessToken, id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.patch<Material>(
        `/knowledge-graph/materials/${id}`,
        {
          name,
          category,
          emotions: emotions.split(",").map((e) => e.trim()).filter(Boolean),
          seasons: seasons.split(",").map((s) => s.trim()).filter(Boolean),
          neverRecommend,
          compatibleStyleIds,
          incompatibleStyleIds,
          estimatedUnitCost: estimatedUnitCost ? Number(estimatedUnitCost) : null,
        },
        accessToken,
      );
      router.push("/materials");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não consegui salvar esse material.");
    } finally {
      setSubmitting(false);
    }
  }

  if (material === undefined) return <p style={{ color: colors.textMuted }}>Carregando...</p>;
  if (material === null) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <h1>Editar material</h1>
      <Card>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <label>
            Nome
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Categoria
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MaterialCategory)}
              style={{ display: "block", width: "100%", padding: spacing.sm }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Emoções (separadas por vírgula)
            <Input value={emotions} onChange={(e) => setEmotions(e.target.value)} />
          </label>
          <label>
            Estações (separadas por vírgula)
            <Input value={seasons} onChange={(e) => setSeasons(e.target.value)} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
            <input
              type="checkbox"
              checked={neverRecommend}
              onChange={(e) => setNeverRecommend(e.target.checked)}
            />
            Nunca recomendar (lista &quot;Não utilizar&quot;)
          </label>
          <label>
            Estilos compatíveis
            <select
              multiple
              value={compatibleStyleIds}
              onChange={(e) => setCompatibleStyleIds(selectedOptions(e.target))}
              style={{ display: "block", width: "100%", padding: spacing.sm, minHeight: 80 }}
            >
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estilos incompatíveis
            <select
              multiple
              value={incompatibleStyleIds}
              onChange={(e) => setIncompatibleStyleIds(selectedOptions(e.target))}
              style={{ display: "block", width: "100%", padding: spacing.sm, minHeight: 80 }}
            >
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Custo estimado (R$, opcional)
            <Input
              type="number"
              value={estimatedUnitCost}
              onChange={(e) => setEstimatedUnitCost(e.target.value)}
            />
          </label>
          {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </Card>
    </>
  );
}

export default function EditMaterialPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <AdminShell>
        <EditMaterialContent id={params.id} />
      </AdminShell>
    </AuthGuard>
  );
}
