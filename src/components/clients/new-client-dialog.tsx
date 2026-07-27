"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createClientAction, type ClientFormState } from "@/modules/clients/actions";

const initialState: ClientFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Salvando…" : "Criar cliente"}
    </Button>
  );
}

// Componente à parte, filho de DialogContent: desmonta quando o dialog fecha
// (Radix), então cada abertura recomeça com useFormState do zero — é o que
// permite fechar no sucesso sem useEffect (ver useCloseOnSuccess).
function ClientForm({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState(createClientAction, initialState);
  useCloseOnSuccess(state.success, onClose);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required placeholder="Ana & Rui" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="contato@cliente.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" placeholder="(11) 99999-0000" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" placeholder="Preferências, contexto…" />
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

export function NewClientDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>Quem vai contratar o evento.</DialogDescription>
        </DialogHeader>
        <ClientForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
