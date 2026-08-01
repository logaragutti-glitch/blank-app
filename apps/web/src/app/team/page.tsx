"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

function InviteMemberContent() {
  const { accessToken } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/auth/invite", { email }, accessToken);
      setSentTo(email);
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos enviar o convite. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Equipe</h1>
      <Card>
        <h2 style={{ marginTop: 0 }}>Convidar um novo membro</h2>
        <p style={{ color: colors.textMuted }}>
          Envia um link de convite por e-mail para entrar na sua organização.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <label>
            E-mail
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
          {sentTo && !error && (
            <p style={{ color: colors.textMuted, margin: 0 }}>Convite enviado para {sentTo}.</p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar convite"}
          </Button>
        </form>
      </Card>
    </>
  );
}

export default function TeamPage() {
  return (
    <AuthGuard>
      <AppShell>
        <InviteMemberContent />
      </AppShell>
    </AuthGuard>
  );
}
