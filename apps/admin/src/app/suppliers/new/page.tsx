"use client";

import { useState } from "react";
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

function SupplierFormContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SupplierCategory>("FLORIST");
  const [performanceNotes, setPerformanceNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post<Supplier>(
        "/knowledge-graph/suppliers",
        {
          name,
          category,
          performanceNotes: performanceNotes || undefined,
          estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
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

  return (
    <>
      <h1>Novo fornecedor</h1>
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
          {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Criar fornecedor"}
          </Button>
        </form>
      </Card>
    </>
  );
}

export default function NewSupplierPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <SupplierFormContent />
      </AdminShell>
    </AuthGuard>
  );
}
