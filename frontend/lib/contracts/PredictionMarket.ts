import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Market, TransactionReceipt } from "./types";
import {
  estimateWriteFeePreset,
  feePresetToTransactionFees,
  type FeePresetEstimate,
  type FeePresetLevel,
} from "../genlayer/fees";

export class PredictionMarket {
  private contractAddress: `0x${string}`;
  private client: any;
  private studioUrl?: string;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;
    this.studioUrl = studioUrl;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };

    if (this.studioUrl) {
      config.endpoint = this.studioUrl;
    }

    this.client = createClient(config);
  }

  async estimateCreateMarketFees(
    question: string,
    resolutionUrl: string,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return estimateWriteFeePreset(
      this.client,
      {
        address: this.contractAddress,
        functionName: "create_market",
        args: [question, resolutionUrl],
      },
      level,
    );
  }

  async estimateResolveMarketFees(
    marketId: string,
    level: FeePresetLevel = "standard"
  ): Promise<FeePresetEstimate | undefined> {
    return estimateWriteFeePreset(
      this.client,
      {
        address: this.contractAddress,
        functionName: "resolve_market",
        args: [marketId],
      },
      level,
    );
  }

  async getMarkets(): Promise<Market[]> {
    try {
      const markets: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_all_markets",
        args: [],
      });

      if (markets instanceof Map) {
        return Array.from(markets.entries()).map(([id, marketData]: any) => {
          const marketObj = Array.from((marketData as any).entries()).reduce(
            (obj: any, [key, value]: any) => {
              obj[key] = value;
              return obj;
            },
            {} as Record<string, any>
          ) as Record<string, any>;

          return { ...marketObj, id } as Market;
        });
      }

      return [];
    } catch (error) {
      console.error("Error fetching markets:", error);
      throw new Error("Failed to fetch markets from contract");
    }
  }

  async createMarket(
    question: string,
    resolutionUrl: string,
    feePreset?: FeePresetEstimate
  ): Promise<TransactionReceipt> {
    try {
      const fees = feePresetToTransactionFees(feePreset);
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_market",
        args: [question, resolutionUrl],
        value: BigInt(0),
        ...(fees ? { fees } : {}),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error creating market:", error);
      throw new Error("Failed to create market");
    }
  }

  async resolveMarket(marketId: string): Promise<TransactionReceipt> {
    try {
      const feePreset = await this.estimateResolveMarketFees(marketId);
      const fees = feePresetToTransactionFees(feePreset);
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "resolve_market",
        args: [marketId],
        value: BigInt(0),
        ...(fees ? { fees } : {}),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error resolving market:", error);
      throw new Error("Failed to resolve market");
    }
  }
}
