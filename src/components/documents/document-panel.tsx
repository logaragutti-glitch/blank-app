"use client";

import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentContentView } from "./document-content";
import { EditDocumentDialog } from "./edit-document-dialog";
import { regenerateDocumentAction } from "@/modules/documents/actions";
import { DOCUMENT_SKELETONS, type GeneratableDocumentType } from "@/modules/documents/schemas";

type DocumentStatus = "PENDING" | "GENERATING" | "READY" | "FAILED";

function RegenerateButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? "Gerando…" : label}
    </Button>
  );
}

export function DocumentPanel({
  eventId,
  label,
  document,
}: {
  eventId: string;
  label: string;
  document: {
    id: string;
    type: GeneratableDocumentType;
    status: DocumentStatus;
    content: unknown;
  } | null;
}) {
  if (!document || document.status === "PENDING") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {label} ainda não foi gerado. Use o botão em &ldquo;Visão geral&rdquo; para gerar
          todos os documentos MEM de uma vez.
        </CardContent>
      </Card>
    );
  }

  const boundRegenerate = regenerateDocumentAction.bind(null, eventId, document.id);

  if (document.status === "GENERATING") {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          Gerando {label}…
        </CardContent>
      </Card>
    );
  }

  if (document.status === "FAILED") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm">
          <Badge variant="destructive">Falhou</Badge>
          <p className="text-muted-foreground">
            Não foi possível gerar {label}. Verifique se a IA está configurada, tente de novo ou
            preencha manualmente.
          </p>
          <div className="flex items-center gap-2">
            <form action={boundRegenerate}>
              <RegenerateButton label="Tentar novamente" />
            </form>
            <EditDocumentDialog
              eventId={eventId}
              documentId={document.id}
              content={document.content ?? DOCUMENT_SKELETONS[document.type]}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5">
        <DocumentContentView type={document.type} content={document.content} />
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <form action={boundRegenerate}>
            <RegenerateButton label="Gerar novamente" />
          </form>
          <EditDocumentDialog eventId={eventId} documentId={document.id} content={document.content} />
        </div>
      </CardContent>
    </Card>
  );
}
