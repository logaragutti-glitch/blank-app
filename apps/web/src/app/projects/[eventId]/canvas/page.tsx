"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../../../components/AppShell";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useProject } from "../../../../lib/use-project";
import type { EventCanvas, EventCanvasNode, EventCanvasNodeCategory } from "../../../../lib/api-types";

// Canvas do Evento (03-product-spec.md/06-ui-bible.md): a read-only visual
// snapshot of everything already connected to this Event in the Knowledge
// Graph. Deliberately does not implement the Rule Engine / Event Impact
// Engine's cascading recalculation (04-ai-bible.md) — that would require
// real business rules (e.g. "ceremony time change -> lighting
// recommendation") that don't exist anywhere in this system yet, and
// fabricating them would be exactly the kind of invented behavior this
// product avoids everywhere else. A node with no cadastro yet says so
// honestly instead of showing something that isn't real.
const NODE_LABELS: Record<EventCanvasNodeCategory, string> = {
  CLIENT: "Cliente",
  VENUE: "Espaço",
  FLOWERS: "Flores",
  FURNITURE: "Mobiliário",
  LIGHTING: "Luz",
  MUSIC: "Música",
  CATERING: "Gastronomia",
  EXPERIENCE: "Experiência",
};

// Evenly spaced around a circle, starting at the top, clockwise — matches
// the order the API already returns.
const NODE_COUNT = 8;
const RADIUS_PERCENT = 38;

function nodePosition(index: number): { xPercent: number; yPercent: number } {
  const angle = (index / NODE_COUNT) * 2 * Math.PI - Math.PI / 2;
  return {
    xPercent: 50 + RADIUS_PERCENT * Math.cos(angle),
    yPercent: 50 + RADIUS_PERCENT * Math.sin(angle),
  };
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap", marginTop: spacing.xs }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            padding: `2px ${spacing.sm}`,
            borderRadius: 9999,
            border: `1px solid ${colors.border}`,
            fontSize: "0.75rem",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function NodeCard({ node, index, mounted }: { node: EventCanvasNode; index: number; mounted: boolean }) {
  const { xPercent, yPercent } = nodePosition(index);
  return (
    <div
      style={{
        position: "absolute",
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: mounted ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.85)",
        opacity: mounted ? 1 : 0,
        transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms`,
        width: 190,
        animation: mounted ? "eve-canvas-breathe 6s ease-in-out infinite" : undefined,
        animationDelay: `${index * 300}ms`,
      }}
    >
      <Card style={{ opacity: node.hasData ? 1 : 0.6 }}>
        <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", color: colors.textMuted }}>
          {NODE_LABELS[node.category]}
        </p>
        {node.summary && <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "0.9rem" }}>{node.summary}</p>}
        {!node.hasData && (
          <p style={{ margin: `${spacing.xs} 0 0`, fontSize: "0.85rem", color: colors.textMuted }}>
            Ainda sem cadastro para este evento.
          </p>
        )}
        <ChipList items={node.items} />
      </Card>
    </div>
  );
}

function CanvasGraph({ canvas, eventLabel }: { canvas: EventCanvas; eventLabel: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 640 }}>
      <style>{`
        @keyframes eve-canvas-breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.02); }
        }
      `}</style>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        {canvas.nodes.map((node, index) => {
          const { xPercent, yPercent } = nodePosition(index);
          return (
            <line
              key={node.category}
              x1="50%"
              y1="50%"
              x2={`${xPercent}%`}
              y2={`${yPercent}%`}
              stroke={colors.border}
              strokeWidth={1}
              style={{ opacity: mounted ? 1 : 0, transition: `opacity 0.6s ease ${index * 60}ms` }}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 160,
          textAlign: "center",
          padding: spacing.md,
          borderRadius: radii.full,
          border: `1px solid ${colors.primary}`,
          background: colors.surface,
        }}
      >
        <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", color: colors.textMuted }}>
          Evento
        </p>
        <p style={{ margin: `${spacing.xs} 0 0`, fontWeight: 600 }}>{eventLabel}</p>
      </div>

      {canvas.nodes.map((node, index) => (
        <NodeCard key={node.category} node={node} index={index} mounted={mounted} />
      ))}
    </div>
  );
}

function CanvasContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { project, error: projectError } = useProject(eventId);
  const [canvas, setCanvas] = useState<EventCanvas | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<EventCanvas>(`/projects/${eventId}/canvas`, accessToken)
      .then(setCanvas)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos montar o Canvas do Evento."));
  }, [accessToken, eventId]);

  if (projectError || error) return <p style={{ color: colors.danger }}>{projectError ?? error}</p>;
  if (project === undefined || canvas === undefined) {
    return <p style={{ color: colors.textMuted }}>Montando o Canvas do Evento...</p>;
  }
  if (project === null) return <p style={{ color: colors.danger }}>Projeto não encontrado.</p>;
  if (canvas === null) return <p style={{ color: colors.danger }}>Canvas não encontrado.</p>;

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1>Canvas do Evento</h1>
      {!canvas.hasDiagnostico && (
        <p style={{ color: colors.textMuted }}>
          Ainda não há um diagnóstico para este projeto — os nós de Flores, Mobiliário, Luz e Experiência mostram o
          catálogo geral até lá.{" "}
          <Link href={`/projects/${eventId}/diagnostico`}>Gerar diagnóstico</Link>.
        </p>
      )}
      <CanvasGraph canvas={canvas} eventLabel={project.clientNames} />
    </>
  );
}

export default function CanvasPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <CanvasContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
