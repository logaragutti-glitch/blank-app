import type { ButtonHTMLAttributes, ReactNode } from "react";
import { colors, radii, spacing } from "./tokens";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost";
  children: ReactNode;
}

const variantStyle: Record<NonNullable<ButtonProps["variant"]>, { background: string; color: string; border: string }> = {
  primary: { background: colors.primary, color: "#FFFFFF", border: "none" },
  danger: { background: colors.danger, color: "#FFFFFF", border: "none" },
  ghost: { background: "transparent", color: colors.textPrimary, border: `1px solid ${colors.border}` },
};

export function Button({ variant = "primary", style, children, ...rest }: ButtonProps) {
  const variantStyles = variantStyle[variant];
  return (
    <button
      {...rest}
      style={{
        backgroundColor: variantStyles.background,
        color: variantStyles.color,
        border: variantStyles.border,
        borderRadius: radii.lg,
        padding: `${spacing.sm} ${spacing.lg}`,
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "opacity 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
