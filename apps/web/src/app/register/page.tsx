"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, colors, spacing } from "@eve-os/ui";
import { AuthShell } from "../../components/AuthLayout";
import { EyeIcon } from "../../components/icons";
import { ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

const FEATURES = [
  { icon: "✨", title: "Inteligente", description: "A IA acompanha cada etapa do seu evento, do briefing à produção." },
  { icon: "🤝", title: "Colaborativo", description: "Sua equipe conectada em um só lugar, com convites por e-mail." },
  { icon: "🔒", title: "Seguro", description: "Autenticação e senhas protegidas, dados isolados por organização." },
  { icon: "📋", title: "Completo", description: "Diagnóstico, proposta, produção e financeiro no mesmo sistema." },
];

function BrandContent() {
  return (
    <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: spacing.md, textAlign: "left" }}>
      {FEATURES.map((feature) => (
        <div key={feature.title} style={{ display: "flex", gap: spacing.sm, alignItems: "flex-start" }}>
          <span aria-hidden style={{ fontSize: "1.2rem" }}>
            {feature.icon}
          </span>
          <div>
            <strong>{feature.title}</strong>
            <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.85rem" }}>{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
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
    <div style={{ width: "100%", maxWidth: 380 }}>
      <h1 style={{ marginBottom: spacing.xs }}>Criar sua conta ✨</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Peça o ID da sua organização a quem já usa o EVE OS na sua equipe.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        <div>
          <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>ID da organização</label>
          <Input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required />
        </div>
        <div>
          <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>Nome completo</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>E-mail</label>
          <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>Senha</label>
          <div style={{ position: "relative" }}>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              style={{ paddingRight: 40, width: "100%", boxSizing: "border-box" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: colors.textMuted,
                cursor: "pointer",
                display: "flex",
              }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        <div>
          <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>Confirmar senha</label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Criando conta..." : "✨ Criar conta"}
        </Button>
      </form>

      <p style={{ color: colors.textMuted, textAlign: "center", marginTop: spacing.lg }}>
        Já tem uma conta? <Link href="/login" style={{ color: colors.primary }}>Entrar</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell brandContent={<BrandContent />}>
      <RegisterForm />
    </AuthShell>
  );
}
