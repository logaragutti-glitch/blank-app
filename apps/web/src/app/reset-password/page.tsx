"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { apiClient, ApiError } from "../../lib/api-client";

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const router = useRouter();
  const token = searchParams.token;
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/auth/reset-password", { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos redefinir sua senha. Tente novamente.");
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
        <h1 style={{ marginTop: 0 }}>Redefinir senha</h1>
        {!token ? (
          <p style={{ color: colors.danger }}>
            Link inválido — falta o token de redefinição. Peça um novo link em{" "}
            <Link href="/forgot-password">Esqueci minha senha</Link>.
          </p>
        ) : done ? (
          <p style={{ color: colors.textMuted }}>
            Senha atualizada. <Link href="/login">Entrar</Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <Input
              type="password"
              placeholder="Nova senha (mínimo 8 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
            {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
        {!done && (
          <p style={{ color: colors.textMuted, marginBottom: 0 }}>
            <Link href="/login">Voltar para o login</Link>
          </p>
        )}
      </Card>
    </main>
  );
}
