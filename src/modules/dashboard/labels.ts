interface ActivityLike {
  action: string;
  metadata: unknown;
  user: { name: string | null; email: string } | null;
}

export function describeActivity(activity: ActivityLike): string {
  const actorName = activity.user?.name ?? activity.user?.email ?? "Alguém";
  const metadata = (activity.metadata ?? {}) as Record<string, unknown>;

  switch (activity.action) {
    case "event.created":
      return `${actorName} criou o evento "${metadata.name ?? ""}"`;
    case "document.generated":
      return `${actorName} gerou ${metadata.documentType ?? "um documento"} para "${metadata.eventName ?? ""}"`;
    case "member.invited":
      return `${actorName} convidou ${metadata.email ?? "um novo membro"}`;
    case "interview.completed":
      return `${actorName} concluiu a entrevista de "${metadata.eventName ?? ""}"`;
    default:
      return `${actorName}: ${activity.action}`;
  }
}
