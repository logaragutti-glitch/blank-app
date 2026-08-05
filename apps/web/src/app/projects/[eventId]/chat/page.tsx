"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input, colors, radii, spacing } from "@eve-os/ui";
import { AppShell } from "../../../../components/AppShell";
import { AuthGuard } from "../../../../lib/auth-guard";
import { apiClient, ApiError } from "../../../../lib/api-client";
import { useAuth } from "../../../../lib/auth-context";
import { useProject } from "../../../../lib/use-project";
import type { ChatMessage } from "../../../../lib/api-types";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "USER";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "75%",
          backgroundColor: isUser ? colors.primary : colors.surface,
          color: isUser ? "#FFFFFF" : colors.textPrimary,
          border: isUser ? "none" : `1px solid ${colors.border}`,
          borderRadius: radii.lg,
          padding: `${spacing.sm} ${spacing.md}`,
          whiteSpace: "pre-wrap",
        }}
      >
        {!isUser && <div style={{ fontSize: "0.75rem", color: colors.primary, marginBottom: 2 }}>✨ EVE</div>}
        {message.content}
      </div>
    </div>
  );
}

function ChatContent({ eventId }: { eventId: string }) {
  const { accessToken } = useAuth();
  const { project } = useProject(eventId);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ChatMessage[]>(`/events/${eventId}/chat/messages`, accessToken)
      .then(setMessages)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar a conversa."));
  }, [accessToken, eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setError(null);
    setInput("");
    setSending(true);
    try {
      const { userMessage, assistantMessage } = await apiClient.post<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>(`/events/${eventId}/chat/messages`, { content }, accessToken);
      setMessages((current) => [...(current ?? []), userMessage, assistantMessage]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "A EVE não conseguiu responder agora. Tente de novo.");
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <p style={{ color: colors.textMuted, marginBottom: spacing.xs }}>
        <Link href={`/projects/${eventId}`} style={{ color: colors.textMuted }}>
          ← Voltar ao projeto
        </Link>
      </p>
      <h1 style={{ marginBottom: spacing.xs }}>✨ Chat com a EVE</h1>
      <p style={{ color: colors.textMuted, marginTop: 0 }}>{project?.clientNames ?? ""}</p>
      <p style={{ color: colors.textMuted, fontSize: "0.85rem" }}>
        A EVE responde com base nos dados reais deste projeto. Ela ainda não pode criar tarefas ou alterar
        cadastros — só conversar.
      </p>

      <Card style={{ display: "flex", flexDirection: "column", gap: spacing.md, minHeight: 420 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, flex: 1, overflowY: "auto", maxHeight: 480 }}>
          {messages === null ? (
            <p style={{ color: colors.textMuted }}>Reunindo a conversa...</p>
          ) : messages.length === 0 ? (
            <p style={{ color: colors.textMuted }}>
              Pergunte à EVE sobre este projeto — status da proposta, tarefas pendentes, equipe, fornecedores...
            </p>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
          {sending && <p style={{ color: colors.textMuted, fontSize: "0.85rem" }}>EVE está digitando...</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: spacing.sm }}>
          <Input
            placeholder="Pergunte alguma coisa sobre este projeto..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            style={{ flex: 1 }}
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            Enviar
          </Button>
        </form>
        {error && <p style={{ color: colors.danger, margin: 0 }}>{error}</p>}
      </Card>
    </>
  );
}

export default function ChatPage({ params }: { params: { eventId: string } }) {
  return (
    <AuthGuard>
      <AppShell>
        <ChatContent eventId={params.eventId} />
      </AppShell>
    </AuthGuard>
  );
}
