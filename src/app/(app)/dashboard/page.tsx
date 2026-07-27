import Link from "next/link";

import { requireActiveSession } from "@/lib/session";
import { getDashboardData } from "@/modules/dashboard/service";
import { describeActivity } from "@/modules/dashboard/labels";
import { EVENT_STATUS_BADGE, EVENT_STATUS_LABEL } from "@/modules/events/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { userName, userEmail, organization } = await requireActiveSession();
  const data = await getDashboardData(organization.id);

  const firstName = ((userName ?? userEmail).split(" ")[0] ?? userEmail).split("@")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo da sua operação.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Eventos ativos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-3xl font-semibold tracking-tight">{data.activeEvents}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>MEM Score médio</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-3xl font-semibold tracking-tight">
              {data.memScoreAverage ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pendências</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-3xl font-semibold tracking-tight">{data.pendingChecklist}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checklist prioritário</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {data.checklistPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pendência — checklists são gerados pela IA a partir da Sprint 4.
              </p>
            ) : (
              data.checklistPreview.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="h-4 w-4 shrink-0 rounded border border-border" />
                  <span>
                    {item.title} — <span className="text-muted-foreground">{item.event.name}</span>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades recentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
            ) : (
              data.recentActivity.map((activity) => (
                <p key={activity.id} className="text-sm text-muted-foreground">
                  {describeActivity(activity)}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos recentes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          {data.recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento ainda —{" "}
              <Link href="/events" className="text-accent hover:underline">
                crie o primeiro
              </Link>
              .
            </p>
          ) : (
            data.recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{event.name}</span>
                <div className="flex items-center gap-3">
                  {event.memScore && (
                    <span className="text-muted-foreground">MEM {event.memScore.score}</span>
                  )}
                  <Badge variant={EVENT_STATUS_BADGE[event.status]}>
                    {EVENT_STATUS_LABEL[event.status]}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
