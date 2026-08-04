"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, colors, radii, spacing } from "@eve-os/ui";
import { ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";

// No inline SVG icon library in this codebase — small hand-rolled icons
// instead of adding a dependency for three glyphs.
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 4.24A11 11 0 0 1 12 4c7 0 11 8 11 8a17.5 17.5 0 0 1-4.22 5.06M6.3 6.3C3.75 8 2 12 2 12s2.5 4.5 6.9 6.36" />
    </svg>
  );
}

// Purely decorative — replaces a stock floral photograph (none available
// locally, and fetching one at build time would be an external dependency
// this self-contained app doesn't otherwise have) with a simple line-art
// rose in the same palette as the rest of the brand.
function FloralIllustration() {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none" aria-hidden>
      <circle cx="110" cy="110" r="34" stroke={colors.primary} strokeWidth="1.5" opacity="0.6" />
      <circle cx="110" cy="110" r="22" stroke={colors.primary} strokeWidth="1.5" opacity="0.8" />
      <circle cx="110" cy="110" r="10" fill={colors.primary} opacity="0.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = 110 + Math.cos(angle) * 60;
        const y = 110 + Math.sin(angle) * 60;
        return <circle key={i} cx={x} cy={y} r="16" stroke={colors.primary} strokeWidth="1" opacity="0.3" />;
      })}
    </svg>
  );
}

function BrandPanel() {
  return (
    <div
      style={{
        flex: "1 1 45%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
        padding: spacing.xl,
        background: `linear-gradient(160deg, ${colors.background} 0%, #F3E4D6 100%)`,
        textAlign: "center",
      }}
    >
      <FloralIllustration />
      <div>
        <div style={{ color: colors.primary, fontWeight: 700, fontSize: "1.6rem", letterSpacing: "0.1em" }}>
          EVE OS
        </div>
        <div style={{ color: colors.textMuted, fontSize: "0.7rem", letterSpacing: "0.15em" }}>
          EVENT INTELLIGENCE OS
        </div>
      </div>
      <div style={{ maxWidth: 340 }}>
        <h2 style={{ marginBottom: spacing.sm }}>O sistema inteligente para eventos extraordinários.</h2>
        <p style={{ color: colors.textMuted }}>
          Planeje, organize e entregue experiências inesquecíveis com tecnologia, criatividade e inteligência
          em um só lugar.
        </p>
      </div>
    </div>
  );
}

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
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexWrap: "wrap" }}>
        <BrandPanel />
        <div
          style={{
            flex: "1 1 45%",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <LoginForm />
        </div>
      </div>
      <footer
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: spacing.md,
          padding: `${spacing.md} ${spacing.xl}`,
          borderTop: `1px solid ${colors.border}`,
          color: colors.textMuted,
          fontSize: "0.8rem",
        }}
      >
        <div style={{ display: "flex", gap: spacing.lg, flexWrap: "wrap" }}>
          <span>🛡️ Seguro e confiável</span>
          <span>🔒 Seus dados protegidos</span>
          <span>☁️ Acesso de qualquer lugar</span>
        </div>
        <span>© {new Date().getFullYear()} EVE OS. Todos os direitos reservados.</span>
      </footer>
    </main>
  );
}
