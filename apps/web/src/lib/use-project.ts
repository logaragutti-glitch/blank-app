"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "./api-client";
import { useAuth } from "./auth-context";
import type { ProjectOverview } from "./api-types";

/**
 * Detail screens use the enriched overview endpoint so the project hub and
 * its sub-pages share one read model with workflow, commercial and production state.
 */
export function useProject(eventId: string) {
  const { accessToken } = useAuth();
  const [project, setProject] = useState<ProjectOverview | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectOverview>(`/projects/${eventId}/overview`, accessToken)
      .then(setProject)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar o projeto."));
  }, [accessToken, eventId]);

  return { project, error };
}
