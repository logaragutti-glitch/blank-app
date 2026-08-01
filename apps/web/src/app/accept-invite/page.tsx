"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

export default function AcceptInvitePage({ searchParams }: { searchParams: { token?: string } }) {
  const { acceptInvite } = useAuth();
  const router = useRouter();
  const token = searchParams.token;
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await acceptInvite({ token: token!, name, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos aceitar esse convite. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ marginTop: 0 }}>Aceitar convite</h1>
        {!token ? (
          <p style={{ color: colors.danger }}>
            Link inválido — falta o token do convite. Peça um novo convite a quem te chamou.
          </p>
        ) : (
          <>
            <p style={{ color: colors.textMuted }}>Crie sua senha para entrar na organização.</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                type="password"
                placeholder="Senha (mínimo 8 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Entrando..." : "Aceitar convite"}
              </Button>
            </form>
          </>
        )}
        <p style={{ color: colors.textMuted, marginBottom: 0 }}>
          <Link href="/login">Voltar para o login</Link>
        </p>
      </Card>
    </main>
  );
}
