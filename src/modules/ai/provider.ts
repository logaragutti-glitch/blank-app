/**
 * Nenhum código de produto deve chamar um SDK de LLM diretamente — sempre por esta
 * interface. Ver docs/ARCHITECTURE.md §2 ("IA — OpenAI API atrás de uma interface
 * AiProvider"). Trocar de provedor é trocar a implementação injetada, não os módulos
 * de domínio (entrevista, documentos) que a consomem.
 */
export interface GenerateTextInput {
  system?: string;
  prompt: string;
  maxTokens?: number;
}

export interface GenerateStructuredInput<TShape> extends GenerateTextInput {
  /** Validador Zod (ou compatível) do formato esperado da resposta. */
  parse: (raw: unknown) => TShape;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiProvider {
  readonly name: string;

  generateText(input: GenerateTextInput): Promise<{ text: string; usage: AiUsage }>;

  generateStructured<TShape>(
    input: GenerateStructuredInput<TShape>,
  ): Promise<{ data: TShape; usage: AiUsage }>;
}
