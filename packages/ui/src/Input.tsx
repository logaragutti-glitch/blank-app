import type { InputHTMLAttributes } from "react";
import { colors, radii, spacing } from "./tokens";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ style, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      style={{
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        padding: `${spacing.sm} ${spacing.md}`,
        fontSize: "0.95rem",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}
