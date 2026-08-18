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
  CommercialProposalScope,
  CommercialProposalVersion,
  CommercialLogisticsTreatment,
  CommercialPricingStatus,
  CommercialQuote,
  CommercialQuoteStatus,
  CommercialPayment,
  CommercialPaymentStatus,
  CommercialSupplierCategory,
  Supplier,
  WeddingKnowledgeResponse,
} from "../../../../lib/api-types";

type SupplierDraft = {
  selected: boolean;
  scope: string;
  unitPrice: string;
  pricingStatus: CommercialPricingStatus;
};

type CustomItemDraft = {
  id?: string;
  category: CommercialSupplierCategory;
  description: string;
  supplierId: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  pricingStatus: CommercialPricingStatus;
  notes: string;
};

type LogisticsDraft = {
  id?: string;
  supplierId: string;
  label: string;
  treatment: CommercialLogisticsTreatment;
  quantity: string;
  unit: string;
  unitPrice: string;
  pricingStatus: CommercialPricingStatus;
  notes: string;
};

type PackageDraft = {
  id?: string;
  tier: "ESSENTIAL" | "RECOMMENDED" | "COMPLETE";
  name: string;
  description: string;
  totalInvestment: string;
  pricingStatus: CommercialPricingStatus;
  selected: boolean;
};

const DEFAULT_PACKAGES: PackageDraft[] = [
  { tier: "ESSENTIAL", name: "Essencial", description: "Composição essencial para o escopo escolhido.", totalInvestment: "", pricingStatus: "QUOTE_PENDING", selected: false },
  { tier: "RECOMMENDED", name: "Recomendado", description: "Composição equilibrada para o conceito e o espaço.", totalInvestment: "", pricingStatus: "ESTIMATE", selected: true },
  { tier: "COMPLETE", name: "Completo", description: "Experiência ampliada com itens e serviços opcionais.", totalInvestment: "", pricingStatus: "QUOTE_PENDING", selected: false },
];

const CATEGORY_LABELS: Record<string, string> = {
  CATERING: "Buffet e gastronomia",
  FURNITURE_RENTAL: "Móveis e locações",
  LIGHTING: "Som, iluminação e estrutura",
  MUSIC: "Música e DJ",
  PHOTOGRAPHY: "Fotografia e filmagem",
  FLORIST: "Flores e folhagens",
  ASSEMBLY_CREW: "Montagem e desmontagem",
  OTHER: "Objetos, tecidos e itens complementares",
  DECOR: "Flores e ambientação",
};

const CATEGORY_ORDER = [
  "FLORIST",
  "OTHER",
  "FURNITURE_RENTAL",
  "LIGHTING",
  "ASSEMBLY_CREW",
  "CATERING",
  "PHOTOGRAPHY",
  "MUSIC",
];

const DECORATION_ONLY_CATEGORIES = new Set([
  "FLORIST",
  "FURNITURE_RENTAL",
  "LIGHTING",
  "ASSEMBLY_CREW",
  "OTHER",
]);

const SCOPE_LABELS: Record<CommercialProposalScope, string> = {
  FULL_EVENT: "Evento completo",
  DECORATION_ONLY: "Somente decoração",
};

const REGIONAL_SERVICE_AREA_TOKENS = [
  "regiao dos lagos",
  "cabo frio",
  "buzios",
  "armacao dos buzios",
  "arraial do cabo",
  "araruama",
  "sao pedro da aldeia",
  "saquarema",
  "iguaba grande",
];

