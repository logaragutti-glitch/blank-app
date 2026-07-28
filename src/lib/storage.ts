import { createClient } from "@supabase/supabase-js";

/**
 * Lançado quando as credenciais do Supabase Storage não estão configuradas —
 * mesmo padrão de erro explícito usado por OpenAiProvider quando falta
 * OPENAI_API_KEY (src/modules/ai/openai-provider.ts): falha alto e cedo com
 * mensagem clara, em vez de mascarar com um retorno vazio.
 */
export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Storage não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY " +
        "para habilitar a exportação de PDF.",
    );
    this.name = "StorageNotConfiguredError";
  }
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "mem-architect-documents";

/** URL assinada expira em 7 dias — tempo suficiente para compartilhar sem deixar o link público para sempre. */
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 7;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new StorageNotConfiguredError();
  }
  // Service role key: só usado no servidor (rotas de API / server actions), nunca exposto ao client.
  return createClient(url, serviceRoleKey);
}

/**
 * Sobe um PDF para o bucket configurado e devolve uma URL assinada temporária.
 * `path` deve ser único por exportação (ver export.ts: `${organizationId}/${eventId}/...`)
 * para não colidir entre tenants nem sobrescrever exportações anteriores do mesmo evento.
 */
export async function uploadPdfAndGetSignedUrl(path: string, buffer: Buffer): Promise<string> {
  const client = getClient();

  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) {
    throw new Error(`Falha ao enviar PDF para o Storage: ${uploadError.message}`);
  }

  const { data, error: signError } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
  if (signError || !data) {
    throw new Error(`Falha ao gerar link assinado: ${signError?.message ?? "erro desconhecido"}`);
  }

  return data.signedUrl;
}
