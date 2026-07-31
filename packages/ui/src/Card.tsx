import type { HTMLAttributes, ReactNode } from "react";
import { colors, radii, shadows, spacing } from "./tokens";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Muito espaço interno, cantos arredondados, sombra discreta, borda quase invisível (06-ui-bible.md). */
export function Card({ style, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow: shadows.sm,
        padding: spacing.lg,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
