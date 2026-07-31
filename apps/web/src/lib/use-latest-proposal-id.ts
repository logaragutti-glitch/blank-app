"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "./api-client";
import { useAuth } from "./auth-context";
import type { Proposal, ProposalStatus } from "./api-types";

export function useLatestProposalId(eventId: string) {
  const { accessToken } = useAuth();
  const [proposalId, setProposalId] = useState<string | null | undefined>(undefined);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<Proposal[]>(`/creative/${eventId}/proposals`, accessToken)
      .then((proposals) => {
        setProposalId(proposals[0]?.id ?? null);
        setProposalStatus(proposals[0]?.status);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Não conseguimos carregar a proposta."));
  }, [accessToken, eventId]);

  return { proposalId, proposalStatus, error };
}
