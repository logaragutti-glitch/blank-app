"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Venue } from "@eve-os/types";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AdminShell } from "../../../components/AdminShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";

function EditVenueContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [structuralConstraints, setStructuralConstraints] = useState("");
  const [ceilingHeightMeters, setCeilingHeightMeters] = useState("");
  const [powerOutlets, setPowerOutlets] = useState("");
  const [guestCapacity, setGuestCapacity] = useState("");
  const [typicalClimate, setTypicalClimate] = useState("");
  const [recommendationNotes, setRecommendationNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Venue>(`/knowledge-graph/venues/${id}`, accessToken)
      .then((result) => {
        setVenue(result);
        setName(result.name);
        setStructuralConstraints(result.structuralConstraints ?? "");
        setCeilingHeightMeters(result.ceilingHeightMeters != null ? String(result.ceilingHeightMeters) : "");
        setPowerOutlets(result.powerOutlets != null ? String(result.powerOutlets) : "");
        setGuestCapacity(result.guestCapacity != null ? String(result.guestCapacity) : "");
        setTypicalClimate(result.typicalClimate ?? "");
        setRecommendationNotes(result.recommendationNotes.join(", "));
      })
      .catch((err) => {
        setVenue(null);
        setError(err instanceof ApiError ? err.message : "Não conseguimos carregar esse espaço.");
      });
  }, [accessToken, id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.patch<Venue>(
        `/knowledge-graph/venues/${id}`,
        {
          name,
          structuralConstraints: structuralConstraints || null,
          ceilingHeightMeters: ceilingHeightMeters ? Number(ceilingHeightMeters) : null,
          powerOutlets: powerOutlets ? Number(powerOutlets) : null,
          guestCapacity: guestCapacity ? Number(guestCapacity) : null,
          typicalClimate: typicalClimate || null,
          recommendationNotes: recommendationNotes.split(",").map((n) => n.trim()).filter(Boolean),
        },
        accessToken,
      );
      router.push("/venues");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não consegui salvar esse espaço.");
    } finally {
      setSubmitting(false);
    }
  }

  if (venue === undefined) return <p style={{ color: colors.textMuted }}>Carregando...</p>;
  if (venue === null) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <h1>Editar espaço</h1>
      <Card>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <label>
            Nome
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Restrições estruturais
            <Input value={structuralConstraints} onChange={(e) => setStructuralConstraints(e.target.value)} />
          </label>
          <label>
            Pé-direito (metros)
            <Input
              type="number"
              value={ceilingHeightMeters}
              onChange={(e) => setCeilingHeightMeters(e.target.value)}
            />
          </label>
          <label>
            Pontos de energia
            <Input type="number" value={powerOutlets} onChange={(e) => setPowerOutlets(e.target.value)} />
          </label>
          <label>
            Capacidade de convidados
            <Input type="number" value={guestCapacity} onChange={(e) => setGuestCapacity(e.target.value)} />
          </label>
          <label>
            Clima típico
            <Input value={typicalClimate} onChange={(e) => setTypicalClimate(e.target.value)} />
          </label>
          <label>
            Notas de recomendação (separadas por vírgula)
            <Input value={recommendationNotes} onChange={(e) => setRecommendationNotes(e.target.value)} />
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

export default function EditVenuePage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <AdminShell>
        <EditVenueContent id={params.id} />
      </AdminShell>
    </AuthGuard>
  );
}
