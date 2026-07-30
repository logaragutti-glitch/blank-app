/**
 * Design tokens shared by all EVE OS frontends — branco quente / grafite /
 * champagne gold, per the Brand Bible (02-brand-bible.md: "tons pastéis,
 * muito branco, tipografia delicada... exclusividade, Fine Art wedding,
 * feminilidade, elegância") and the UI Bible's golden rules
 * (06-ui-bible.md: "branco quente, grafite, destaques em champagne gold —
 * nada de azul, vermelho ou verde intenso"). Replaces the Sprint 0
 * generic dark-SaaS placeholder palette.
 */
export const colors = {
  background: "#FBF7F2",
  surface: "#FFFFFF",
  border: "#EAE1D6",
  primary: "#B8935E",
  primaryHover: "#A17F4E",
  danger: "#B4645A",
  textPrimary: "#2F2B27",
  textMuted: "#8A8078",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "40px",
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  full: "9999px",
} as const;

/** Extremely discrete — never a hard drop shadow (see 06-ui-bible.md). */
export const shadows = {
  sm: "0 1px 2px rgba(47, 43, 39, 0.06)",
  md: "0 4px 16px rgba(47, 43, 39, 0.08)",
} as const;

export const fonts = {
  body: "'Georgia', 'Iowan Old Style', serif",
} as const;
