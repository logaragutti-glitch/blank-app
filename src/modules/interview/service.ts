import { withTenant } from "@/lib/tenant";
import { NotFoundError } from "@/lib/api";
import {
  estimateProgress,
  findQuestionByKey,
  getNextRuleQuestion,
  ruleQuestionSequence,
  type InterviewAnswers,
  type QuestionDef,
} from "./questions";
import { InvalidAnswerError, parseAnswerValue } from "./schema";
import { getAiClarifyingQuestion } from "./ai";

const AI_CLARIFY_KEY = "ai_clarify";

function toAnswersMap(answers: { questionKey: string; answerValue: unknown }[]): InterviewAnswers {
  const map: InterviewAnswers = {};
  for (const answer of answers) {
    map[answer.questionKey] = answer.answerValue as string | number;
  }
  return map;
}

export interface InterviewState {
  session: { id: string; status: "IN_PROGRESS" | "COMPLETED" };
  answers: { questionKey: string; questionText: string; answerValue: string | number }[];
  nextQuestion: QuestionDef | null;
  progress: number;
  readyToComplete: boolean;
}

async function loadState(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  eventId: string,
): Promise<InterviewState> {
  const session = await tx.interviewSession.findUniqueOrThrow({
    where: { eventId },
    include: { answers: { orderBy: { order: "asc" } } },
  });

  const answersMap = toAnswersMap(session.answers);
  const nextRule = getNextRuleQuestion(answersMap);

  let nextQuestion: QuestionDef | null = nextRule;
  if (!nextRule) {
    const alreadyAnsweredAiQuestion = session.answers.some((a) => a.questionKey === AI_CLARIFY_KEY);
    if (!alreadyAnsweredAiQuestion && session.aiClarifyAttempted && session.aiClarifyQuestion) {
      nextQuestion = {
        key: AI_CLARIFY_KEY,
        text: session.aiClarifyQuestion,
        type: "text",
        optional: true,
      };
    }
  }

  return {
    session: { id: session.id, status: session.status },
    answers: session.answers.map((a) => ({
      questionKey: a.questionKey,
      questionText: a.questionText,
      answerValue: a.answerValue as string | number,
    })),
    nextQuestion,
    progress: estimateProgress(answersMap),
    readyToComplete: !nextQuestion,
  };
}

export async function getInterviewState(organizationId: string, eventId: string) {
  return withTenant(organizationId, async (tx) => {
    const event = await tx.event.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundError("Evento não encontrado");
    return loadState(tx, eventId);
  });
}

export async function getOrCreateSession(organizationId: string, eventId: string) {
  return withTenant(organizationId, async (tx) => {
    const event = await tx.event.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundError("Evento não encontrado");

    const session = await tx.interviewSession.upsert({
      where: { eventId },
      update: {},
      create: { eventId },
    });

    if (event.status === "DRAFT") {
      await tx.event.update({ where: { id: eventId }, data: { status: "INTERVIEW" } });
    }

    return loadState(tx, eventId);
  });
}

