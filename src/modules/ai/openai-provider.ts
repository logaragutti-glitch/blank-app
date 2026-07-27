import type { AiProvider, GenerateStructuredInput, GenerateTextInput } from "./provider";

/**
 * Implementação de referência do AiProvider usando a OpenAI API. Chamada real via
 * fetch (sem SDK) para manter a dependência mínima até a Sprint 3, quando o motor de
 * entrevista e o orquestrador de documentos passam a consumir isto de fato.
 */
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string = process.env.OPENAI_API_KEY ?? "",
    private readonly model: string = "gpt-4o-mini",
  ) {}

  async generateText({ system, prompt, maxTokens }: GenerateTextInput) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content as string,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  async generateStructured<TShape>(input: GenerateStructuredInput<TShape>) {
    const { text, usage } = await this.generateText({
      ...input,
      system: `${input.system ?? ""}\nResponda apenas com JSON válido, sem markdown.`.trim(),
    });

    const data = input.parse(JSON.parse(text));
    return { data, usage };
  }
}
