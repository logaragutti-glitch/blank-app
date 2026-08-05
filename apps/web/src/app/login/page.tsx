"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, colors, radii, spacing } from "@eve-os/ui";
import { AuthShell } from "../../components/AuthLayout";
import { EyeIcon } from "../../components/icons";
import { ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

function SocialButton({ label }: { label: string }) {
  // Google/Microsoft sign-in isn't wired up (only e-mail/senha auth exists
  // today) — shown disabled with an honest badge instead of a button that
  // would silently do nothing.
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        padding: spacing.sm,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        color: colors.textMuted,
        opacity: 0.55,
        cursor: "not-allowed",
        fontSize: "0.85rem",
      }}
    >
      {label}
      <span
        style={{
          fontSize: "0.6rem",
          border: `1px solid ${colors.border}`,
          borderRadius: radii.full,
          padding: "0 4px",
        }}
      >
        em breve
      </span>
    </div>
  );
}

function BrandContent() {
  return (
    <div style={{ maxWidth: 340 }}>
      <h2 style={{ marginBottom: spacing.sm }}>O sistema inteligente para eventos extraordinários.</h2>
      <p style={{ color: colors.textMuted }}>
        Planeje, organize e entregue experiências inesquecíveis com tecnologia, criatividade e inteligência em
        um só lugar.
      </p>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, remember);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos entrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 380 }}>
      <h1 style={{ marginBottom: spacing.xs }}>Bem-vinda de volta! ✨</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>Entre para continuar sua jornada no EVE OS</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
        <div>
          <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>E-mail</label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={{ color: colors.textMuted, fontSize: "0.85rem" }}>Senha</label>
          <div style={{ position: "relative" }}>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: spacing.xs, color: colors.textMuted }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Lembrar de mim
          </label>
          <Link href="/forgot-password" style={{ color: colors.primary }}>
            Esqueci minha senha
          </Link>
        </div>

        {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "✨ Entrar"}
        </Button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, margin: `${spacing.lg} 0` }}>
        <div style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <span style={{ color: colors.textMuted, fontSize: "0.75rem" }}>ou continue com</span>
        <div style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </div>

      <div style={{ display: "flex", gap: spacing.sm }}>
        <SocialButton label="Google" />
        <SocialButton label="Microsoft" />
      </div>

      <p style={{ color: colors.textMuted, textAlign: "center", marginTop: spacing.lg }}>
        Ainda não tem uma conta? <Link href="/register" style={{ color: colors.primary }}>Criar conta</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell brandContent={<BrandContent />}>
      <LoginForm />
    </AuthShell>
  );
}