function isRegionalSupplier(supplier: Supplier): boolean {
  return supplier.serviceArea.some((area) => {
    const normalized = area.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return REGIONAL_SERVICE_AREA_TOKENS.some((token) => normalized.includes(token));
  });
}

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
  const [scope, setScope] = useState<CommercialProposalScope>("FULL_EVENT");
  const [venueResearchId, setVenueResearchId] = useState("");
  const [supplierDrafts, setSupplierDrafts] = useState<Record<string, SupplierDraft>>({});
  const [customItems, setCustomItems] = useState<CustomItemDraft[]>([]);
  const [logisticsDrafts, setLogisticsDrafts] = useState<LogisticsDraft[]>([]);
  const [packages, setPackages] = useState<PackageDraft[]>(DEFAULT_PACKAGES);
  const [quotes, setQuotes] = useState<CommercialQuote[]>([]);
  const [quoteTitle, setQuoteTitle] = useState("");
  const [quoteCategory, setQuoteCategory] = useState<CommercialSupplierCategory>("DECOR");
  const [quoteSupplierId, setQuoteSupplierId] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [quoteStatus, setQuoteStatus] = useState<CommercialQuoteStatus>("RECEIVED");
  const [paymentLabel, setPaymentLabel] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<CommercialPaymentStatus>("PENDING");
  const [contingencyPercent, setContingencyPercent] = useState("0");
  const [managementFee, setManagementFee] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [internalCost, setInternalCost] = useState("");
  const [validityDays, setValidityDays] = useState("10");
  const [commercialNotes, setCommercialNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
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
      apiClient
        .get<CommercialQuote[]>(`/creative/proposals/${proposalId}/commercial/quotes`, accessToken)
        .catch(() => []),
    ])
      .then(([knowledgeResponse, supplierResponse, commercialResponse, versionResponse, quoteResponse]) => {
        setKnowledge(knowledgeResponse);
        setSuppliers(supplierResponse.filter(isRegionalSupplier));
        setCommercialProposal(commercialResponse);
        setScope(commercialResponse?.scope ?? "FULL_EVENT");
        setVersions(versionResponse);
        setQuotes(quoteResponse);
        if (commercialResponse) {
          setPackages(commercialResponse.packages.map((item) => ({
            id: item.id,
            tier: item.tier,
            name: item.name,
            description: item.description,
            totalInvestment: String(item.totalInvestment),
            pricingStatus: item.pricingStatus,
            selected: item.selected,
          })));
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
          setInternalCost(commercialResponse.internalCost == null ? "" : String(commercialResponse.internalCost));
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
          setCustomItems(
            commercialResponse.lineItems
              .filter((item) => item.kind === "CUSTOM" || item.supplierId === null)
              .map((item) => ({
                id: item.id,
                category: item.category,
                description: item.description,
                supplierId: item.supplierId ?? "",
                quantity: String(item.quantity),
                unit: item.unit,
                unitPrice: String(item.unitPrice),
                pricingStatus: item.pricingStatus,
                notes: item.notes ?? "",
              })),
          );
          setLogisticsDrafts(
            commercialResponse.logisticsItems.map((item) => ({
              id: item.id,
              supplierId: item.supplierId ?? "",
              label: item.label,
              treatment: item.treatment,
              quantity: String(item.quantity),
              unit: item.unit,
              unitPrice: String(item.unitPrice),
              pricingStatus: item.pricingStatus,
              notes: item.notes ?? "",
            })),
          );
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os dados comerciais."))
      .finally(() => setLoading(false));
  }, [accessToken, proposalId]);

  const visibleSuppliers = useMemo(
    () => suppliers.filter((supplier) => scope === "FULL_EVENT" || DECORATION_ONLY_CATEGORIES.has(supplier.category)),
    [scope, suppliers],
  );

  const selectedSupplierOptions = useMemo(
    () => visibleSuppliers.filter((supplier) => supplierDrafts[supplier.id]?.selected),
    [supplierDrafts, visibleSuppliers],
  );

  const customCategoryOptions = useMemo<CommercialSupplierCategory[]>(
    () => (scope === "DECORATION_ONLY"
      ? ["DECOR", "FURNITURE_RENTAL", "LIGHTING", "ASSEMBLY_CREW", "OTHER"]
      : ["DECOR", "CATERING", "FURNITURE_RENTAL", "PHOTOGRAPHY", "LIGHTING", "MUSIC", "ASSEMBLY_CREW", "OTHER"]),
    [scope],
  );

  const groupedSuppliers = useMemo(() => {
    const groups = new Map<string, Supplier[]>();
    visibleSuppliers.forEach((supplier) => {
      const current = groups.get(supplier.category) ?? [];
      current.push(supplier);
      groups.set(supplier.category, current);
    });
    return [...groups.entries()].sort(
      ([categoryA], [categoryB]) => CATEGORY_ORDER.indexOf(categoryA) - CATEGORY_ORDER.indexOf(categoryB),
    );
  }, [visibleSuppliers]);

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

  function addCustomItem() {
    setCustomItems((current) => [
      ...current,
      {
        category: customCategoryOptions[0] ?? "DECOR",
        description: "",
        supplierId: "",
        quantity: "1",
        unit: "unidade",
        unitPrice: "",
        pricingStatus: "QUOTE_PENDING",
        notes: "",
      },
    ]);
  }

  function updateCustomItem(index: number, patch: Partial<CustomItemDraft>) {
    setCustomItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function removeCustomItem(index: number) {
    setCustomItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addLogisticsItem() {
    setLogisticsDrafts((current) => [
      ...current,
      {
        supplierId: "",
        label: "",
        treatment: "ADDITIONAL",
        quantity: "1",
        unit: "serviço",
        unitPrice: "",
        pricingStatus: "QUOTE_PENDING",
        notes: "",
      },
    ]);
  }

  function updateLogisticsItem(index: number, patch: Partial<LogisticsDraft>) {
    setLogisticsDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function removeLogisticsItem(index: number) {
    setLogisticsDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleAddQuote() {
    if (!proposalId || !quoteTitle.trim() || quoteAmount === "") {
      setError("Informe título e valor da cotação antes de salvar.");
      return;
    }
    try {
      const quote = await apiClient.post<CommercialQuote>(
        `/creative/proposals/${proposalId}/commercial/quotes`,
        {
          supplierId: quoteSupplierId || null,
          category: quoteCategory,
          title: quoteTitle.trim(),
          amount: Number(quoteAmount),
          source: quoteSource || null,
          status: quoteStatus,
        },
        accessToken,
      );
      setQuotes((current) => [quote, ...current]);
      setQuoteTitle("");
      setQuoteAmount("");
      setQuoteSource("");
      setSuccess("Cotação registrada no histórico comercial.");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos registrar a cotação.");
    }
  }

  async function handleQuoteStatus(quote: CommercialQuote, status: CommercialQuoteStatus) {
    if (!proposalId) return;
    try {
      const updated = await apiClient.patch<CommercialQuote>(
        `/creative/proposals/${proposalId}/commercial/quotes/${quote.id}/status`,
        { status },
        accessToken,
      );
      setQuotes((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos atualizar a cotação.");
    }
  }

  async function handleAddPayment() {
    if (!proposalId || !paymentLabel.trim() || paymentAmount === "" || !paymentDueDate) {
      setError("Informe descrição, valor e vencimento da parcela antes de salvar.");
      return;
    }
    try {
      const payment = await apiClient.post<CommercialPayment>(
        `/creative/proposals/${proposalId}/commercial/payments`,
        {
          label: paymentLabel.trim(),
          amount: Number(paymentAmount),
          dueDate: new Date(`${paymentDueDate}T12:00:00`).toISOString(),
          status: paymentStatus,
        },
        accessToken,
      );
      setCommercialProposal((current) => current ? { ...current, payments: [...current.payments, payment].sort((a, b) => a.dueDate.localeCompare(b.dueDate)) } : current);
      setPaymentLabel("");
      setPaymentAmount("");
      setPaymentDueDate("");
      setSuccess("Parcela registrada na agenda financeira.");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos registrar a parcela.");
    }
  }

  async function handlePaymentStatus(payment: CommercialPayment, status: CommercialPaymentStatus) {
    if (!proposalId) return;
    try {
      const updated = await apiClient.patch<CommercialPayment>(
        `/creative/proposals/${proposalId}/commercial/payments/${payment.id}`,
        { status },
        accessToken,
      );
      setCommercialProposal((current) => current ? { ...current, payments: current.payments.map((item) => item.id === updated.id ? updated : item) } : current);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos atualizar a parcela.");
    }
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
      const supplierSelections = visibleSuppliers
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
      const lineItems = customItems
        .filter((item) => item.description.trim())
        .map((item) => ({
          id: item.id,
          kind: "CUSTOM" as const,
          category: item.category,
          description: item.description.trim(),
          supplierId: item.supplierId || null,
          quantity: Number(item.quantity || 1),
          unit: item.unit || "unidade",
          unitPrice: Number(item.unitPrice || 0),
          pricingStatus: item.pricingStatus,
          included: true,
          notes: item.notes || null,
        }));
      const logisticsItems = logisticsDrafts
        .filter((item) => item.label.trim())
        .map((item) => ({
          id: item.id,
          supplierId: item.supplierId || null,
          label: item.label.trim(),
          treatment: item.treatment,
          quantity: Number(item.quantity || 1),
          unit: item.unit || "serviço",
          unitPrice: Number(item.unitPrice || 0),
          pricingStatus: item.pricingStatus,
          notes: item.notes || null,
        }));
      const saved = await apiClient.post<CommercialProposal>(
        `/creative/proposals/${proposalId}/commercial`,
        {
          scope,
          venueResearchId: venueResearchId || null,
          supplierSelections,
          lineItems,
          logisticsItems,
          contingencyPercent: Number(contingencyPercent || 0),
          managementFee: Number(managementFee || 0),
          discount: Number(discount || 0),
          internalCost: internalCost === "" ? null : Number(internalCost),
          packages: packages.filter((item) => item.name.trim()).map((item) => ({
            id: item.id,
            tier: item.tier,
            name: item.name.trim(),
            description: item.description.trim(),
            totalInvestment: Number(item.totalInvestment || 0),
            pricingStatus: item.pricingStatus,
            selected: item.selected,
          })),
          validityDays: Number(validityDays || 10),
          commercialNotes: commercialNotes || null,
        },
        accessToken,
      );
      setCommercialProposal(saved);
      setScope(saved.scope);
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

  async function handleCreateShare() {
    if (!proposalId) return;
    setSharing(true);
    setError(null);
    try {
      const response = await apiClient.post<{ url: string; expiresAt: string; version: number }>(
        `/creative/proposals/${proposalId}/commercial/share`,
        { expiresInDays: Number(validityDays || 10) },
        accessToken,
      );
      setShareUrl(response.url);
      setSuccess(`Link de aprovação criado para a versão ${response.version}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos gerar o link de aprovação.");
    } finally {
      setSharing(false);
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
        <h2>1. Tipo de orçamento</h2>
        <label style={{ display: "block", color: colors.textMuted, fontSize: 13 }}>
          Modalidade comercial
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as CommercialProposalScope)}
            style={{ display: "block", width: "100%", marginTop: 6, padding: 10, borderRadius: 8, border: `1px solid ${colors.border}` }}
          >
            <option value="FULL_EVENT">Evento completo</option>
            <option value="DECORATION_ONLY">Somente decoração</option>
          </select>
        </label>
        <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 0 }}>
          {scope === "DECORATION_ONLY"
            ? "Inclui flores e folhagens, móveis e locações, iluminação decorativa, objetos, tecidos, mesa posta, estruturas decorativas e montagem/desmontagem. Não inclui buffet, foto/filme, DJ ou sonorização técnica."
            : "Inclui a composição completa do evento, com espaço, buffet, decoração, foto/filme, música, iluminação, estrutura e demais categorias selecionadas."}
        </p>
      </section>

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>2. Espaço de evento</h2>
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
        <h2>3. Fornecedores e escopo</h2>
        <p style={{ color: colors.textMuted, fontSize: 13 }}>
          {scope === "DECORATION_ONLY"
            ? "Selecione fornecedores de flores, móveis, iluminação decorativa, itens complementares e montagem. O valor inicial usa `estimatedCost` apenas quando ele existir."
            : "Marque os fornecedores que entram na composição. O valor inicial usa `estimatedCost` apenas quando ele existir; caso contrário, fica como cotação pendente."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {groupedSuppliers.map(([category, categorySuppliers]) => (
            <div key={category}>
                              <h3 style={{ marginBottom: spacing.xs }}>
                  {scope === "DECORATION_ONLY" && category === "LIGHTING"
                    ? "Iluminação decorativa"
                    : CATEGORY_LABELS[category] ?? category}
                </h3>

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
        <h2>4. Itens personalizados</h2>
        <p style={{ color: colors.textMuted, fontSize: 13 }}>
          Adicione flores, velas, tapetes, tecidos, painéis, mesa posta, transporte de peças ou qualquer item que precise aparecer separadamente no orçamento.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {customItems.map((item, index) => (
            <div key={item.id ?? `custom-${index}`} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: spacing.sm }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0, 1fr) 160px", gap: 8 }}>
                <select value={item.category} onChange={(event) => updateCustomItem(index, { category: event.target.value as CommercialSupplierCategory })} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                  {customCategoryOptions.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category] ?? category}</option>)}
                </select>
                <input value={item.description} onChange={(event) => updateCustomItem(index, { description: event.target.value })} placeholder="Descrição do item" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <select value={item.supplierId} onChange={(event) => updateCustomItem(index, { supplierId: event.target.value })} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                  <option value="">Sem fornecedor específico</option>
                  {selectedSupplierOptions.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 120px 150px 170px minmax(0, 1fr) auto", gap: 8, marginTop: 8 }}>
                <input value={item.quantity} onChange={(event) => updateCustomItem(index, { quantity: event.target.value })} placeholder="Qtd." inputMode="decimal" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <input value={item.unit} onChange={(event) => updateCustomItem(index, { unit: event.target.value })} placeholder="Unidade" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <input value={item.unitPrice} onChange={(event) => updateCustomItem(index, { unitPrice: event.target.value })} placeholder="Valor unitário" inputMode="decimal" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <select value={item.pricingStatus} onChange={(event) => updateCustomItem(index, { pricingStatus: event.target.value as CommercialPricingStatus })} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                  <option value="ESTIMATE">Estimativa</option>
                  <option value="QUOTE_PENDING">Cotação pendente</option>
                  <option value="CONFIRMED">Confirmado</option>
                </select>
                <input value={item.notes} onChange={(event) => updateCustomItem(index, { notes: event.target.value })} placeholder="Observação" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <Button variant="ghost" onClick={() => removeCustomItem(index)}>Remover</Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={addCustomItem} style={{ marginTop: spacing.sm }}>Adicionar item personalizado</Button>
      </section>

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>5. Logística e deslocamento</h2>
        <p style={{ color: colors.textMuted, fontSize: 13 }}>
          Registre custos por fornecedor e espaço. Se o fornecedor informar que o transporte ou a montagem já estão incluídos, use “Incluído” para evitar cobrança duplicada.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {logisticsDrafts.map((item, index) => (
            <div key={item.id ?? `logistics-${index}`} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: spacing.sm }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 180px 170px", gap: 8 }}>
                <input value={item.label} onChange={(event) => updateLogisticsItem(index, { label: event.target.value })} placeholder="Deslocamento, transporte de peças, pedágio, montagem..." style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <select value={item.supplierId} onChange={(event) => updateLogisticsItem(index, { supplierId: event.target.value })} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                  <option value="">Logística geral do evento</option>
                  {selectedSupplierOptions.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                </select>
                <select value={item.treatment} onChange={(event) => updateLogisticsItem(index, { treatment: event.target.value as CommercialLogisticsTreatment })} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                  <option value="ADDITIONAL">Cobrado à parte</option>
                  <option value="INCLUDED">Já incluído</option>
                  <option value="NOT_APPLICABLE">Não se aplica</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 120px 150px 170px minmax(0, 1fr) auto", gap: 8, marginTop: 8 }}>
                <input value={item.quantity} onChange={(event) => updateLogisticsItem(index, { quantity: event.target.value })} placeholder="Qtd." inputMode="decimal" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <input value={item.unit} onChange={(event) => updateLogisticsItem(index, { unit: event.target.value })} placeholder="Unidade" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <input value={item.unitPrice} onChange={(event) => updateLogisticsItem(index, { unitPrice: event.target.value })} placeholder="Valor" inputMode="decimal" disabled={item.treatment !== "ADDITIONAL"} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}`, opacity: item.treatment === "ADDITIONAL" ? 1 : 0.55 }} />
                <select value={item.pricingStatus} onChange={(event) => updateLogisticsItem(index, { pricingStatus: event.target.value as CommercialPricingStatus })} disabled={item.treatment !== "ADDITIONAL"} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}`, opacity: item.treatment === "ADDITIONAL" ? 1 : 0.55 }}>
                  <option value="ESTIMATE">Estimativa</option>
                  <option value="QUOTE_PENDING">Cotação pendente</option>
                  <option value="CONFIRMED">Confirmado</option>
                </select>
                <input value={item.notes} onChange={(event) => updateLogisticsItem(index, { notes: event.target.value })} placeholder="Observação e regra do espaço" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
                <Button variant="ghost" onClick={() => removeLogisticsItem(index)}>Remover</Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={addLogisticsItem} style={{ marginTop: spacing.sm }}>Adicionar custo de logística</Button>
      </section>

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>6. Cotações e comparação</h2>
        <p style={{ color: colors.textMuted, fontSize: 13 }}>
          Registre cotações recebidas por WhatsApp, e-mail ou outro canal. O EVE OS preserva as alternativas e permite marcar a escolhida sem apagar as demais.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 170px 170px 150px", gap: 8 }}>
          <input value={quoteTitle} onChange={(event) => setQuoteTitle(event.target.value)} placeholder="Título da cotação" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
          <select value={quoteCategory} onChange={(event) => setQuoteCategory(event.target.value as CommercialSupplierCategory)} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
            {customCategoryOptions.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category] ?? category}</option>)}
          </select>
          <select value={quoteSupplierId} onChange={(event) => setQuoteSupplierId(event.target.value)} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
            <option value="">Fornecedor não vinculado</option>
            {visibleSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
          <input value={quoteAmount} onChange={(event) => setQuoteAmount(event.target.value)} placeholder="Valor" inputMode="decimal" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 180px auto", gap: 8, marginTop: 8 }}>
          <input value={quoteSource} onChange={(event) => setQuoteSource(event.target.value)} placeholder="Fonte: WhatsApp, e-mail, proposta PDF..." style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
          <select value={quoteStatus} onChange={(event) => setQuoteStatus(event.target.value as CommercialQuoteStatus)} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
            <option value="DRAFT">Rascunho</option>
            <option value="RECEIVED">Recebida</option>
            <option value="SELECTED">Selecionada</option>
            <option value="REJECTED">Rejeitada</option>
            <option value="EXPIRED">Expirada</option>
          </select>
          <Button variant="ghost" onClick={handleAddQuote}>Registrar cotação</Button>
        </div>
        {quotes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: spacing.sm }}>
            {quotes.map((quote) => (
              <div key={quote.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 120px 150px 150px", gap: 8, alignItems: "center", borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                <span><strong>{quote.title}</strong><br /><small style={{ color: colors.textMuted }}>{CATEGORY_LABELS[quote.category] ?? quote.category}{quote.supplierName ? ` · ${quote.supplierName}` : ""}{quote.source ? ` · ${quote.source}` : ""}</small></span>
                <strong>{formatMoney(quote.amount)}</strong>
                <span style={{ color: colors.textMuted, fontSize: 12 }}>{quote.status}</span>
                <select value={quote.status} onChange={(event) => handleQuoteStatus(quote, event.target.value as CommercialQuoteStatus)} style={{ padding: 7, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                  <option value="DRAFT">Rascunho</option>
                  <option value="RECEIVED">Recebida</option>
                  <option value="SELECTED">Selecionada</option>
                  <option value="REJECTED">Rejeitada</option>
                  <option value="EXPIRED">Expirada</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>7. Ajustes comerciais</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: spacing.sm }}>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Contingência (%)<input value={contingencyPercent} onChange={(event) => setContingencyPercent(event.target.value)} inputMode="decimal" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Taxa de gestão<input value={managementFee} onChange={(event) => setManagementFee(event.target.value)} inputMode="decimal" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Desconto<input value={discount} onChange={(event) => setDiscount(event.target.value)} inputMode="decimal" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Custo interno<input value={internalCost} onChange={(event) => setInternalCost(event.target.value)} placeholder="Opcional" inputMode="decimal" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
          <label style={{ color: colors.textMuted, fontSize: 13 }}>Validade (dias)<input value={validityDays} onChange={(event) => setValidityDays(event.target.value)} inputMode="numeric" style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
        </div>
        <label style={{ display: "block", color: colors.textMuted, fontSize: 13, marginTop: spacing.sm }}>Observações comerciais<textarea value={commercialNotes} onChange={(event) => setCommercialNotes(event.target.value)} rows={3} style={{ display: "block", width: "100%", marginTop: 5, padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} /></label>
      </section>

      <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
        <h2>8. Pacotes comerciais</h2>
        <p style={{ color: colors.textMuted, fontSize: 13 }}>
          Apresente alternativas ao casal sem apagar a composição principal. Informe apenas valores realmente cotados ou marque a opção como estimativa ou cotação pendente.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: spacing.sm }}>
          {packages.map((pkg, index) => (
            <div key={pkg.tier} style={{ border: `1px solid ${pkg.selected ? colors.primary : colors.border}`, borderRadius: 10, padding: spacing.sm, background: pkg.selected ? "#FFF9F0" : "#FFFFFF" }}>
              <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13, color: colors.textMuted }}>
                <input type="checkbox" checked={pkg.selected} onChange={(event) => setPackages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: event.target.checked } : item))} /> Pacote recomendado
              </label>
              <input value={pkg.name} onChange={(event) => setPackages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} style={{ width: "100%", marginTop: 7, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}`, fontWeight: 600 }} />
              <textarea value={pkg.description} onChange={(event) => setPackages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} rows={3} style={{ width: "100%", marginTop: 7, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }} />
              <input value={pkg.totalInvestment} onChange={(event) => setPackages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, totalInvestment: event.target.value } : item))} placeholder="Valor do pacote" inputMode="decimal" style={{ width: "100%", marginTop: 7, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }} />
              <select value={pkg.pricingStatus} onChange={(event) => setPackages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, pricingStatus: event.target.value as CommercialPricingStatus } : item))} style={{ width: "100%", marginTop: 7, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                <option value="ESTIMATE">Estimativa</option>
                <option value="QUOTE_PENDING">Cotação pendente</option>
                <option value="CONFIRMED">Confirmado</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md }}>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar composição comercial"}</Button>
        <Button variant="ghost" onClick={handleDownload} disabled={!commercialProposal || downloading}>{downloading ? "Gerando PDF..." : "Baixar PDF comercial"}</Button>
        <Button variant="ghost" onClick={handleCreateShare} disabled={!commercialProposal || sharing || !["READY", "SENT"].includes(commercialProposal?.status ?? "")}>{sharing ? "Gerando link..." : "Gerar link para o casal"}</Button>
      </div>
      {shareUrl && (
        <div style={{ padding: spacing.sm, borderRadius: 8, background: "#F8F3EC", marginTop: spacing.sm }}>
          <strong>Link de aprovação</strong>
          <input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} style={{ display: "block", width: "100%", marginTop: 6, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }} />
          <small style={{ color: colors.textMuted }}>Envie este link por um canal seguro. Ele expira conforme a validade da proposta e pode ser revogado ao gerar outro.</small>
        </div>
      )}

      {commercialProposal && (
        <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
          <h2>9. Agenda financeira</h2>
          <p style={{ color: colors.textMuted, fontSize: 13 }}>
            Registre parcelas previstas e marque os recebimentos. Esta agenda não substitui contrato ou conciliação bancária, mas preserva a situação comercial da proposta.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 150px 170px 160px auto", gap: 8 }}>
            <input value={paymentLabel} onChange={(event) => setPaymentLabel(event.target.value)} placeholder="Sinal, parcela de produção..." style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
            <input value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="Valor" inputMode="decimal" style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
            <input type="date" value={paymentDueDate} onChange={(event) => setPaymentDueDate(event.target.value)} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }} />
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as CommercialPaymentStatus)} style={{ padding: 9, borderRadius: 6, border: `1px solid ${colors.border}` }}>
              <option value="PENDING">Pendente</option>
              <option value="SCHEDULED">Agendado</option>
              <option value="PAID">Pago</option>
              <option value="OVERDUE">Vencido</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <Button variant="ghost" onClick={handleAddPayment}>Adicionar parcela</Button>
          </div>
          {commercialProposal.payments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: spacing.sm }}>
              {commercialProposal.payments.map((payment) => (
                <div key={payment.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 130px 130px 160px", gap: 8, alignItems: "center", borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                  <span><strong>{payment.label}</strong><br /><small style={{ color: colors.textMuted }}>{new Date(payment.dueDate).toLocaleDateString("pt-BR")}</small></span>
                  <strong>{formatMoney(payment.amount)}</strong>
                  <span style={{ color: colors.textMuted, fontSize: 12 }}>{payment.status}</span>
                  <select value={payment.status} onChange={(event) => handlePaymentStatus(payment, event.target.value as CommercialPaymentStatus)} style={{ padding: 7, borderRadius: 6, border: `1px solid ${colors.border}` }}>
                    <option value="PENDING">Pendente</option>
                    <option value="SCHEDULED">Agendado</option>
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Vencido</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {commercialProposal && (
        <section style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: spacing.md, marginTop: spacing.md }}>
          <h2>10. Revisão e aprovação</h2>
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
          <h2>Resumo salvo · {SCOPE_LABELS[commercialProposal.scope]} · versão {commercialProposal.version}</h2>
          <p style={{ color: colors.textMuted }}>Status: <strong>{commercialProposal.status}</strong>{commercialProposal.hasUnconfirmedData ? " · contém dados a confirmar" : " · dados confirmados"}</p>
          <p style={{ fontSize: 24, fontWeight: 700 }}>{formatMoney(commercialProposal.totalInvestment)}</p>
          {commercialProposal.internalCost != null && (
            <p style={{ color: colors.textMuted, fontSize: 13 }}>
              Custo interno: <strong>{formatMoney(commercialProposal.internalCost)}</strong> · Margem: <strong>{formatMoney(commercialProposal.marginAmount ?? 0)}{commercialProposal.marginPercent != null ? ` (${commercialProposal.marginPercent.toFixed(2)}%)` : ""}</strong>
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {commercialProposal.lineItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: spacing.sm, fontSize: 13 }}>
                <span>{item.description}</span><strong>{formatMoney(item.total)}</strong>
              </div>
            ))}
          </div>
          {commercialProposal.logisticsItems.length > 0 && (
            <div style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTop: `1px solid ${colors.border}` }}>
              <p style={{ color: colors.textMuted, margin: 0, fontSize: 12, textTransform: "uppercase" }}>Logística e deslocamento</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
                {commercialProposal.logisticsItems.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: spacing.sm, fontSize: 13 }}>
                    <span>{item.label}{item.supplierName ? ` · ${item.supplierName}` : ""}</span><strong>{item.treatment === "ADDITIONAL" ? formatMoney(item.total) : "Incluído"}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
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
