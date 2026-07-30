"use client";

import { useEffect, useState } from "react";
import { colors, spacing } from "@eve-os/ui";

/**
 * The "Momento Mágico" loading state (06-ui-bible.md) — never a generic
 * "Carregando...". Cycles through contextual first-person thoughts while
 * the AI processes, since the pipeline gives no intermediate progress to
 * report.
 */
export function AiThought({ thoughts }: { thoughts: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % thoughts.length), 2200);
    return () => clearInterval(interval);
  }, [thoughts.length]);

  return (
    <p style={{ color: colors.textMuted, fontStyle: "italic", padding: `${spacing.lg} 0` }}>
      {thoughts[index]}
    </p>
  );
}
