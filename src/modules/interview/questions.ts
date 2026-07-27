export type QuestionType = "select" | "text" | "number" | "date";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDef {
  key: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  optional?: boolean;
  placeholder?: string;
}

export type InterviewAnswers = Record<string, string | number>;

export function toAnswersMap(
  answers: { questionKey: string; answerValue: unknown }[],
): InterviewAnswers {
  const map: InterviewAnswers = {};
  for (const answer of answers) {
    map[answer.questionKey] = answer.answerValue as string | number;
  }
  return map;
}

const BASE_QUESTIONS: QuestionDef[] = [
  {
    key: "event_type",
    text: "Qual é o tipo do evento?",
    type: "select",
    options: [
      { value: "casamento", label: "Casamento" },
      { value: "corporativo", label: "Corporativo" },
      { value: "aniversario", label: "Aniversário" },
      { value: "outro", label: "Outro" },
    ],
  },
  {
    key: "objective",
    text: "Qual é o objetivo principal deste evento?",
    type: "text",
    placeholder: "Ex.: celebrar, gerar negócios, fortalecer cultura da empresa…",
  },
];

const WEDDING_QUESTIONS: QuestionDef[] = [
  {
    key: "ceremony_style",
    text: "A cerimônia será religiosa, civil ou ambas?",
    type: "select",
    options: [
      { value: "religiosa", label: "Religiosa" },
      { value: "civil", label: "Civil" },
      { value: "ambas", label: "Ambas" },
    ],
  },
  {
    key: "traditions",
    text: "Alguma tradição ou momento especial que não pode faltar?",
    type: "text",
    optional: true,
    placeholder: "Ex.: dança de família, ritual específico…",
  },
];

const CORPORATE_QUESTIONS: QuestionDef[] = [
  {
    key: "business_goal",
    text: "Que resultado de negócio esse evento deve gerar?",
    type: "text",
    placeholder: "Ex.: lançar produto, engajar equipe, fechar parcerias…",
  },
  {
    key: "format",
    text: "Qual o formato do evento?",
    type: "select",
    options: [
      { value: "palestra", label: "Palestra / keynote" },
      { value: "workshop", label: "Workshop" },
      { value: "coquetel", label: "Coquetel / networking" },
      { value: "confraternizacao", label: "Confraternização" },
      { value: "outro", label: "Outro" },
    ],
  },
];

const COMMON_QUESTIONS: QuestionDef[] = [
  { key: "guest_count", text: "Quantos convidados são esperados?", type: "number" },
  { key: "event_date", text: "Qual é a data do evento?", type: "date" },
  { key: "location", text: "Onde será o evento?", type: "text", placeholder: "Cidade, local ou região" },
  { key: "target_budget", text: "Qual é o orçamento estimado (R$)?", type: "number" },
  {
    key: "target_audience",
    text: "Quem é o público / convidados principais?",
    type: "text",
    placeholder: "Ex.: família próxima, clientes VIP, equipe interna…",
  },
  {
    key: "restrictions",
    text: "Alguma restrição importante (dietas, acessibilidade, clima, horário)?",
    type: "text",
    optional: true,
  },
  {
    key: "vendors_hired",
    text: "Já existe algum fornecedor contratado?",
    type: "text",
    optional: true,
    placeholder: "Ex.: buffet já fechado, fotógrafo confirmado…",
  },
];

function branchQuestions(eventType: string | number | undefined): QuestionDef[] {
  if (eventType === "casamento") return WEDDING_QUESTIONS;
  if (eventType === "corporativo") return CORPORATE_QUESTIONS;
  return [];
}

/**
 * A sequência muda de tamanho assim que `event_type` é respondido — é o que
 * torna a entrevista dinâmica (ver docs/USER_FLOWS.md Fluxo 2). `getNextRuleQuestion`
 * sempre recalcula a sequência a partir das respostas atuais, então editar uma
 * resposta anterior (ex.: trocar o tipo do evento) naturalmente muda o que vem a
 * seguir — não há estado de "próxima pergunta" guardado à parte das respostas.
 */
export function ruleQuestionSequence(answers: InterviewAnswers): QuestionDef[] {
  return [...BASE_QUESTIONS, ...branchQuestions(answers.event_type), ...COMMON_QUESTIONS];
}

export function getNextRuleQuestion(answers: InterviewAnswers): QuestionDef | null {
  const sequence = ruleQuestionSequence(answers);
  return sequence.find((question) => !(question.key in answers)) ?? null;
}

export function findQuestionByKey(answers: InterviewAnswers, key: string): QuestionDef | undefined {
  return ruleQuestionSequence(answers).find((q) => q.key === key);
}

export function estimateProgress(answers: InterviewAnswers): number {
  const sequence = ruleQuestionSequence(answers);
  const answered = sequence.filter((q) => q.key in answers).length;
  return Math.min(100, Math.round((answered / sequence.length) * 100));
}
