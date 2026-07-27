import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireActiveSession } from "@/lib/session";
import { NotFoundError } from "@/lib/api";
import { getOrCreateSession } from "@/modules/interview/service";
import { findQuestionByKey, type InterviewAnswers, type QuestionDef } from "@/modules/interview/questions";
import { Progress } from "@/components/ui/progress";
import { QuestionForm } from "@/components/interview/question-form";
import { InterviewReview } from "@/components/interview/review";

export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { organization } = await requireActiveSession();
  const { eventId } = await params;
  const { edit } = await searchParams;

  const state = await getOrCreateSession(organization.id, eventId).catch((error) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });

  if (!state) notFound();
  if (state.session.status === "COMPLETED") redirect(`/events/${eventId}`);

  const answersMap: InterviewAnswers = Object.fromEntries(
    state.answers.map((a) => [a.questionKey, a.answerValue]),
  );

  const editAnswer = edit ? state.answers.find((a) => a.questionKey === edit) : undefined;

  let question: QuestionDef | undefined;
  let defaultValue: string | undefined;
  const isEditing = Boolean(editAnswer);

  if (editAnswer) {
    question =
      editAnswer.questionKey === "ai_clarify"
        ? { key: "ai_clarify", text: editAnswer.questionText, type: "text", optional: true }
        : findQuestionByKey(answersMap, editAnswer.questionKey);
    defaultValue = String(editAnswer.answerValue);
  } else {
    question = state.nextQuestion ?? undefined;
  }

  if (!question) {
    return <InterviewReview eventId={eventId} answers={state.answers} />;
  }

  const lastAnswer = state.answers[state.answers.length - 1];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 pt-8">
      <Progress value={state.progress} />

      <div>
        <h1 className="text-xl font-semibold">{question.text}</h1>
        {isEditing && (
          <p className="mt-1 text-sm text-muted-foreground">
            Alterar esta resposta pode mudar as próximas perguntas.
          </p>
        )}
      </div>

      <QuestionForm
        eventId={eventId}
        question={question}
        defaultValue={defaultValue}
        isEditing={isEditing}
      />

      {!isEditing && lastAnswer && (
        <Link
          href={`/events/${eventId}/interview?edit=${lastAnswer.questionKey}`}
          className="flex items-center gap-1 self-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          voltar e editar
        </Link>
      )}
      {isEditing && (
        <Link
          href={`/events/${eventId}/interview`}
          className="self-center text-sm text-muted-foreground hover:text-foreground"
        >
          Cancelar edição
        </Link>
      )}
    </div>
  );
}
