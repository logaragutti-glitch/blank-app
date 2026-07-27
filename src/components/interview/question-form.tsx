"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitAnswerAction, type InterviewFormState } from "@/modules/interview/actions";
import type { QuestionDef } from "@/modules/interview/questions";

const initialState: InterviewFormState = {};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Salvando…" : children}
    </Button>
  );
}

export function QuestionForm({
  eventId,
  question,
  defaultValue,
  isEditing,
}: {
  eventId: string;
  question: QuestionDef;
  defaultValue?: string;
  isEditing?: boolean;
}) {
  const boundAction = submitAnswerAction.bind(null, eventId);
  const [state, formAction] = useFormState(boundAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Uma edição bem-sucedida sai da URL `?edit=key` — sem isso a página continua
  // mostrando a mesma pergunta em vez de avançar para a próxima pendente (o
  // servidor recalcula `nextQuestion` a partir das respostas, mas só aplica
  // quando a página deixa de estar "presa" no parâmetro de edição).
  useEffect(() => {
    if (isEditing && state !== initialState && !state.error) {
      router.replace(`/events/${eventId}/interview`);
    }
  }, [state, isEditing, eventId, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="questionKey" value={question.key} />

      {question.type === "select" && question.options ? (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <button
              key={option.value}
              type="submit"
              name="rawValue"
              value={option.value}
              className="rounded-md border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:border-accent hover:bg-accent/5 data-[selected=true]:border-accent"
              data-selected={defaultValue === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <Input
            ref={inputRef}
            name="rawValue"
            type={question.type === "number" ? "number" : question.type === "date" ? "date" : "text"}
            defaultValue={defaultValue}
            placeholder={question.placeholder}
            autoFocus
          />
          <SubmitButton>{isEditing ? "Salvar alteração" : "Continuar"}</SubmitButton>
        </>
      )}

      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      {question.optional && !isEditing && question.type !== "select" && (
        <div className="text-center">
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Pular esta pergunta
          </button>
        </div>
      )}
    </form>
  );
}
