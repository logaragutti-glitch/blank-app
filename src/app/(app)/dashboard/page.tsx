import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Dados mockados — Sprint 2 substitui por consultas reais a Event/Activity/MemScore.
const METRICS = [
  { label: "Eventos ativos", value: "4" },
  { label: "MEM Score médio", value: "78" },
  { label: "Pendências", value: "9" },
];

const CHECKLIST_PREVIEW = [
  { id: 1, title: "Confirmar fornecedor de som — Casamento Ana & Rui", done: false },
  { id: 2, title: "Enviar resumo executivo — Congresso TechCorp", done: false },
  { id: 3, title: "Revisar orçamento — Aniversário 50 anos", done: true },
];

const RECENT_ACTIVITY = [
  { id: 1, text: "Maria gerou o Plano Financeiro do evento Congresso TechCorp" },
  { id: 2, text: "Novo evento criado: \"Casamento Ana & Rui\"" },
  { id: 3, text: "MEM Score do evento \"Aniversário 50 anos\" subiu para 91" },
];

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "por aqui";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo da sua operação.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {METRICS.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle>{metric.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-3xl font-semibold tracking-tight">{metric.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checklist prioritário</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {CHECKLIST_PREVIEW.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`h-4 w-4 shrink-0 rounded border ${
                    item.done ? "border-accent bg-accent" : "border-border"
                  }`}
                />
                <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {item.title}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades recentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {RECENT_ACTIVITY.map((activity) => (
              <p key={activity.id} className="text-sm text-muted-foreground">
                {activity.text}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MEM Score por evento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          {[
            { name: "Casamento Ana & Rui", score: 82, status: "Revisão" },
            { name: "Congresso TechCorp", score: 40, status: "Em entrevista" },
            { name: "Aniversário 50 anos", score: 91, status: "Pronto" },
          ].map((event) => (
            <div key={event.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{event.name}</span>
                <Badge variant={event.score >= 80 ? "success" : event.score >= 50 ? "accent" : "warning"}>
                  {event.status}
                </Badge>
              </div>
              <Progress value={event.score} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
