"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../components/AppShell";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";
import type { CreateBriefingResponse, Venue } from "../../../lib/api-types";

const LIFESTYLE_OPTIONS = ["Romântico", "Natural", "Minimalista", "Sofisticado", "Contemporâneo", "Boêmio"];

interface BriefingFormState {
  partnerOneName: string;
  partnerTwoName: string;
  venueId: string;
  guestsExpected: string;
  ceremonyDateTime: string;
  howTheyMet: string;
  proposalStory: string;
  lifestyleTags: string[];
  budgetAmount: string;
}

const INITIAL_STATE: BriefingFormState = {
  partnerOneName: "",
  partnerTwoName: "",
  venueId: "",
  guestsExpected: "",
  ceremonyDateTime: "",
  howTheyMet: "",
  proposalStory: "",
  lifestyleTags: [],
  budgetAmount: "",
};

const STEPS = ["Sobre o casal", "A história", "Estilo de vida", "Revisão"] as const;

function NewProjectContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_STATE);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Venue[]>("/knowledge-graph/venues", accessToken)
      .then(setVenues)
      .catch(() => setVenues([]));
  }, [accessToken]);

  function toggleLifestyleTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      lifestyleTags: prev.lifestyleTags.includes(tag)
        ? prev.lifestyleTags.filter((t) => t !== tag)
        : [...prev.lifestyleTags, tag],
    }));
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await apiClient.post<CreateBriefingResponse>(
        "/briefing",
        {
          partnerOneName: form.partnerOneName,
          partnerTwoName: form.partnerTwoName || undefined,
          venueId: form.venueId,
          guestsExpected: form.guestsExpected ? Number(form.guestsExpected) : undefined,
          ceremonyDateTime: form.ceremonyDateTime
            ? new Date(form.ceremonyDateTime).toISOString()
            : undefined,
          howTheyMet: form.howTheyMet || undefined,
          proposalStory: form.proposalStory || undefined,
          lifestyleTags: form.lifestyleTags.length ? form.lifestyleTags : undefined,
          budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
        },
        accessToken,
      );
      router.push(`/projects/${response.event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos salvar o briefing. Tente novamente.");
      setSubmitting(false);
    }
  }

  const canAdvance =
    step === 0 ? form.partnerOneName.trim().length > 0 && form.venueId.length > 0 : true;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <p style={{ color: colors.textMuted }}>
        {STEPS[step]} · passo {step + 1} de {STEPS.length}
      </p>
      <Card>
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <h2 style={{ margin: 0 }}>Conte um pouco sobre o casal</h2>
            <Input
              placeholder="Nome de um dos noivos"
              value={form.partnerOneName}
              onChange={(e) => setForm({ ...form, partnerOneName: e.target.value })}
            />
            <Input
              placeholder="Nome do outro noivo (opcional)"
              value={form.partnerTwoName}
              onChange={(e) => setForm({ ...form, partnerTwoName: e.target.value })}
            />
            <label style={{ color: colors.textMuted, fontSize: "0.9rem" }}>Onde será o evento?</label>
            <select
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value })}
              style={{
                padding: spacing.sm,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
              }}
            >
              <option value="">Selecione um espaço</option>
              {venues?.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Convidados esperados (opcional)"
              value={form.guestsExpected}
              onChange={(e) => setForm({ ...form, guestsExpected: e.target.value })}
            />
            <Input
              type="datetime-local"
              value={form.ceremonyDateTime}
              onChange={(e) => setForm({ ...form, ceremonyDateTime: e.target.value })}
            />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <h2 style={{ margin: 0 }}>Agora, a história deles</h2>
            <p style={{ color: colors.textMuted, margin: 0 }}>
              A emoção vem antes da decoração — é a história que guia o conceito.
            </p>
            <label style={{ color: colors.textMuted, fontSize: "0.9rem" }}>Como eles se conheceram?</label>
            <textarea
              rows={3}
              value={form.howTheyMet}
              onChange={(e) => setForm({ ...form, howTheyMet: e.target.value })}
              style={{
                padding: spacing.sm,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                fontFamily: "inherit",
              }}
            />
            <label style={{ color: colors.textMuted, fontSize: "0.9rem" }}>Como foi o pedido?</label>
            <textarea
              rows={3}
              value={form.proposalStory}
              onChange={(e) => setForm({ ...form, proposalStory: e.target.value })}
              style={{
                padding: spacing.sm,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <h2 style={{ margin: 0 }}>O que combina com eles?</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {LIFESTYLE_OPTIONS.map((tag) => {
                const selected = form.lifestyleTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleLifestyleTag(tag)}
                    style={{
                      padding: `${spacing.xs} ${spacing.md}`,
                      borderRadius: 9999,
                      border: `1px solid ${selected ? colors.primary : colors.border}`,
                      backgroundColor: selected ? colors.primary : "transparent",
                      color: selected ? "#FFFFFF" : colors.textPrimary,
                      cursor: "pointer",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <label style={{ color: colors.textMuted, fontSize: "0.9rem" }}>
              Orçamento estimado (opcional)
            </label>
            <Input
              type="number"
              placeholder="Ex.: 30000"
              value={form.budgetAmount}
              onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
            />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            <h2 style={{ margin: 0 }}>Tudo certo?</h2>
            <p style={{ margin: 0 }}>
              <strong>{form.partnerOneName}</strong>
              {form.partnerTwoName && ` & ${form.partnerTwoName}`}
            </p>
            <p style={{ color: colors.textMuted, margin: 0 }}>
              {venues?.find((v) => v.id === form.venueId)?.name ?? "Espaço não selecionado"}
            </p>
            {form.lifestyleTags.length > 0 && (
              <p style={{ color: colors.textMuted, margin: 0 }}>{form.lifestyleTags.join(", ")}</p>
            )}
            {error && <p style={{ color: colors.danger }}>{error}</p>}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: spacing.lg }}>
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
              Continuar
            </Button>
          ) : (
            <Button disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Salvando..." : "Criar projeto"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <AuthGuard>
      <AppShell>
        <NewProjectContent />
      </AppShell>
    </AuthGuard>
  );
}
