import { withTenant } from "@/lib/tenant";

export async function getDashboardData(organizationId: string) {
  return withTenant(organizationId, async (tx) => {
    const [activeEvents, memScores, pendingChecklist, checklistPreview, recentActivity, recentEvents] =
      await Promise.all([
        tx.event.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
        tx.memScore.findMany({ where: { event: { organizationId } }, select: { score: true } }),
        tx.checklistItem.count({ where: { done: false, event: { organizationId } } }),
        tx.checklistItem.findMany({
          where: { done: false, event: { organizationId } },
          orderBy: { createdAt: "asc" },
          take: 5,
          include: { event: { select: { name: true } } },
        }),
        tx.activity.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { user: { select: { name: true, email: true } } },
        }),
        tx.event.findMany({
          where: { organizationId, status: { not: "ARCHIVED" } },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { memScore: { select: { score: true } } },
        }),
      ]);

    const memScoreAverage =
      memScores.length > 0
        ? Math.round(memScores.reduce((sum, m) => sum + m.score, 0) / memScores.length)
        : null;

    return {
      activeEvents,
      memScoreAverage,
      pendingChecklist,
      checklistPreview,
      recentActivity,
      recentEvents,
    };
  });
}
