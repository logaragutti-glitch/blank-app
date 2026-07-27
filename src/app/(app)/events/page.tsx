import Link from "next/link";
import type { EventStatus } from "@prisma/client";

import { requireActiveSession } from "@/lib/session";
import { listEvents } from "@/modules/events/service";
import { listClients } from "@/modules/clients/service";
import { EVENT_STATUS_BADGE, EVENT_STATUS_LABEL, EVENT_STATUS_ORDER } from "@/modules/events/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NewEventDialog } from "@/components/events/new-event-dialog";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { organization } = await requireActiveSession();
  const { status } = await searchParams;
  const statusFilter = EVENT_STATUS_ORDER.includes(status as EventStatus)
    ? (status as EventStatus)
    : undefined;

  const [events, clients] = await Promise.all([
    listEvents(organization.id, statusFilter),
    listClients(organization.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            {events.length === 0 ? "Nenhum evento por aqui ainda." : `${events.length} evento(s)`}
          </p>
        </div>
        <NewEventDialog clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-2 text-sm">
        <Link
          href="/events"
          className={cn(
            "rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted",
            !statusFilter && "bg-accent/10 font-medium text-accent",
          )}
        >
          Todos
        </Link>
        {EVENT_STATUS_ORDER.map((status) => (
          <Link
            key={status}
            href={`/events?status=${status}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted",
              statusFilter === status && "bg-accent/10 font-medium text-accent",
            )}
          >
            {EVENT_STATUS_LABEL[status]}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Crie o primeiro evento para iniciar a Entrevista Inteligente.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="transition-colors hover:border-accent/40">
                <CardContent className="flex items-center justify-between pt-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{event.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {event.client?.name ?? "Sem cliente vinculado"}
                      {event.eventDate &&
                        ` · ${new Date(event.eventDate).toLocaleDateString("pt-BR")}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {event.memScore && (
                      <span className="text-sm font-medium text-muted-foreground">
                        MEM {event.memScore.score}
                      </span>
                    )}
                    <Badge variant={EVENT_STATUS_BADGE[event.status]}>
                      {EVENT_STATUS_LABEL[event.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
