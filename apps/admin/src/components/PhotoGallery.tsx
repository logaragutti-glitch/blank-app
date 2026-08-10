"use client";

import { useRef, useState } from "react";
import { Button, Card, colors, radii, spacing } from "@eve-os/ui";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";

interface PhotoGalleryEntity {
  photoKeys: string[];
  photoUrls?: string[];
}

/**
 * Real photos for a Knowledge Graph catalog entry — the actual space
 * (Venue), the actual piece/sample (Material: flowers, fabric, furniture,
 * lighting...), or the actual work (Supplier), as opposed to Inspiração's
 * reference photos the couple sends in. Generic over the three catalog
 * endpoints, which all expose the same POST/DELETE .../:id/photos shape
 * (KnowledgeGraphController).
 */
export function PhotoGallery<T extends PhotoGalleryEntity>({
  endpointPrefix,
  entityId,
  entity,
  onChange,
}: {
  endpointPrefix: "venues" | "materials" | "suppliers";
  entityId: string;
  entity: T;
  onChange: (updated: T) => void;
}) {
  const { accessToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0 || !accessToken) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const updated = await apiClient.uploadFile<T>(
          `/knowledge-graph/${endpointPrefix}/${entityId}/photos`,
          file,
          accessToken,
        );
        onChange(updated);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos enviar essa foto. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(key: string) {
    if (!accessToken) return;
    setError(null);
    setDeletingKey(key);
    try {
      const updated = await apiClient.delete<T>(
        `/knowledge-graph/${endpointPrefix}/${entityId}/photos?key=${encodeURIComponent(key)}`,
        accessToken,
      );
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos remover essa foto. Tente novamente.");
    } finally {
      setDeletingKey(null);
    }
  }

  // photoUrls is computed server-side in the same order as photoKeys
  // (KnowledgeGraphController.attachPhotoUrls) — zip them back together.
  const photos = entity.photoKeys.map((key, index) => ({ key, url: entity.photoUrls?.[index] }));

  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Fotos reais</h3>
      <p style={{ color: colors.textMuted }}>
        Fotos de verdade, não referências — o espaço, a peça ou o material exatos que vão pra proposta.
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
      {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}

      {photos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          {photos.map((photo) => (
            <div key={photo.key}>
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external, time-limited signed URL; not a local/optimizable asset
                <img
                  src={photo.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: radii.md,
                    display: "block",
                  }}
                />
              ) : (
                <div style={{ width: "100%", height: 120, borderRadius: radii.md, backgroundColor: colors.border }} />
              )}
              <Button
                type="button"
                variant="danger"
                onClick={() => handleDelete(photo.key)}
                disabled={deletingKey === photo.key}
                style={{ marginTop: spacing.xs, width: "100%", fontSize: "0.8rem", padding: spacing.xs }}
              >
                {deletingKey === photo.key ? "Removendo..." : "Remover"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
