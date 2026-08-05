import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import type { ProjectSummary, ProjectTask, ProjectTaskStatus } from "../lib/api-types";
import { colors, spacing } from "../lib/tokens";

const STATUS_LABEL: Record<ProjectTaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

const STATUS_COLOR: Record<ProjectTaskStatus, string> = {
  TODO: colors.textMuted,
  IN_PROGRESS: colors.primary,
  DONE: colors.primary,
};

function formatDueDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

// Read-only on purpose — a field crew checking the checklist on-site
// doesn't need to edit it from here; editing already lives on apps/web
// (/projects/:eventId/tarefas). Reuses the same GET /events/:eventId/tasks
// the web Kanban view calls, no new backend needed.
export function ProjectTasksScreen({ project, onBack }: { project: ProjectSummary; onBack: () => void }) {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<ProjectTask[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ProjectTask[]>(`/events/${project.eventId}/tasks`, accessToken)
      .then(setTasks)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar as tarefas."));
  }, [accessToken, project.eventId]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>{"< Voltar ao projeto"}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Tarefas</Text>
      <Text style={styles.subtitle}>{project.clientNames}</Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {tasks === undefined && !error && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      )}
      {tasks && (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma tarefa cadastrada ainda.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={[styles.badge, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
              {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
              {formatDueDate(item.dueDate) && (
                <Text style={styles.cardDueDate}>Prazo: {formatDueDate(item.dueDate)}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  back: {
    color: colors.textMuted,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
    flexShrink: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  cardDescription: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardDueDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
