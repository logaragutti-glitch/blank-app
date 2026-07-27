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
import { inviteMemberAction, type InviteFormState } from "@/modules/organizations/actions";

const initialState: InviteFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Convidando…" : "Convidar"}
    </Button>
  );
}

// Componente à parte, filho de DialogContent: desmonta quando o dialog fecha
// (Radix), então cada abertura recomeça com useFormState do zero — é o que
// permite fechar no sucesso sem useEffect (ver useCloseOnSuccess).
function InviteForm({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState(inviteMemberAction, initialState);
  useCloseOnSuccess(state.success, onClose);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required placeholder="pessoa@email.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Papel</Label>
        <Select id="role" name="role" defaultValue="MEMBER">
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Convidar membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            Se o e-mail já tem conta, o acesso é liberado na hora. Caso contrário, o convite é
            aceito automaticamente quando essa pessoa se cadastrar.
          </DialogDescription>
        </DialogHeader>
        <InviteForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
