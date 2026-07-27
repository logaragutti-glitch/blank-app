import Link from "next/link";

import { requireActiveSession } from "@/lib/session";
import { listEvents } from "@/modules/events/service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function InterviewPage() {
  const { organization } = await requireActiveSession();
  const events = await listEvents(organization.id);

  const pending = events.filter((e) => e.status === "DRAFT" || e.status === "INTERVIEW");
  const done = events.filter((e) => e.status !== "DRAFT" && e.status !== "INTERVIEW");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entrevista Inteligente</h1>
        <p className="text-sm text-muted-foreground">
          Uma pergunta por vez — a IA monta o DNA do evento a partir das respostas.
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum evento aguardando entrevista.{" "}
            <Link href="/events" className="text-accent hover:underline">
              Crie um evento
            </Link>{" "}
            para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center justify-between pt-5">
                <div className="flex flex-col">
                  <span className="font-medium">{event.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {event.status === "DRAFT" ? "Ainda não iniciada" : "Em andamento"}
                  </span>
                </div>
                <Button asChild size="sm">
                  <Link href={`/events/${event.id}/interview`}>
                    {event.status === "DRAFT" ? "Iniciar" : "Continuar"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Já entrevistados</h2>
          {done.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="transition-colors hover:border-accent/40">
                <CardContent className="pt-5">
                  <span className="font-medium">{event.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
