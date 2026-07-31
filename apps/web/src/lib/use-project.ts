"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "./api-client";
import { useAuth } from "./auth-context";
import type { ProjectSummary } from "./api-types";

/**
 * There's no GET /projects/:eventId — the list endpoint already carries
 * everything a project's screens need (client/venue names, latest
 * proposal), so screens just filter the list client-side instead of the
 * backend growing a near-duplicate single-item endpoint.
 */
export function useProject(eventId: string) {
  const { accessToken } = useAuth();
  const [project, setProject] = useState<ProjectSummary | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<ProjectSummary[]>("/projects", accessToken)
      .then((projects) => setProject(projects.find((p) => p.eventId === eventId) ?? null))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar o projeto."));
  }, [accessToken, eventId]);

  return { project, error };
}
