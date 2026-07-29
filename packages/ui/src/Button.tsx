import type { ButtonHTMLAttributes, ReactNode } from "react";
import { colors, radii, spacing } from "./tokens";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost";
  children: ReactNode;
}

const variantColor: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: colors.primary,
  danger: colors.danger,
  ghost: "transparent",
};

export function Button({ variant = "primary", style, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{
        backgroundColor: variantColor[variant],
        color: colors.textPrimary,
        border: variant === "ghost" ? `1px solid ${colors.textMuted}` : "none",
        borderRadius: radii.md,
        padding: `${spacing.sm} ${spacing.md}`,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
