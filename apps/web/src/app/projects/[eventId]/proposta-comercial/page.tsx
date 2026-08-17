"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "../../../../components/AppShell";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useLatestProposalId } from "../../../../lib/use-latest-proposal-id";
import { Button, colors, spacing } from "@eve-os/ui";
import type {
  CommercialProposal,
  CommercialProposalVersion,
  CommercialPricingStatus,
  Supplier,
  WeddingKnowledgeResponse,
} from "../../../../lib/api-types";

type SupplierDraft = {
  selected: boolean;
  scope: string;
  unitPrice: string;
  pricingStatus: CommercialPricingStatus;
};

const CATEGORY_LABELS: Record<string, string> = {
  CATERING: "Buffet e gastronomia",
  FURNITURE_RENTAL: "Mobiliário e locação",
  LIGHTING: "Som, iluminação e estrutura",
  MUSIC: "Música e DJ",
  PHOTOGRAPHY: "Fotografia e filmagem",
  FLORIST: "Flores e paisagismo",
  ASSEMBLY_CREW: "Montagem e desmontagem",
  OTHER: "Decoração e serviços complementares",
};

const CATEGORY_ORDER = [
  "CATERING",
  "OTHER",
  "FURNITURE_RENTAL",
  "PHOTOGRAPHY",
  "LIGHTING",
  "MUSIC",
  "ASSEMBLY_CREW",
];

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PropostaComercialContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { proposalId, error: proposalError } = useLatestProposalId(eventId);
  const [knowledge, setKnowledge] = useState<WeddingKnowledgeResponse | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [commercialProposal, setCommercialProposal] = useState<CommercialProposal | null>(null);
  const [versions, setVersions] = useState<CommercialProposalVersion[]>([]);
  const [venueResearchId, setVenueResearchId] = useState("");
  const [supplierDrafts, setSupplierDrafts] = useState<Record<string, SupplierDraft>>({});
  const [contingencyPercent, setContingencyPercent] = useState("0");
  const [managementFee, setManagementFee] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [validityDays, setValidityDays] = useState("10");
  const [commercialNotes, setCommercialNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [acknowledgeUnconfirmedData, setAcknowledgeUnconfirmedData] = useState(false);
  const [statusNotes, setStatusNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !proposalId) return;
    setLoading(true);
    Promise.all([
      apiClient.get<WeddingKnowledgeResponse>("/knowledge-graph/wedding-knowledge", accessToken),
      apiClient.get<Supplier[]>("/knowledge-graph/suppliers", accessToken),
      apiClient
        .get<CommercialProposal>(`/creative/proposals/${proposalId}/commercial`, accessToken)
        .catch(() => null),
      apiClient
        .get<CommercialProposalVersion[]>(`/creative/proposals/${proposalId}/commercial/versions`, accessToken)
        .catch(() => []),
    ])
      .then(([knowledgeResponse, supplierResponse, commercialResponse, versionResponse]) => {
        setKnowledge(knowledgeResponse);
        setSuppliers(supplierResponse);
        setCommercialProposal(commercialResponse);
        setVersions(versionResponse);
        if (commercialResponse) {
          setVenueResearchId(
            commercialResponse.venue.source === "RESEARCH_CATALOG" ? commercialResponse.venue.id ?? "" : "",
          );
          setContingencyPercent(
            commercialResponse.subtotal > 0
              ? String(Math.round((commercialResponse.contingencyAmount / commercialResponse.subtotal) * 10000) / 100)
              : "0",
          );
          setManagementFee(String(commercialResponse.managementFee));
          setDiscount(String(commercialResponse.discount));
          setValidityDays(String(commercialResponse.validityDays));
          setCommercialNotes(commercialResponse.commercialNotes ?? "");
          const existingDrafts: Record<string, SupplierDraft> = {};
          commercialResponse.suppliers.forEach((supplier) => {
            existingDrafts[supplier.supplierId] = {
              selected: true,
              scope: supplier.scope,
              unitPrice: supplier.estimatedCost == null ? "" : String(supplier.estimatedCost),
              pricingStatus: supplier.pricingStatus,
            };
          });
          setSupplierDrafts(existingDrafts);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os dados comerciais."))
      .finally(() => setLoading(false));
  }, [accessToken, proposalId]);

  const groupedSuppliers = useMemo(() => {
    const groups = new Map<string, Supplier[]>();
    suppliers.forEach((supplier) => {
      const current = groups.get(supplier.category) ?? [];
      current.push(supplier);
      groups.set(supplier.category, current);
    });
    return [...groups.entries()].sort(
      ([categoryA], [categoryB]) => CATEGORY_ORDER.indexOf(categoryA) - CATEGORY_ORDER.indexOf(categoryB),
    );
  }, [suppliers]);

  function toggleSupplier(supplier: Supplier) {
    setSupplierDrafts((current) => ({
      ...current,
      [supplier.id]: {
        selected: !(current[supplier.id]?.selected ?? false),
        scope: current[supplier.id]?.scope ?? supplier.performanceNotes ?? "",
        unitPrice: current[supplier.id]?.unitPrice ?? (supplier.estimatedCost == null ? "" : String(supplier.estimatedCost)),
        pricingStatus: current[supplier.id]?.pricingStatus ?? (supplier.estimatedCost == null ? "QUOTE_PENDING" : "ESTIMATE"),
      },
    }));
  }

  function updateSupplierDraft(supplier: Supplier, patch: Partial<SupplierDraft>) {
    setSupplierDrafts((current) => ({
      ...current,
      [supplier.id]: {
        selected: current[supplier.id]?.selected ?? true,
        scope: current[supplier.id]?.scope ?? "",
        unitPrice: current[supplier.id]?.unitPrice ?? "",
        pricingStatus: current[supplier.id]?.pricingStatus ?? "QUOTE_PENDING",
        ...patch,
      },
    }));
  }

  async function refreshVersions() {
    if (!proposalId) return;
    try {
      const response = await apiClient.get<CommercialProposalVersion[]>(
        `/creative/proposals/${proposalId}/commercial/versions`,
        accessToken,
      );
      setVersions(response);
    } catch {
      // The saved proposal remains usable even if the timeline refresh is temporarily unavailable.
    }
  }

  async function handleSave() {
    if (!proposalId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const supplierSelections = suppliers
        .map((supplier) => {
          const draft = supplierDrafts[supplier.id];
          if (!draft?.selected) return null;
          return {
            supplierId: supplier.id,
            scope: draft.scope || undefined,
            unitPrice: draft.unitPrice === "" ? undefined : Number(draft.unitPrice),
            pricingStatus: draft.pricingStatus,
          };
        })
        .filter((selection): selection is NonNullable<typeof selection> => selection !== null);
      const saved = await apiClient.post<CommercialProposal>(
        `/creative/proposals/${proposalId}/commercial`,
        {
          venueResearchId: venueResearchId || null,
          supplierSelections,
          contingencyPercent: Number(contingencyPercent || 0),
          managementFee: Number(managementFee || 0),
          discount: Number(discount || 0),
          validityDays: Number(validityDays || 10),
          commercialNotes: commercialNotes || null,
        },
        accessToken,
      );
      setCommercialProposal(saved);
      await refreshVersions();
      setSuccess("Modelo comercial salvo. Você já pode revisar os valores ou avançar na aprovação.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos salvar a proposta comercial.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(status: "READY" | "SENT" | "APPROVED" | "REJECTED") {
    if (!proposalId || !commercialProposal) return;
    if (
      (status === "SENT" || status === "APPROVED") &&
      commercialProposal.hasUnconfirmedData &&
      !acknowledgeUnconfirmedData
    ) {
      setError("Marque a confirmação das pendências antes de enviar ou aprovar.");
      return;
    }
    setStatusPending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.post<{ commercialProposal: CommercialProposal }>(
        `/creative/proposals/${proposalId}/commercial/status`,
        {
          status,
          acknowledgeUnconfirmedData,
          notes: statusNotes || null,
        },
        accessToken,
      );
      setCommercialProposal(response.commercialProposal);
      await refreshVersions();
      setSuccess(
        status === "READY"
          ? "Proposta marcada como pronta para envio."
          : status === "SENT"
            ? "Proposta marcada como enviada."
            : status === "APPROVED"
              ? "Proposta comercial aprovada. A produção foi liberada."
              : "Proposta comercial rejeitada e devolvida para revisão.",
      );
      setStatusNotes("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos atualizar o status comercial.");
    } finally {
      setStatusPending(false);
    }
  }

  async function handleDownload() {
    if (!proposalId) return;
    setDownloading(true);
    setError(null);
    try {
      const blob = await apiClient.downloadBlob(`/creative/proposals/${proposalId}/commercial/pdf`, accessToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposta-comercial-${proposalId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos baixar o PDF comercial.");
    } finally {
      setDownloading(false);
    }
  }

  if (proposalError) return <p style={{ color: colors.danger }}>{proposalError}</p>;
  if (proposalId === undefined || loading) return <p style={{ color: colors.textMuted }}>Carregando modelo comercial...</p>;
  if (proposalId === null) {
    return (
      <p style={{ color: colors.textMuted }}>
        Primeiro gere o diagnóstico e a proposta criativa. <Link href={`/projects/${eventId}/diagnostico`}>Ir para diagnóstico</Link>.
      </p>
    );
  }

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}/proposta`} style={{ color: colors.textMuted }}>
          ← Voltar à proposta
        </Link>
      </p>
      <h1>Proposta comercial integrada</h1>
      <p style={{ color: colors.textMuted, maxWidth: 760 }}>
        Selecione o espaço pesquisado e os fornecedores que farão parte da composição. O EVE OS preserva os dados selecionados, calcula o investimento e sinaliza o que ainda precisa de confirmação.
      </p>

      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {success && <p style={{ color: "#54745A" }}>{success}</p>}

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>1. Espaço de evento</h2>
        <label style={{ display: "block", color: colors.textMuted, fontSize: 13 }}>
          Espaço pesquisado
          <select
            value={venueResearchId}
            onChange={(event) => setVenueResearchId(event.target.value)}
            style={{ display: "block", width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: `1px solid ${colors.border}` }}
          >
            <option value="">Usar o espaço interno do projeto</option>
            {(knowledge?.venues ?? []).map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} — {venue.municipality}
              </option>
            ))}
          </select>
        </label>
        {venueResearchId && (
          <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 0 }}>
            {knowledge?.venues.find((venue) => venue.id === venueResearchId)?.notes ?? "Espaço selecionado a partir do catálogo regional."}
          </p>
        )}
      </section>

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>2. Fornecedores e escopo</h2>
        <p style={{ color: colors.textMuted, fontSize: 13 }}>Marque os fornecedores que entram na composição. O valor inicial usa `estimatedCost` apenas quando ele existir; caso contrário, fica como cotação pendente.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {groupedSuppliers.map(([category, categorySuppliers]) => (
            <div key={category}>
              <h3 style={{ marginBottom: spacing.xs }}>{CATEGORY_LABELS[category] ?? category}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
                {categorySuppliers.map((supplier) => {
                  const draft = supplierDrafts[supplier.id] ?? {
                    selected: false,
                    scope: supplier.performanceNotes ?? "",
                    unitPrice: supplier.estimatedCost == null ? "" : String(supplier.estimatedCost),
                    pricingStatus: supplier.estimatedCost == null ? "QUOTE_PENDING" : "ESTIMATE",
                  };
                  return (
                    <div key={supplier.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: spacing.sm }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                        <input type="checkbox" checked={draft.selected} onChange={() => toggleSupplier(supplier)} />
                        {supplier.name}
                        <span style={{ color: colors.textMuted, fontSize: 12, fontWeight: 400 }}>{supplier.validationLevel ?? "validação pendente"}</span>
                      </label>
                      {draft.selected && (
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 150px 170px", gap: 8, marginTop: 8 }}>
                          <input value={draft.scope} onChange={(event) => updateSupplierDraft(supplier, { scope: event.target.value })} placeholder="Escopo deste fornecedor" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                          <input value={draft.unitPrice} onChange={(event) => updateSupplierDraft(supplier, { unitPrice: event.target.value })} placeholder="Valor estimado" inputMode="decimal" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                          <select value={draft.pricingStatus} onChange={(event) => updateSupplierDraft(supplier, { pricingStatus: event.target.value as CommercialPricingStatus })} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                            <option value="ESTIMATE">Estimativa</option>
                            <option value="QUOTE_PENDING">Cotação pendente</option>
                            <option value="CONFIRMED">Confirmado</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>3. Ajustes comerciais</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: spacing.sm }}>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Contingência (%)<input value={contingencyPercent} onChange={(event) => setContingencyPercent(event.target.value)} inputMode="decimal" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Taxa de gestão<input value={managementFee} onChange={(event) => setManagementFee(event.target.value)} inputMode="decimal" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Desconto<input value={discount} onChange={(event) => setDiscount(event.target.value)} inputMode="decimal" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Validade (dias)<input value={validityDays} onChange={(event) => setValidityDays(event.target.value)} inputMode="numeric" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
        </div>
        <label style={{ display: "block", color: colors.textMuted, fontSize: 13, marginTop: spacing.sm }}>Observações comerciais<textarea value={commercialNotes} onChange={(event) => setCommercialNotes(event.target.value)} rows={3} style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md }}>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar composição comercial"}</Button>
        <Button variant="ghost" onClick={handleDownload} disabled={!commercialProposal || downloading}>{downloading ? "Gerando PDF..." : "Baixar PDF comercial"}</Button>
      </div>

      {commercialProposal && (
        <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
          <h2>4. Revisão e aprovação</h2>
          <p style={{ color: colors.textMuted, fontSize: 13, marginTop: 0 }}>
            A proposta passa por revisão interna antes de ser enviada. A produção só é liberada depois do status <strong>APROVADA</strong>.
          </p>
          {commercialProposal.hasUnconfirmedData && commercialProposal.status !== "APPROVED" && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm }}>
              <input type="checkbox" checked={acknowledgeUnconfirmedData} onChange={(event) => setAcknowledgeUnconfirmedData(event.target.checked)} />
              Reconheço que existem contatos, preços, disponibilidade ou dados do espaço ainda pendentes de confirmação.
            </label>
          )}
          {commercialProposal.status !== "APPROVED" && (
            <textarea value={statusNotes} onChange={(event) => setStatusNotes(event.target.value)} rows={2} placeholder="Observação da revisão ou motivo da rejeição" style={{ display: "block", width: "100%", marginBottom: spacing.sm, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
            {(commercialProposal.status === "DRAFT" || commercialProposal.status === "REJECTED") && <Button onClick={() => handleStatus("READY")} disabled={statusPending}>Marcar como pronta</Button>}
            {commercialProposal.status === "READY" && <Button onClick={() => handleStatus("SENT")} disabled={statusPending}>Registrar envio ao cliente</Button>}
            {commercialProposal.status === "SENT" && <Button onClick={() => handleStatus("APPROVED")} disabled={statusPending}>Registrar aprovação</Button>}
            {(commercialProposal.status === "SENT" || commercialProposal.status === "READY") && <Button variant="ghost" onClick={() => handleStatus("REJECTED")} disabled={statusPending}>Devolver para revisão</Button>}
            {commercialProposal.status === "APPROVED" && <span style={{ color: "#54745A", fontWeight: 600 }}>Aprovada · produção liberada</span>}
          </div>
        </section>
      )}

      {commercialProposal && (
        <section style={{ background: "#F8F3EC", borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
          <h2>Resumo salvo · versão {commercialProposal.version}</h2>
          <p style={{ color: colors.textMuted }}>Status: <strong>{commercialProposal.status}</strong>{commercialProposal.hasUnconfirmedData ? " · contém dados a confirmar" : " · dados confirmados"}</p>
          <p style={{ fontSize: 24, fontWeight: 700 }}>{formatMoney(commercialProposal.totalInvestment)}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {commercialProposal.lineItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: spacing.sm, fontSize: 13 }}>
                <span>{item.description}</span><strong>{formatMoney(item.total)}</strong>
              </div>
            ))}
          </div>
          {versions.length > 0 && (
            <div style={{ marginTop: spacing.md, paddingTop: spacing.sm, borderTop: `1px solid ${colors.border}` }}>
              <p style={{ color: colors.textMuted, margin: 0, fontSize: 12, textTransform: "uppercase" }}>Histórico da proposta</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
                {versions.slice().reverse().map((version) => (
                  <div key={version.id} style={{ display: "flex", justifyContent: "space-between", gap: spacing.sm, fontSize: 12 }}>
                    <span>v{version.version} · {version.action} · {version.status}</span>
                    <strong>{formatMoney(version.totalInvestment)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export default function PropostaComercialPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <PropostaComercialContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
