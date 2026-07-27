"use client";

import { useEffect, useRef, useState } from "react";
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
  const boundAction = editDocumentAction.bind(null, eventId, documentId);
  const [state, formAction] = useFormState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

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
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <Textarea
            name="content"
            defaultValue={JSON.stringify(content, null, 2)}
            className="min-h-72 font-mono text-xs"
            spellCheck={false}
          />
          {state.error && <p className="text-xs text-destructive">{state.error}</p>}
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
