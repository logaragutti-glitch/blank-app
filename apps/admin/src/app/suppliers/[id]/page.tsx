"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Supplier, SupplierCategory } from "@eve-os/types";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../../components/AdminShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";

const CATEGORIES: SupplierCategory[] = [
  "FLORIST",
  "CATERING",
  "LIGHTING",
  "FURNITURE_RENTAL",
  "PHOTOGRAPHY",
  "MUSIC",
  "OTHER",
];

function EditSupplierContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SupplierCategory>("FLORIST");
  const [performanceNotes, setPerformanceNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Supplier>(`/knowledge-graph/suppliers/${id}`, accessToken)
      .then((result) => {
        setSupplier(result);
        setName(result.name);
        setCategory(result.category);
        setPerformanceNotes(result.performanceNotes ?? "");
        setEstimatedCost(result.estimatedCost != null ? String(result.estimatedCost) : "");
      })
      .catch((err) => {
        setSupplier(null);
        setError(err instanceof ApiError ? err.message : "Não conseguimos carregar esse fornecedor.");
      });
  }, [accessToken, id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.patch<Supplier>(
        `/knowledge-graph/suppliers/${id}`,
        {
          name,
          category,
          performanceNotes: performanceNotes || null,
          estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        },
        accessToken,
      );
      router.push("/suppliers");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não consegui salvar esse fornecedor.");
    } finally {
      setSubmitting(false);
    }
  }

  if (supplier === undefined) return <p style={{ color: colors.textMuted }}>Carregando...</p>;
  if (supplier === null) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <h1>Editar fornecedor</h1>
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
              onChange={(e) => setCategory(e.target.value as SupplierCategory)}
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
            Notas de desempenho
            <Input value={performanceNotes} onChange={(e) => setPerformanceNotes(e.target.value)} />
          </label>
          <label>
            Custo estimado (R$, opcional)
            <Input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
          </label>
          <p style={{ color: colors.textMuted, fontSize: "0.85rem" }}>
            O status de &quot;preferencial&quot; por espaço é ajustado automaticamente pelo feedback pós-evento, não aqui.
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

export default function EditSupplierPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <AdminShell>
        <EditSupplierContent id={params.id} />
      </AdminShell>
    </AuthGuard>
  );
}
