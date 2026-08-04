"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../lib/auth-guard";
import { apiClient, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import type { InspirationImage } from "../../lib/api-types";

const STATUS_LABEL: Record<InspirationImage["status"], string> = {
  PENDING: "Analisando...",
  ANALYZED: "Pronta",
  FAILED: "Falhou",
};

/** Every inspiration photo across every project — a cross-project view of what BriefingController already stores per event. */
function InspiracaoContent() {
  const { accessToken } = useAuth();
  const [images, setImages] = useState<InspirationImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<InspirationImage[]>("/briefing/inspiration-images", accessToken)
      .then(setImages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar as fotos."));
  }, [accessToken]);

  if (error) return <p style={{ color: colors.danger }}>Encontrei um ponto que merece atenção: {error}</p>;
  if (!images) return <p style={{ color: colors.textMuted }}>Reunindo as fotos de inspiração...</p>;

  return (
    <>
      <h1>Inspiração</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>
        Todas as fotos que os casais mandaram, de todos os projetos, com a análise de IA de cada uma.
      </p>

      {images.length === 0 ? (
        <p style={{ color: colors.textMuted }}>
          Nenhuma foto enviada ainda — o upload acontece na tela de Diagnóstico de cada projeto.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: spacing.md,
          }}
        >
          {images.map((image) => (
            <Link key={image.id} href={`/projects/${image.eventId}/diagnostico`} style={{ textDecoration: "none" }}>
              {image.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external, time-limited signed URL; not a local/optimizable asset
                <img
                  src={image.imageUrl}
                  alt={image.originalFilename}
                  style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: radii.md, display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: 160, borderRadius: radii.md, backgroundColor: colors.border }} />
              )}
              <p
                style={{
                  margin: `${spacing.xs} 0 0`,
                  fontSize: "0.75rem",
                  color: image.status === "FAILED" ? colors.danger : colors.textMuted,
                }}
              >
                {STATUS_LABEL[image.status]}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function InspiracaoPage() {
  return (
    <AuthGuard>
      <AppShell>
        <InspiracaoContent />
      </AppShell>
    </AuthGuard>
  );
}
