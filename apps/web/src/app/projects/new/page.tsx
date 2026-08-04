"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../components/AppShell";
import { InspirationImageUploader } from "../../../components/InspirationImageUploader";
import { AuthGuard } from "../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";
import type { CreateBriefingResponse, Venue } from "../../../lib/api-types";

// Wording and options below mirror the real Google Forms briefing Bia sends
// couples ("Decoração de Casamento") as closely as the screenshots she
// shared allow — not a generic placeholder questionnaire. Two upgrades over
// that form: real inspiration photo upload with AI vision analysis (her
// form only takes a link/description), and every answer feeds straight into
// Agente 1's Diagnóstico Criativo instead of living in a spreadsheet.
const LEAD_SOURCE_OPTIONS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FRIEND_REFERRAL", label: "Indicação de amigos" },
  { value: "SUPPLIER_REFERRAL", label: "Indicação de fornecedor" },
  { value: "OTHER", label: "Outros" },
] as const;

const DECOR_STYLE_OPTIONS = [
  "Clássico e elegante",
  "Românticos e delicado",
  "Moderno e minimalista",
  "Tropical",
  "Rústico",
  "Luxuoso e glamuroso",
  "Praiano",
  "Ainda não sei",
];

const DECOR_AREA_OPTIONS = [
  { value: "RECEPTION", label: "Recepção" },
  { value: "CEREMONY", label: "Cerimônia" },
  { value: "GUEST_TABLES", label: "Mesa dos convidados" },
  { value: "CAKE_TABLE", label: "Mesa principal do bolo" },
  { value: "COUPLE_TABLE", label: "Mesa dos noivos" },
  { value: "LOUNGE", label: "Lounge" },
  { value: "OPEN_BAR", label: "Open bar decorado" },
  { value: "BUFFET_STATIONS", label: "Estações de buffet decoradas" },
] as const;

interface BriefingFormState {
  partnerOneName: string;
  partnerTwoName: string;
  email: string;
  phone: string;
  city: string;
  leadSource: string;
  ceremonyDateTime: string;
  venueId: string;
  venueNoteIfNotListed: string;
  ceremonyAndReceptionSameVenue: "SAME" | "DIFFERENT" | "";
  guestsExpected: string;
  howTheyMet: string;
  proposalStory: string;
  decorStyle: string;
  colorPaletteNotes: string;
  inspirationNotes: string;
  thingsToAvoid: string;
  floralPreference: "MIXED" | "NATURAL_ONLY" | "";
  desiredDecorAreas: string[];
  hasWeddingPlanner: "YES" | "NO" | "";
  weddingPlannerName: string;
  bookedSuppliersNotes: string;
  investmentRangeConfirmed: "YES" | "NO" | "";
  budgetAmount: string;
  dietaryRestrictions: string;
  accessibilityNeeds: string;
  additionalNotes: string;
}

const INITIAL_STATE: BriefingFormState = {
  partnerOneName: "",
  partnerTwoName: "",
  email: "",
  phone: "",
  city: "",
  leadSource: "",
  ceremonyDateTime: "",
  venueId: "",
  venueNoteIfNotListed: "",
  ceremonyAndReceptionSameVenue: "",
  guestsExpected: "",
  howTheyMet: "",
  proposalStory: "",
  decorStyle: "",
  colorPaletteNotes: "",
  inspirationNotes: "",
  thingsToAvoid: "",
  floralPreference: "",
  desiredDecorAreas: [],
  hasWeddingPlanner: "",
  weddingPlannerName: "",
  bookedSuppliersNotes: "",
  investmentRangeConfirmed: "",
  budgetAmount: "",
  dietaryRestrictions: "",
  accessibilityNeeds: "",
  additionalNotes: "",
};

const STEPS = ["Contato", "O casamento", "A história", "Decoração", "Logística", "Revisão"] as const;

const textareaStyle = {
  padding: spacing.sm,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
};

const selectStyle = {
  padding: spacing.sm,
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.surface,
};

function FieldLabel({ children }: { children: string }) {
  return <label style={{ color: colors.textMuted, fontSize: "0.9rem" }}>{children}</label>;
}

function ToggleOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: `${spacing.xs} ${spacing.md}`,
        borderRadius: 9999,
        border: `1px solid ${selected ? colors.primary : colors.border}`,
        backgroundColor: selected ? colors.primary : "transparent",
        color: selected ? "#FFFFFF" : colors.textPrimary,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function NewProjectContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_STATE);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Venue[]>("/knowledge-graph/venues", accessToken)
      .then(setVenues)
      .catch(() => setVenues([]));
  }, [accessToken]);

  function toggleDecorArea(value: string) {
    setForm((prev) => ({
      ...prev,
      desiredDecorAreas: prev.desiredDecorAreas.includes(value)
        ? prev.desiredDecorAreas.filter((v) => v !== value)
        : [...prev.desiredDecorAreas, value],
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
          email: form.email || undefined,
          phone: form.phone || undefined,
          city: form.city || undefined,
          leadSource: form.leadSource || undefined,
          venueId: form.venueId,
          venueNoteIfNotListed: form.venueNoteIfNotListed || undefined,
          ceremonyAndReceptionSameVenue:
            form.ceremonyAndReceptionSameVenue === "" ? undefined : form.ceremonyAndReceptionSameVenue === "SAME",
          guestsExpected: form.guestsExpected ? Number(form.guestsExpected) : undefined,
          ceremonyDateTime: form.ceremonyDateTime ? new Date(form.ceremonyDateTime).toISOString() : undefined,
          howTheyMet: form.howTheyMet || undefined,
          proposalStory: form.proposalStory || undefined,
          lifestyleTags: form.decorStyle ? [form.decorStyle] : undefined,
          colorPaletteNotes: form.colorPaletteNotes || undefined,
          inspirationNotes: form.inspirationNotes || undefined,
          thingsToAvoid: form.thingsToAvoid || undefined,
          floralPreference: form.floralPreference || undefined,
          desiredDecorAreas: form.desiredDecorAreas.length ? form.desiredDecorAreas : undefined,
          hasWeddingPlanner: form.hasWeddingPlanner === "" ? undefined : form.hasWeddingPlanner === "YES",
          weddingPlannerName: form.weddingPlannerName || undefined,
          bookedSuppliersNotes: form.bookedSuppliersNotes || undefined,
          investmentRangeConfirmed:
            form.investmentRangeConfirmed === "" ? undefined : form.investmentRangeConfirmed === "YES",
          budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
          dietaryRestrictions: form.dietaryRestrictions
            ? form.dietaryRestrictions.split(",").map((v) => v.trim()).filter(Boolean)
            : undefined,
          accessibilityNeeds: form.accessibilityNeeds || undefined,
          additionalNotes: form.additionalNotes || undefined,
        },
        accessToken,
      );
      // Don't navigate away yet — the couple's whole point in reaching out is
      // usually "olha as fotos que a gente ama", so the wizard's last stop is
      // uploading those photos against the eventId we just got back.
      setCreatedEventId(response.event.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos salvar o briefing. Tente novamente.");
      setSubmitting(false);
    }
  }

  const canAdvance = step === 0 ? form.partnerOneName.trim().length > 0 : true;

  if (createdEventId) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h2>Quase lá!</h2>
        <p style={{ color: colors.textMuted }}>
          O projeto de <strong>{form.partnerOneName}</strong> já foi criado. Se o casal já mandou fotos do
          que ama, sobe aqui — a IA já analisa cada uma.
        </p>
        <div style={{ marginTop: spacing.lg }}>
          <InspirationImageUploader eventId={createdEventId} />
        </div>
        <div style={{ marginTop: spacing.lg }}>
          <Button onClick={() => router.push(`/projects/${createdEventId}`)}>Ir para o projeto</Button>
        </div>
      </div>
    );
  }

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
              placeholder="Nome dos noivos"
              value={form.partnerOneName}
              onChange={(e) => setForm({ ...form, partnerOneName: e.target.value })}
            />
            <Input
              placeholder="Nome do outro noivo (opcional)"
              value={form.partnerTwoName}
              onChange={(e) => setForm({ ...form, partnerTwoName: e.target.value })}
            />
            <Input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Telefone/WhatsApp para contato"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="De qual cidade vocês são?"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <FieldLabel>Como conheceu o trabalho da Bia?</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {LEAD_SOURCE_OPTIONS.map((option) => (
                <ToggleOption
                  key={option.value}
                  label={option.label}
                  selected={form.leadSource === option.value}
                  onClick={() => setForm({ ...form, leadSource: option.value })}
                />
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <h2 style={{ margin: 0 }}>O casamento</h2>
            <FieldLabel>Data do casamento</FieldLabel>
            <Input
              type="datetime-local"
              value={form.ceremonyDateTime}
              onChange={(e) => setForm({ ...form, ceremonyDateTime: e.target.value })}
            />
            <FieldLabel>Local do evento</FieldLabel>
            <select
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value })}
              style={selectStyle}
            >
              <option value="">Selecione um espaço já cadastrado</option>
              {venues?.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Não achou o espaço na lista? Escreve o nome aqui (cadastramos depois)"
              value={form.venueNoteIfNotListed}
              onChange={(e) => setForm({ ...form, venueNoteIfNotListed: e.target.value })}
            />
            <FieldLabel>Cerimônia e festa</FieldLabel>
            <div style={{ display: "flex", gap: spacing.sm }}>
              <ToggleOption
                label="No mesmo local"
                selected={form.ceremonyAndReceptionSameVenue === "SAME"}
                onClick={() => setForm({ ...form, ceremonyAndReceptionSameVenue: "SAME" })}
              />
              <ToggleOption
                label="Em locais diferentes"
                selected={form.ceremonyAndReceptionSameVenue === "DIFFERENT"}
                onClick={() => setForm({ ...form, ceremonyAndReceptionSameVenue: "DIFFERENT" })}
              />
            </div>
            <Input
              type="number"
              placeholder="Número estimado de convidados"
              value={form.guestsExpected}
              onChange={(e) => setForm({ ...form, guestsExpected: e.target.value })}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <h2 style={{ margin: 0 }}>Agora, a história deles</h2>
            <p style={{ color: colors.textMuted, margin: 0 }}>
              A emoção vem antes da decoração — é a história que guia o conceito.
            </p>
            <FieldLabel>Como eles se conheceram?</FieldLabel>
            <textarea
              rows={3}
              value={form.howTheyMet}
              onChange={(e) => setForm({ ...form, howTheyMet: e.target.value })}
              style={textareaStyle}
            />
            <FieldLabel>Como foi o pedido?</FieldLabel>
            <textarea
              rows={3}
              value={form.proposalStory}
              onChange={(e) => setForm({ ...form, proposalStory: e.target.value })}
              style={textareaStyle}
            />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <h2 style={{ margin: 0 }}>Como você imagina a decoração?</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {DECOR_STYLE_OPTIONS.map((option) => (
                <ToggleOption
                  key={option}
                  label={option}
                  selected={form.decorStyle === option}
                  onClick={() => setForm({ ...form, decorStyle: option })}
                />
              ))}
            </div>
            <Input
              placeholder="Paleta de cores"
              value={form.colorPaletteNotes}
              onChange={(e) => setForm({ ...form, colorPaletteNotes: e.target.value })}
            />
            <FieldLabel>
              Existe alguma decoração que vocês viram e amaram? Link, foto ou descrição
            </FieldLabel>
            <textarea
              rows={2}
              value={form.inspirationNotes}
              onChange={(e) => setForm({ ...form, inspirationNotes: e.target.value })}
              style={textareaStyle}
            />
            <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.85rem" }}>
              Se tiver as fotos em mãos, melhor ainda — dá pra subir de verdade no último passo.
            </p>
            <FieldLabel>Há algo que vocês definitivamente NÃO querem na decoração?</FieldLabel>
            <textarea
              rows={2}
              value={form.thingsToAvoid}
              onChange={(e) => setForm({ ...form, thingsToAvoid: e.target.value })}
              style={textareaStyle}
            />
            <FieldLabel>A parte floral pode ser mista (permanentes com naturais) ou apenas naturais?</FieldLabel>
            <div style={{ display: "flex", gap: spacing.sm }}>
              <ToggleOption
                label="Mistas"
                selected={form.floralPreference === "MIXED"}
                onClick={() => setForm({ ...form, floralPreference: "MIXED" })}
              />
              <ToggleOption
                label="Apenas naturais"
                selected={form.floralPreference === "NATURAL_ONLY"}
                onClick={() => setForm({ ...form, floralPreference: "NATURAL_ONLY" })}
              />
            </div>
            <FieldLabel>Em quais espaços quer decoração? Pode marcar mais de uma opção</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {DECOR_AREA_OPTIONS.map((option) => (
                <ToggleOption
                  key={option.value}
                  label={option.label}
                  selected={form.desiredDecorAreas.includes(option.value)}
                  onClick={() => toggleDecorArea(option.value)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <h2 style={{ margin: 0 }}>Logística e orçamento</h2>
            <FieldLabel>Já tem cerimonialista ou assessora de casamento contratada?</FieldLabel>
            <div style={{ display: "flex", gap: spacing.sm }}>
              <ToggleOption
                label="Sim"
                selected={form.hasWeddingPlanner === "YES"}
                onClick={() => setForm({ ...form, hasWeddingPlanner: "YES" })}
              />
              <ToggleOption
                label="Não"
                selected={form.hasWeddingPlanner === "NO"}
                onClick={() => setForm({ ...form, hasWeddingPlanner: "NO" })}
              />
            </div>
            {form.hasWeddingPlanner === "YES" && (
              <Input
                placeholder="Qual o nome?"
                value={form.weddingPlannerName}
                onChange={(e) => setForm({ ...form, weddingPlannerName: e.target.value })}
              />
            )}
            <FieldLabel>Já fecharam com algum fornecedor para o evento?</FieldLabel>
            <textarea
              rows={2}
              value={form.bookedSuppliersNotes}
              onChange={(e) => setForm({ ...form, bookedSuppliersNotes: e.target.value })}
              style={textareaStyle}
            />
            <FieldLabel>
              O projeto de decoração é exclusivo e personalizado, com investimento inicial a partir de R$ 20
              mil. Essa faixa está alinhada ao planejamento de vocês?
            </FieldLabel>
            <div style={{ display: "flex", gap: spacing.sm }}>
              <ToggleOption
                label="Sim"
                selected={form.investmentRangeConfirmed === "YES"}
                onClick={() => setForm({ ...form, investmentRangeConfirmed: "YES" })}
              />
              <ToggleOption
                label="Não"
                selected={form.investmentRangeConfirmed === "NO"}
                onClick={() => setForm({ ...form, investmentRangeConfirmed: "NO" })}
              />
            </div>
            <Input
              type="number"
              placeholder="Se quiser, um valor estimado de orçamento (opcional)"
              value={form.budgetAmount}
              onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
            />
            <Input
              placeholder="Restrições alimentares dos convidados (separadas por vírgula, opcional)"
              value={form.dietaryRestrictions}
              onChange={(e) => setForm({ ...form, dietaryRestrictions: e.target.value })}
            />
            <Input
              placeholder="Alguma necessidade de acessibilidade? (opcional)"
              value={form.accessibilityNeeds}
              onChange={(e) => setForm({ ...form, accessibilityNeeds: e.target.value })}
            />
            <FieldLabel>Algum outro detalhe importante que gostaria de compartilhar?</FieldLabel>
            <textarea
              rows={2}
              value={form.additionalNotes}
              onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
              style={textareaStyle}
            />
          </div>
        )}

        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            <h2 style={{ margin: 0 }}>Tudo certo?</h2>
            <p style={{ margin: 0 }}>
              <strong>{form.partnerOneName}</strong>
              {form.partnerTwoName && ` & ${form.partnerTwoName}`}
            </p>
            <p style={{ color: colors.textMuted, margin: 0 }}>
              {venues?.find((v) => v.id === form.venueId)?.name ?? (form.venueNoteIfNotListed || "Espaço não informado")}
            </p>
            {form.decorStyle && <p style={{ color: colors.textMuted, margin: 0 }}>{form.decorStyle}</p>}
            {!form.venueId && (
              <p style={{ color: colors.danger, margin: 0 }}>
                Falta selecionar um espaço já cadastrado no passo &quot;O casamento&quot; — sem isso não dá
                pra criar o projeto ainda (mesmo que o espaço final ainda não esteja decidido).
              </p>
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
            <Button disabled={submitting || !form.venueId} onClick={handleSubmit}>
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
