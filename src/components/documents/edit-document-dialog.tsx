"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { editDocumentAction, type EditDocumentFormState } from "@/modules/documents/actions";

const initialState: EditDocumentFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Salvando…" : "Salvar como nova versão"}
    </Button>
  );
}

// Componente à parte, filho de DialogContent: desmonta quando o dialog fecha
// (Radix), então cada abertura recomeça com useFormState do zero — é o que
// permite fechar no sucesso sem useEffect (ver useCloseOnSuccess).
function DocumentForm({
  eventId,
  documentId,
  content,
  onClose,
}: {
  eventId: string;
  documentId: string;
  content: unknown;
  onClose: () => void;
}) {
  const boundAction = editDocumentAction.bind(null, eventId, documentId);
  const [state, formAction] = useFormState(boundAction, initialState);
  useCloseOnSuccess(state.success, onClose);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Textarea
        name="content"
        defaultValue={JSON.stringify(content, null, 2)}
        className="min-h-72 font-mono text-xs"
        spellCheck={false}
      />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

export function EditDocumentDialog({
  eventId,
  documentId,
  content,
}: {
  eventId: string;
  documentId: string;
  content: unknown;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar conteúdo</DialogTitle>
          <DialogDescription>
            Edição manual em JSON — salvar cria uma nova versão, a anterior fica no histórico.
          </DialogDescription>
        </DialogHeader>
        <DocumentForm
          eventId={eventId}
          documentId={documentId}
          content={content}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
