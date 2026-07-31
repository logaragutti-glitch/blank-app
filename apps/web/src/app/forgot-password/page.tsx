"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input, colors, spacing } from "@eve-os/ui";
import { apiClient } from "../../lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Always shows the same confirmation, whether or not the email is
  // registered — the API deliberately never reveals which case it was.
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
    } finally {
      setSubmitting(false);
      setSent(true);
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
        <h1 style={{ marginTop: 0 }}>Esqueci minha senha</h1>
        {sent ? (
          <p style={{ color: colors.textMuted }}>
            Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha.
          </p>
        ) : (
          <>
            <p style={{ color: colors.textMuted }}>Informe seu e-mail para receber um link de redefinição.</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar link"}
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
