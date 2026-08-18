"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, colors, spacing } from "@eve-os/ui";
import { apiClient, ApiError } from "../../lib/api-client";

type PublicProposal = {
  id: string;
  version: number;
  status: string;
  scope: "FULL_EVENT" | "DECORATION_ONLY";
  clientNames: string;
  eventType: string;
  eventDate: string | null;
  guestsExpected: number | null;
  venue: { name?: string; municipality?: string };
  suppliers: Array<{ name: string; categoryLabel: string; scope?: string | null }>;
  lineItems: Array<{ description: string; total: number; pricingStatus: string }>;
  logisticsItems: Array<{ label: string; total: number; treatment: string; pricingStatus: string }>;
  packages: Array<{ name: string; description: string; totalInvestment: number; pricingStatus: string; selected: boolean }>;
  subtotal: number;
  contingencyAmount: number;
  managementFee: number;
  discount: number;
  totalInvestment: number;
  validUntil: string | null;
  conditions: string[];
  nextSteps: string[];
  commercialNotes: string | null;
  hasUnconfirmedData: boolean;
  payments: Array<{ label: string; amount: number; dueDate: string; status: string }>;
};

type PublicProposalResponse = {
  decision: "PENDING" | "APPROVED" | "REJECTED";
  expiresAt: string;
  recipientName: string | null;
  proposal: PublicProposal;
};

