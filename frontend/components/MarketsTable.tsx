"use client";

import { Loader2, Trophy, Clock, AlertCircle } from "lucide-react";
import { useMarkets, useResolveMarket, usePredictionMarketContract } from "@/lib/hooks/usePredictionMarket";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Market } from "@/lib/contracts/types";

export function MarketsTable() {
  const contract = usePredictionMarketContract();
  const { data: markets, isLoading, isError } = useMarkets();
  const { address, isConnected, isLoading: isWalletLoading } = useWallet();
  const { resolveMarket, isResolving, resolvingMarketId } = useResolveMarket();

  const handleResolve = (marketId: string) => {
    if (!address) {
      error("Please connect your wallet to resolve markets");
      return;
    }

    const confirmed = confirm("Are you sure you want to resolve this market? GenLayer AI will fetch the URL and determine the outcome.");

    if (confirmed) {
      resolveMarket(marketId);
    }
  };

  if (isLoading) {
    return (
      <div className="brand-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading markets...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 opacity-60" />
          <h3 className="text-xl font-bold">Setup Required</h3>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Contract address not configured.
            </p>
            <p className="text-sm text-muted-foreground">
              Please set <code className="bg-muted px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in your .env file.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-8">
        <div className="text-center">
          <p className="text-destructive">Failed to load markets. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-3">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h3 className="text-xl font-bold">No Markets Yet</h3>
          <p className="text-muted-foreground">
            Be the first to create an AI Prediction Market!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-card p-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Creator
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {markets.map((market) => (
              <MarketRow
                key={market.id}
                market={market}
                currentAddress={address}
                isConnected={isConnected}
                isWalletLoading={isWalletLoading}
                onResolve={handleResolve}
                isResolving={isResolving && resolvingMarketId === market.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MarketRowProps {
  market: Market;
  currentAddress: string | null;
  isConnected: boolean;
  isWalletLoading: boolean;
  onResolve: (marketId: string) => void;
  isResolving: boolean;
}

function MarketRow({ market, currentAddress, isConnected, isWalletLoading, onResolve, isResolving }: MarketRowProps) {
  const isOwner = currentAddress?.toLowerCase() === market.creator?.toLowerCase();
  const canResolve = isConnected && currentAddress && isOwner && !market.resolved && !isWalletLoading;

  return (
    <tr className="group hover:bg-white/5 transition-colors animate-fade-in">
      <td className="px-4 py-4 max-w-[200px] truncate">
        <span className="text-sm font-semibold">{market.question}</span>
      </td>
      <td className="px-4 py-4 max-w-[150px] truncate">
        <a href={market.resolution_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
          {new URL(market.resolution_url).hostname}
        </a>
      </td>
      <td className="px-4 py-4">
        {market.resolved ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Resolved
            </Badge>
            <span className="text-xs font-bold text-accent">
              {market.outcome}
            </span>
          </div>
        ) : (
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <AddressDisplay address={market.creator} maxLength={10} showCopy={true} />
          {isOwner && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        {canResolve && (
          <Button
            onClick={() => onResolve(market.id)}
            disabled={isResolving}
            size="sm"
            variant="gradient"
          >
            {isResolving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Resolving...
              </>
            ) : (
              "Resolve AI"
            )}
          </Button>
        )}
      </td>
    </tr>
  );
}
