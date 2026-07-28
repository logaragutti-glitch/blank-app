"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { exportPdfAction, type ExportPdfFormState } from "@/modules/documents/actions";

const initialState: ExportPdfFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "Gerando PDF…" : "Exportar PDF"}
    </Button>
  );
}

export function ExportPdfButton({ eventId }: { eventId: string }) {
  const boundAction = exportPdfAction.bind(null, eventId);
  const [state, formAction] = useFormState(boundAction, initialState);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={formAction}>
        <SubmitButton />
      </form>
      {state.url && (
        <a
          href={state.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-accent hover:underline"
        >
          Abrir PDF exportado
        </a>
      )}
      {state.error && <p className="max-w-xs text-right text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
