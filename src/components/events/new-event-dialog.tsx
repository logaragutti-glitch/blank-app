"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { createEventAction, type EventFormState } from "@/modules/events/actions";

const initialState: EventFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Criando…" : "Criar evento"}
    </Button>
  );
}

// Componente à parte, filho de DialogContent: desmonta quando o dialog fecha
// (Radix), então cada abertura recomeça com useFormState do zero — é o que
// permite fechar no sucesso sem useEffect (ver useCloseOnSuccess).
function EventForm({
  clients,
  onClose,
}: {
  clients: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [state, formAction] = useFormState(createEventAction, initialState);
  useCloseOnSuccess(state.success, onClose);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome do evento</Label>
        <Input id="name" name="name" required placeholder="Casamento Ana & Rui" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Tipo</Label>
        <Input id="type" name="type" placeholder="casamento, corporativo…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientId">Cliente</Label>
        <Select id="clientId" name="clientId" defaultValue="">
          <option value="">Sem cliente vinculado</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eventDate">Data do evento</Label>
        <Input id="eventDate" name="eventDate" type="date" />
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

export function NewEventDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Novo evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
          <DialogDescription>
            Só o essencial agora — a Entrevista Inteligente completa o resto.
          </DialogDescription>
        </DialogHeader>
        <EventForm clients={clients} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