const scopeLabel = {
  FULL_EVENT: "Evento completo",
  DECORATION_ONLY: "Somente decoração",
};

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ApprovalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [data, setData] = useState<PublicProposalResponse | null>(null);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Link de aprovação não informado.");
      return;
    }
    apiClient
      .get<PublicProposalResponse>(`/public/commercial-proposals/${encodeURIComponent(token)}`)
      .then((response) => {
        setData(response);
        setName(response.recipientName ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar a proposta."))
      .finally(() => setLoading(false));
  }, [token]);

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (!token) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.post<PublicProposalResponse>(
        `/public/commercial-proposals/${encodeURIComponent(token)}/decision`,
        { decision, name: name || undefined, comment: comment || undefined },
      );
      setData(response);
      setSuccess(decision === "APPROVED" ? "A proposta foi aprovada com sucesso." : "A proposta foi devolvida para revisão.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos registrar sua decisão.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <main style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px", color: colors.textPrimary }}>Carregando proposta...</main>;
  if (error && !data) return <main style={{ maxWidth: 700, margin: "0 auto", padding: "56px 24px", color: colors.danger }}><h1>Proposta indisponível</h1><p>{error}</p></main>;
  if (!data) return null;
  const proposal = data.proposal;
  const isPending = data.decision === "PENDING";

  return (
    <main style={{ minHeight: "100vh", background: colors.background, color: colors.textPrimary, padding: "36px 20px 72px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <p style={{ color: colors.primary, textTransform: "uppercase", letterSpacing: 2, fontSize: 12 }}>EVE OS · Proposta comercial</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, margin: "12px 0 8px" }}>{proposal.clientNames || "Proposta para o seu evento"}</h1>
        <p style={{ color: colors.textMuted }}>{scopeLabel[proposal.scope]} · versão {proposal.version}</p>

        {error && <div style={{ padding: 12, borderRadius: 8, background: "#FDECE9", color: colors.danger, marginTop: spacing.md }}>{error}</div>}
        {success && <div style={{ padding: 12, borderRadius: 8, background: "#EAF5EC", color: "#3D7045", marginTop: spacing.md }}>{success}</div>}

        <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: spacing.lg, marginTop: spacing.lg }}>
          <h2>Resumo do evento</h2>
          <p><strong>Espaço:</strong> {proposal.venue.name ?? "A definir"}{proposal.venue.municipality ? ` · ${proposal.venue.municipality}` : ""}</p>
          <p><strong>Tipo:</strong> {proposal.eventType || "Casamento"} · <strong>Convidados:</strong> {proposal.guestsExpected ?? "A definir"}</p>
          {proposal.eventDate && <p><strong>Data:</strong> {new Date(proposal.eventDate).toLocaleDateString("pt-BR")}</p>}
        </section>

        <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: spacing.lg, marginTop: spacing.md }}>
          <h2>Composição selecionada</h2>
          {proposal.suppliers.map((supplier) => <p key={`${supplier.name}-${supplier.categoryLabel}`}><strong>{supplier.categoryLabel}:</strong> {supplier.name}{supplier.scope ? ` — ${supplier.scope}` : ""}</p>)}
          {proposal.lineItems.map((item) => <div key={item.description} style={{ display: "flex", justifyContent: "space-between", gap: spacing.md, borderTop: `1px solid ${colors.border}`, padding: "10px 0" }}><span>{item.description}</span><strong>{money(item.total)}</strong></div>)}
          {proposal.logisticsItems.map((item) => <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: spacing.md, borderTop: `1px solid ${colors.border}`, padding: "10px 0", color: colors.textMuted }}><span>{item.label}</span><strong>{item.treatment === "ADDITIONAL" ? money(item.total) : "Incluído"}</strong></div>)}
        </section>

        {proposal.packages.length > 0 && <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: spacing.lg, marginTop: spacing.md }}>
          <h2>Opções de pacote</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: spacing.sm }}>
            {proposal.packages.map((pkg) => <div key={pkg.name} style={{ border: `1px solid ${pkg.selected ? colors.primary : colors.border}`, borderRadius: 10, padding: spacing.sm }}><strong>{pkg.name}{pkg.selected ? " · recomendado" : ""}</strong><p style={{ color: colors.textMuted, fontSize: 13 }}>{pkg.description}</p><strong>{money(pkg.totalInvestment)}</strong><p style={{ color: colors.textMuted, fontSize: 12 }}>{pkg.pricingStatus}</p></div>)}
          </div>
        </section>}

        <section style={{ background: "#F8F3EC", borderRadius: 14, padding: spacing.lg, marginTop: spacing.md }}>
          <p style={{ color: colors.textMuted }}>Subtotal: {money(proposal.subtotal)}</p>
          <p style={{ color: colors.textMuted }}>Contingência: {money(proposal.contingencyAmount)} · Gestão: {money(proposal.managementFee)} · Desconto: {money(proposal.discount)}</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 30, margin: "14px 0 0" }}>{money(proposal.totalInvestment)}</p>
          {proposal.hasUnconfirmedData && <p style={{ color: colors.danger, fontSize: 13 }}>Alguns contatos, valores, disponibilidade ou condições ainda precisam de confirmação final.</p>}
        </section>

        <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: spacing.lg, marginTop: spacing.md }}>
          <h2>Condições</h2>
          {proposal.conditions.map((condition) => <p key={condition}>• {condition}</p>)}
          {proposal.commercialNotes && <p style={{ color: colors.textMuted }}>{proposal.commercialNotes}</p>}
          {proposal.validUntil && <p style={{ color: colors.textMuted }}>Validade desta proposta: {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}.</p>}
        </section>

        {isPending ? <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: spacing.lg, marginTop: spacing.md }}>
          <h2>Sua decisão</h2>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" style={{ width: "100%", padding: 11, borderRadius: 7, border: `1px solid ${colors.border}` }} />
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comentário opcional" rows={3} style={{ width: "100%", marginTop: 9, padding: 11, borderRadius: 7, border: `1px solid ${colors.border}` }} />
          <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.md }}>
            <Button onClick={() => decide("APPROVED")} disabled={pending}>{pending ? "Registrando..." : "Aprovar proposta"}</Button>
            <Button variant="ghost" onClick={() => decide("REJECTED")} disabled={pending}>Solicitar ajustes</Button>
          </div>
        </section> : <section style={{ background: "#EAF5EC", borderRadius: 14, padding: spacing.lg, marginTop: spacing.md }}><h2>Decisão registrada</h2><p>{data.decision === "APPROVED" ? "Esta proposta foi aprovada." : "Esta proposta foi devolvida para revisão."}</p></section>}
      </div>
    </main>
  );
}

export default function AprovarPropostaPage() {
  return <Suspense fallback={<main style={{ padding: 40 }}>Carregando...</main>}><ApprovalContent /></Suspense>;
}
