"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ organizationId, name, email, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos criar sua conta. Tente novamente.");
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
        <h1 style={{ marginTop: 0 }}>Criar conta</h1>
        <p style={{ color: colors.textMuted }}>
          Peça o ID da sua organização a quem já usa o EVE OS na sua equipe.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <Input
            placeholder="ID da organização"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
          />
          <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
            {submitting ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p style={{ color: colors.textMuted, marginBottom: 0 }}>
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </Card>
    </main>
  );
}
