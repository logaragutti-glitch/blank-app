"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { generateDocumentsAction } from "@/modules/documents/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Gerando documentos… (pode levar um minuto)" : label}
    </Button>
  );
}

export function GenerateDocumentsButton({ eventId, label }: { eventId: string; label: string }) {
  const boundAction = generateDocumentsAction.bind(null, eventId);
  return (
    <form action={boundAction}>
      <SubmitButton label={label} />
    </form>
  );
}
