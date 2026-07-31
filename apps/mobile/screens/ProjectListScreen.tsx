import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import type { ProjectSummary } from "../lib/api-types";
import { colors, spacing } from "../lib/tokens";

function formatCeremonyDateTime(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ProjectListScreen({ onSelectProject }: { onSelectProject: (project: ProjectSummary) => void }) {
  const { accessToken, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ProjectSummary[]>("/projects", accessToken)
      .then(setProjects)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar os projetos."));
  }, [accessToken]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projetos</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Sair</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {projects === undefined && !error && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
      {projects && (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.eventId}
          contentContainerStyle={{ gap: spacing.sm }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum projeto ainda.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => onSelectProject(item)}>
              <Text style={styles.cardTitle}>{item.clientNames}</Text>
              <Text style={styles.cardSubtitle}>{item.venueName ?? "Sem espaço definido"}</Text>
              {formatCeremonyDateTime(item.ceremonyDateTime) && (
                <Text style={styles.cardSubtitle}>{formatCeremonyDateTime(item.ceremonyDateTime)}</Text>
              )}
            </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  logout: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  cardSubtitle: {
    color: colors.textMuted,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  error: {
    color: colors.danger,
  },
});
