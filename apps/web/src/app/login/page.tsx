"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos entrar. Tente novamente.");
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
        <h1 style={{ marginTop: 0 }}>Bem-vinda de volta</h1>
        <p style={{ color: colors.textMuted }}>Entre para continuar seus projetos.</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p style={{ color: colors.textMuted, marginBottom: 0 }}>
          <Link href="/forgot-password">Esqueci minha senha</Link>
        </p>
        <p style={{ color: colors.textMuted, marginBottom: 0 }}>
          Ainda não tem uma conta? <Link href="/register">Criar conta</Link>
        </p>
      </Card>
    </main>
  );
}
