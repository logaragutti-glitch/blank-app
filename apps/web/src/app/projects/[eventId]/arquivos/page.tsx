"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, colors, spacing } from "@eve-os/ui";
import { AppShell } from "../../../../components/AppShell";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useProject } from "../../../../lib/use-project";
import type { ProjectFile } from "../../../../lib/api-types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
].join(",");

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  return "📎";
}

function ArquivosContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { project } = useProject(eventId);
  const [files, setFiles] = useState<ProjectFile[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectFile[]>(`/events/${eventId}/files`, accessToken)
      .then(setFiles)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os arquivos."));
  }, [accessToken, eventId]);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !accessToken) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const uploaded = await apiClient.uploadFile<ProjectFile>(`/events/${eventId}/files`, file, accessToken);
        setFiles((current) => [uploaded, ...(current ?? [])]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não conseguimos enviar esse arquivo. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    await apiClient.delete(`/events/${eventId}/files/${fileId}`, accessToken);
    setFiles((current) => (current ?? []).filter((f) => f.id !== fileId));
  }

  if (error) return <p style={{ color: colors.danger }}>{error}</p>;

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>Arquivos do Projeto</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project?.clientNames ?? ""}</p>

      <Card style={{ marginBottom: spacing.lg }}>
        <h3 style={{ marginTop: 0 }}>Enviar arquivo</h3>
        <p style={{ color: colors.textMuted }}>Contratos, plantas, orçamentos de fornecedores — PDF, imagem, Word ou Excel.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          disabled={uploading}
        />
        {uploading && <p style={{ color: colors.textMuted, margin: `${spacing.sm} 0 0` }}>Enviando...</p>}
      </Card>

      {files === null ? (
        <p style={{ color: colors.textMuted }}>Reunindo os arquivos...</p>
      ) : files.length === 0 ? (
        <p style={{ color: colors.textMuted }}>Nenhum arquivo enviado ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
          {files.map((file) => (
            <Card key={file.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: spacing.sm }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, minWidth: 0 }}>
                  <span aria-hidden style={{ fontSize: "1.4rem" }}>
                    {fileIcon(file.mimeType)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        color: colors.textPrimary,
                        fontSize: "0.9rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {file.originalFilename}
                    </strong>
                    <p style={{ color: colors.textMuted, margin: 0, fontSize: "0.8rem" }}>
                      {formatBytes(file.sizeBytes)} · {dateFormatter.format(new Date(file.createdAt))}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, flexShrink: 0 }}>
                  {file.fileUrl && (
                    <a href={file.fileUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost">Baixar</Button>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    title="Excluir"
                    style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function ArquivosPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <ArquivosContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
