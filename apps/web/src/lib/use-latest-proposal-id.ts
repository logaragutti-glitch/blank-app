"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "./api-client";
import { useAuth } from "./auth-context";
import type { Proposal } from "./api-types";

export function useLatestProposalId(eventId: string) {
  const { accessToken } = useAuth();
  const [proposalId, setProposalId] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Proposal[]>(`/creative/${eventId}/proposals`, accessToken)
      .then((proposals) => setProposalId(proposals[0]?.id ?? null))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar a proposta."));
  }, [accessToken, eventId]);

  return { proposalId, error };
}
