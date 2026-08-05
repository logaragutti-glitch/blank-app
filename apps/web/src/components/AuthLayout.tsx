import type { ReactNode } from "react";
import { colors, spacing } from "@eve-os/ui";

// Purely decorative — replaces a stock floral photograph (none available
// locally, and fetching one at build time would be an external dependency
// this self-contained app doesn't otherwise have) with a simple line-art
// rose in the same palette as the rest of the brand.
export function FloralIllustration() {
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

/** Left/brand panel shared by Login and Register — `children` is the part that differs (tagline vs. feature checklist). */
export function AuthBrandPanel({ children }: { children: ReactNode }) {
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
      {children}
    </div>
  );
}

/** Full-page split shell shared by Login and Register: brand panel + form panel + trust footer. */
export function AuthShell({ brandContent, children }: { brandContent: ReactNode; children: ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexWrap: "wrap" }}>
        <AuthBrandPanel>{brandContent}</AuthBrandPanel>
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
          {children}
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
