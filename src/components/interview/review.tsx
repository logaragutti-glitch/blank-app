import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeInterviewAction } from "@/modules/interview/actions";

export function InterviewReview({
  eventId,
  answers,
}: {
  eventId: string;
  answers: { questionKey: string; questionText: string; answerValue: string | number }[];
}) {
  const boundComplete = completeInterviewAction.bind(null, eventId);
  const answered = answers.filter((a) => a.answerValue !== "");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revisão da entrevista</h1>
        <p className="text-sm text-muted-foreground">
          Confira as respostas antes de gerar o projeto. Você pode editar qualquer uma.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col divide-y divide-border pt-5">
          {answered.map((answer) => (
            <div key={answer.questionKey} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{answer.questionText}</span>
                <span className="font-medium">{answer.answerValue}</span>
              </div>
              <Link
                href={`/events/${eventId}/interview?edit=${answer.questionKey}`}
                className="shrink-0 text-sm text-accent hover:underline"
              >
                Editar
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>

      <form action={boundComplete}>
        <Button type="submit" className="w-full">
          Gerar projeto
        </Button>
      </form>
    </div>
  );
}
