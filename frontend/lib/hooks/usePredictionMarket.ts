"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PredictionMarket } from "../contracts/PredictionMarket";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import type { FeePresetLevel } from "../genlayer/fees";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Market } from "../contracts/types";

export function usePredictionMarketContract(): PredictionMarket | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
      );
      return null;
    }

    return new PredictionMarket(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

export function useMarkets() {
  const contract = usePredictionMarketContract();

  return useQuery<Market[], Error>({
    queryKey: ["markets"],
    queryFn: () => {
      if (!contract) return Promise.resolve([]);
      return contract.getMarkets();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useCreateMarket() {
  const contract = usePredictionMarketContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      question,
      resolutionUrl,
      feePresetLevel,
    }: {
      question: string;
      resolutionUrl: string;
      feePresetLevel?: FeePresetLevel;
    }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsCreating(true);
      const feePreset = await contract.estimateCreateMarketFees(
        question,
        resolutionUrl,
        feePresetLevel ?? "standard"
      );
      return contract.createMarket(question, resolutionUrl, feePreset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      setIsCreating(false);
      success("Market created successfully!");
    },
    onError: (err: any) => {
      setIsCreating(false);
      error("Failed to create market", { description: err?.message });
    },
  });

  return {
    ...mutation,
    isCreating,
    createMarket: mutation.mutate,
    createMarketAsync: mutation.mutateAsync,
  };
}

export function useResolveMarket() {
  const contract = usePredictionMarketContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingMarketId, setResolvingMarketId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (marketId: string) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      setIsResolving(true);
      setResolvingMarketId(marketId);
      return contract.resolveMarket(marketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      setIsResolving(false);
      setResolvingMarketId(null);
      success("Market resolved successfully!");
    },
    onError: (err: any) => {
      setIsResolving(false);
      setResolvingMarketId(null);
      error("Failed to resolve market", { description: err?.message });
    },
  });

  return {
    ...mutation,
    isResolving,
    resolvingMarketId,
    resolveMarket: mutation.mutate,
    resolveMarketAsync: mutation.mutateAsync,
  };
}
