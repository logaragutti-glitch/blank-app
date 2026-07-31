// Same values as packages/ui/src/tokens.ts (branco quente / grafite /
// champagne gold, Brand Bible) — kept as its own copy since @eve-os/ui's
// components render HTML elements and can't be used from React Native.
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
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;
