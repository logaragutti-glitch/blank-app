import Link from "next/link";
import { notFound } from "next/navigation";

import { requireActiveSession } from "@/lib/session";
import { getEvent } from "@/modules/events/service";
import { NotFoundError } from "@/lib/api";
import { EVENT_STATUS_BADGE, EVENT_STATUS_LABEL } from "@/modules/events/labels";
import { estimateProgress, type InterviewAnswers } from "@/modules/interview/questions";
import { pickLatestPerType } from "@/modules/documents/utils";
import { DOCUMENT_REGISTRY } from "@/modules/documents/registry";
import type { GeneratableDocumentType } from "@/modules/documents/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentPanel } from "@/components/documents/document-panel";
import { GenerateDocumentsButton } from "@/components/documents/generate-documents-button";

const TABS: { value: string; label: string; type: GeneratableDocumentType }[] = [
  { value: "dna", label: "DNA", type: "DNA_EVENTO" },
  { value: "emocao", label: "Emoção", type: "MAPA_EMOCAO" },
  { value: "jornada", label: "Jornada", type: "JORNADA_MEMORAVEL" },
  { value: "timeline", label: "Timeline", type: "LINHA_DO_TEMPO" },
  { value: "operacional", label: "Operacional", type: "PLANO_OPERACIONAL" },
  { value: "checklist", label: "Checklist", type: "CHECKLIST" },
  { value: "financeiro", label: "Financeiro", type: "PLANO_FINANCEIRO" },
  { value: "planob", label: "Plano B", type: "PLANO_B" },
  { value: "resumo", label: "Resumo", type: "RESUMO_EXECUTIVO" },
];

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { organization } = await requireActiveSession();
  const { eventId } = await params;

  const event = await getEvent(organization.id, eventId).catch((error) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });

  if (!event) notFound();

  const latestDocuments = pickLatestPerType(event.documents).map((d) => ({
    id: d.id,
    type: d.type as GeneratableDocumentType,
    status: d.status,
    content: d.content,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
          <p className="text-sm text-muted-foreground">
            {event.client?.name ?? "Sem cliente vinculado"}
            {event.eventDate && ` · ${new Date(event.eventDate).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {event.memScore && (
            <span className="text-sm font-medium text-muted-foreground">
              MEM Score: {event.memScore.score}
            </span>
          )}
          <Badge variant={EVENT_STATUS_BADGE[event.status]}>{EVENT_STATUS_LABEL[event.status]}</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col gap-2 pt-5 text-sm">
                <Row label="Tipo" value={event.type ?? "—"} />
                <Row label="Local" value={event.location ?? "—"} />
                <Row label="Convidados" value={event.guestCount?.toString() ?? "—"} />
                <Row
                  label="Orçamento alvo"
                  value={event.targetBudget ? `R$ ${event.targetBudget.toString()}` : "—"}
                />
              </CardContent>
            </Card>
            <InterviewStatusCard
              eventId={event.id}
              interviewSession={event.interviewSession}
              latestDocuments={latestDocuments}
            />
          </div>
        </TabsContent>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <DocumentPanel
              eventId={event.id}
              label={DOCUMENT_REGISTRY.find((d) => d.type === tab.type)?.label ?? tab.label}
              document={latestDocuments.find((d) => d.type === tab.type) ?? null}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface InterviewSessionSummary {
  status: "IN_PROGRESS" | "COMPLETED";
  answers: { questionKey: string; questionText: string; answerValue: unknown }[];
}

interface LatestDocumentSummary {
  type: string;
  status: "PENDING" | "GENERATING" | "READY" | "FAILED";
}

function InterviewStatusCard({
  eventId,
  interviewSession,
  latestDocuments,
}: {
  eventId: string;
  interviewSession: InterviewSessionSummary | null;
  latestDocuments: LatestDocumentSummary[];
}) {
  if (!interviewSession) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-5 text-sm">
          <p className="text-muted-foreground">
            A Entrevista Inteligente monta o DNA do Evento a partir de algumas perguntas.
          </p>
          <Button asChild size="sm">
            <Link href={`/events/${eventId}/interview`}>Iniciar entrevista</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const answersMap: InterviewAnswers = Object.fromEntries(
    interviewSession.answers.map((a) => [a.questionKey, a.answerValue as string | number]),
  );

  if (interviewSession.status === "IN_PROGRESS") {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 text-sm">
          <p className="text-muted-foreground">Entrevista em andamento.</p>
          <Progress value={estimateProgress(answersMap)} />
          <Button asChild size="sm" className="self-start">
            <Link href={`/events/${eventId}/interview`}>Continuar entrevista</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (latestDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 text-sm">
          <p className="font-medium">Entrevista concluída</p>
          {interviewSession.answers
            .filter((a) => a.answerValue !== "")
            .slice(0, 4)
            .map((a) => (
              <div key={a.questionKey} className="flex flex-col">
                <span className="text-muted-foreground">{a.questionText}</span>
                <span className="font-medium">{String(a.answerValue)}</span>
              </div>
            ))}
          <GenerateDocumentsButton eventId={eventId} label="Gerar documentos" />
        </CardContent>
      </Card>
    );
  }

  const readyCount = latestDocuments.filter((d) => d.status === "READY").length;
  const failedCount = latestDocuments.filter((d) => d.status === "FAILED").length;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5 text-sm">
        <p className="font-medium">Documentos MEM</p>
        <p className="text-muted-foreground">
          {readyCount} de {latestDocuments.length} prontos
          {failedCount > 0 && ` · ${failedCount} com falha`}
        </p>
        <GenerateDocumentsButton eventId={eventId} label="Gerar tudo novamente" />
      </CardContent>
    </Card>
  );
}
