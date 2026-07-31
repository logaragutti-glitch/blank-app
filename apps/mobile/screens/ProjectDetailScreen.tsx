import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiClient, ApiError } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import type { ProductionPlan, ProjectSummary } from "../lib/api-types";
import { colors, spacing } from "../lib/tokens";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function ProjectDetailScreen({
  project,
  onBack,
}: {
  project: ProjectSummary;
  onBack: () => void;
}) {
  const { accessToken } = useAuth();
  const [plan, setPlan] = useState<ProductionPlan | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const proposalId = project.latestProposal?.id;
    if (!proposalId || project.latestProposal?.status !== "APPROVED") {
      setPlan(null);
      return;
    }
    apiClient
      .get<ProductionPlan>(`/production/proposals/${proposalId}/plan`, accessToken)
      .then(setPlan)
      .catch((err) => {
        // No plan generated yet is an expected state, not an error to surface.
        if (err instanceof ApiError && err.status === 400) {
          setPlan(null);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Não conseguimos carregar o plano de produção.");
      });
  }, [accessToken, project]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>{"< Voltar aos projetos"}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{project.clientNames}</Text>
      <Text style={styles.subtitle}>{project.venueName ?? "Sem espaço definido"}</Text>
      {project.guestsExpected != null && (
        <Text style={styles.subtitle}>{project.guestsExpected} convidados esperados</Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {plan === undefined && project.latestProposal?.status === "APPROVED" && (
        <ActivityIndicator color={colors.primary} />
      )}

      {plan === null && project.latestProposal?.status !== "APPROVED" && (
        <Text style={styles.notice}>
          Essa proposta ainda não foi aprovada pelo cliente — o plano de produção só existe depois da aprovação
          (pelo apps/web).
        </Text>
      )}

      {plan === null && project.latestProposal?.status === "APPROVED" && (
        <Text style={styles.notice}>
          Ainda não geramos o plano de produção deste projeto — peça para alguém gerar pelo apps/web.
        </Text>
      )}

      {plan && (
        <>
          <Section title="Lista de materiais">
            {plan.materialsList.length === 0 ? (
              <Text style={styles.empty}>—</Text>
            ) : (
              plan.materialsList.map((item) => (
                <View key={item.name} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {item.name} — {item.quantity}
                  </Text>
                  {item.notes && <Text style={styles.itemDescription}>{item.notes}</Text>}
                </View>
              ))
            )}
          </Section>

          <Section title="Cronograma de montagem">
            {plan.setupSchedule.length === 0 ? (
              <Text style={styles.empty}>—</Text>
            ) : (
              plan.setupSchedule.map((step) => (
                <View key={step.label} style={styles.item}>
                  <Text style={styles.itemTitle}>{step.label}</Text>
                  <Text style={styles.itemDescription}>
                    {step.timing} · {step.durationEstimate}
                  </Text>
                  <Text style={styles.itemDescription}>{step.description}</Text>
                </View>
              ))
            )}
          </Section>

          <Section title="Checklist operacional">
            {plan.checklist.length === 0 ? (
              <Text style={styles.empty}>—</Text>
            ) : (
              plan.checklist.map((item) => (
                <View key={item.label} style={styles.item}>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <Text style={styles.itemTitle}>{item.label}</Text>
                  {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                </View>
              ))
            )}
          </Section>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  back: {
    color: colors.textMuted,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
  },
  notice: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  item: {
    marginBottom: spacing.sm,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  itemDescription: {
    color: colors.textMuted,
  },
  itemCategory: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  empty: {
    color: colors.textMuted,
  },
});