export async function submitAnswer(
  organizationId: string,
  eventId: string,
  questionKey: string,
  rawValue: string,
) {
  return withTenant(organizationId, async (tx) => {
    const session = await tx.interviewSession.findUniqueOrThrow({
      where: { eventId },
      include: { answers: { orderBy: { order: "asc" } } },
    });

    const answersMap = toAnswersMap(session.answers);

    const question: QuestionDef | undefined =
      questionKey === AI_CLARIFY_KEY
        ? { key: AI_CLARIFY_KEY, text: session.aiClarifyQuestion ?? "", type: "text", optional: true }
        : findQuestionByKey(answersMap, questionKey);

    if (!question) throw new InvalidAnswerError("Pergunta desconhecida");

    const value = parseAnswerValue(question, rawValue);
    const existing = session.answers.find((a) => a.questionKey === questionKey);

    if (existing) {
      // Editar uma resposta anterior só invalida o que de fato dependia dela —
      // trocar o tipo do evento descarta as perguntas do ramo antigo (ex.:
      // `ceremony_style`), mas mantém respostas independentes como `location`
      // ou `guest_count`. Ver docs/USER_FLOWS.md Fluxo 2 ("invalida perguntas
      // subsequentes que dependiam dela", não a entrevista inteira).
      const provisionalMap = { ...answersMap, [questionKey]: value };
      const validKeys = new Set(ruleQuestionSequence(provisionalMap).map((q) => q.key));
      const staleAnswerIds = session.answers
        .filter((a) => a.questionKey !== questionKey && !validKeys.has(a.questionKey))
        .map((a) => a.id);

      if (staleAnswerIds.length > 0) {
        await tx.interviewAnswer.deleteMany({ where: { id: { in: staleAnswerIds } } });
      }
      await tx.interviewAnswer.update({
        where: { id: existing.id },
        data: { answerValue: value, questionText: question.text },
      });
      // A pergunta de esclarecimento da IA (se houver) sempre é descartada numa
      // edição: as respostas mudaram, então a IA merece uma nova chance.
      await tx.interviewSession.update({
        where: { id: session.id },
        data: { aiClarifyAttempted: false, aiClarifyQuestion: null },
      });
    } else {
      const maxOrder = session.answers.reduce((max, a) => Math.max(max, a.order), -1);
      await tx.interviewAnswer.create({
        data: {
          interviewSessionId: session.id,
          questionKey,
          questionText: question.text,
          answerValue: value,
          order: maxOrder + 1,
        },
      });
    }

    // Se essa resposta esgotou a árvore de regras, é o momento de dar à IA a
    // chance de propor UMA pergunta de esclarecimento (ver ai.ts).
    const refreshedAnswers = await tx.interviewAnswer.findMany({
      where: { interviewSessionId: session.id },
      orderBy: { order: "asc" },
    });
    const refreshedMap = toAnswersMap(refreshedAnswers);
    const stillHasRuleQuestion = getNextRuleQuestion(refreshedMap) !== null;
    const needsAiAttempt =
      !stillHasRuleQuestion &&
      questionKey !== AI_CLARIFY_KEY &&
      !refreshedAnswers.some((a) => a.questionKey === AI_CLARIFY_KEY);

    if (needsAiAttempt) {
      const clarifyQuestion = await getAiClarifyingQuestion(organizationId, refreshedMap);
      await tx.interviewSession.update({
        where: { id: session.id },
        data: { aiClarifyAttempted: true, aiClarifyQuestion: clarifyQuestion },
      });
    }

    return loadState(tx, eventId);
  });
}

export async function completeInterview(organizationId: string, eventId: string, userId: string) {
  return withTenant(organizationId, async (tx) => {
    const state = await loadState(tx, eventId);
    if (!state.readyToComplete) {
      throw new InvalidAnswerError("Ainda há perguntas pendentes");
    }

    await tx.interviewSession.update({
      where: { id: state.session.id },
      data: { status: "COMPLETED" },
    });

    // A entrevista preenche os campos estruturados do evento (docs/WIREFRAMES.md
    // "A Entrevista Inteligente preenche o restante do DNA do Evento") — sem isso
    // a aba Visão Geral ficaria com "—" mesmo depois de responder tudo.
    const answersMap = toAnswersMap(state.answers);
    const eventDate =
      typeof answersMap.event_date === "string" && answersMap.event_date
        ? new Date(answersMap.event_date)
        : undefined;

    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: {
        status: "GENERATING",
        type: typeof answersMap.event_type === "string" ? answersMap.event_type : undefined,
        location: typeof answersMap.location === "string" ? answersMap.location : undefined,
        guestCount:
          typeof answersMap.guest_count === "number" ? Math.round(answersMap.guest_count) : undefined,
        targetBudget: typeof answersMap.target_budget === "number" ? answersMap.target_budget : undefined,
        eventDate: eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate : undefined,
      },
    });

    await tx.activity.create({
      data: {
        organizationId,
        eventId,
        userId,
        action: "interview.completed",
        metadata: { eventName: updatedEvent.name },
      },
    });

    return loadState(tx, eventId);
  });
}
