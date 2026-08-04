import { useEffect, useRef, useState } from "react";
import { Button, Card, colors, radii, spacing } from "@eve-os/ui";
import type { InspirationImage } from "@eve-os/types";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";

const STATUS_LABEL: Record<InspirationImage["status"], string> = {
  PENDING: "Analisando...",
  ANALYZED: "Pronta",
  FAILED: "Falhou",
};

const STATUS_COLOR: Record<InspirationImage["status"], string> = {
  PENDING: colors.textMuted,
  ANALYZED: colors.primary,
  FAILED: colors.danger,
};

/**
 * "Existe alguma decoração que vocês viram e amaram? Pode deixar um link,
 * foto ou descrição" — the real Bia intake form only has a text field for
 * this; EVE OS already has real photo upload + AI vision analysis
 * (BriefingController), this component is the missing UI for it. Used both
 * right after creating a project (projects/new) and later from the
 * Diagnóstico screen, since the couple may send more photos afterwards.
 */
export function InspirationImageUploader({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const [images, setImages] = useState<InspirationImage[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadImages() {
    if (!accessToken) return;
    apiClient
      .get<InspirationImage[]>(`/briefing/${eventId}/inspiration-images`, accessToken)
      .then(setImages)
      .catch(() => setImages([]));
  }

  useEffect(loadImages, [accessToken, eventId]);

  // Poll while any photo is still PENDING (vision analysis running server-side)
  // so the status badge updates on its own instead of needing a manual refresh.
  useEffect(() => {
    if (!images?.some((image) => image.status === "PENDING")) return;
    const timer = setInterval(loadImages, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadImages closes over accessToken/eventId, both stable per render cycle here
  }, [images]);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0 || !accessToken) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const image = await apiClient.uploadFile<InspirationImage>(
          `/briefing/${eventId}/inspiration-images`,
          file,
          accessToken,
        );
        setImages((previous) => [...(previous ?? []), image]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos enviar essa foto. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Fotos de inspiração</h3>
      <p style={{ color: colors.textMuted }}>
        Manda tudo que o casal amou — a IA analisa cada foto (flores, cores, mobiliário, estilo) e usa isso
        no Diagnóstico Criativo.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        disabled={uploading}
        style={{ marginBottom: spacing.md }}
      />
      {uploading && <p style={{ color: colors.textMuted }}>Enviando...</p>}
      {error && <p style={{ color: colors.danger }}>{error}</p>}

      {images && images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          {images.map((image) => (
            <div key={image.id}>
              {image.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external, time-limited signed URL; not a local/optimizable asset
                <img
                  src={image.imageUrl}
                  alt={image.originalFilename}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: radii.md,
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: radii.md,
                    backgroundColor: colors.border,
                  }}
                />
              )}
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "0.75rem", color: STATUS_COLOR[image.status] }}>
                {STATUS_LABEL[image.status]}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
