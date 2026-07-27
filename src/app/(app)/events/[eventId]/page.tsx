import { notFound } from "next/navigation";

import { requireActiveSession } from "@/lib/session";
import { getEvent } from "@/modules/events/service";
import { NotFoundError } from "@/lib/api";
import { EVENT_STATUS_BADGE, EVENT_STATUS_LABEL } from "@/modules/events/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function EventDetailPage({ params }: { params: { eventId: string } }) {
  const { organization } = await requireActiveSession();

  const event = await getEvent(organization.id, params.eventId).catch((error) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });

  if (!event) notFound();

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
          <TabsTrigger value="dna">DNA</TabsTrigger>
          <TabsTrigger value="journey">Jornada</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="budget">Financeiro</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
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
            <Card>
              <CardContent className="pt-5 text-sm text-muted-foreground">
                A Entrevista Inteligente (Sprint 3) preenche o restante do DNA do Evento a
                partir daqui.
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dna">
          <EmptyDocTab label="DNA do Evento™" sprint="Sprint 4" />
        </TabsContent>
        <TabsContent value="journey">
          <EmptyDocTab label="Jornada Memorável™" sprint="Sprint 4" />
        </TabsContent>
        <TabsContent value="timeline">
          {event.timelineItems.length === 0 ? (
            <EmptyDocTab label="Linha do Tempo MEM™" sprint="Sprint 4" />
          ) : (
            <ul className="flex flex-col gap-2">
              {event.timelineItems.map((item) => (
                <li key={item.id} className="text-sm">
                  {item.title}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="checklist">
          {event.checklistItems.length === 0 ? (
            <EmptyDocTab label="Checklist" sprint="Sprint 4" />
          ) : (
            <ul className="flex flex-col gap-2">
              {event.checklistItems.map((item) => (
                <li key={item.id} className="text-sm">
                  {item.title}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="budget">
          {event.budgetLines.length === 0 ? (
            <EmptyDocTab label="Plano Financeiro" sprint="Sprint 4" />
          ) : (
            <ul className="flex flex-col gap-2">
              {event.budgetLines.map((line) => (
                <li key={line.id} className="text-sm">
                  {line.description} — R$ {line.amount.toString()}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="summary">
          <EmptyDocTab label="Resumo Executivo" sprint="Sprint 4" />
        </TabsContent>
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

function EmptyDocTab({ label, sprint }: { label: string; sprint: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {label} é gerado pela IA a partir da Entrevista Inteligente — ver docs/ROADMAP.md (
        {sprint}).
      </CardContent>
    </Card>
  );
}
