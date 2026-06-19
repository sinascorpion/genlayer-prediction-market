/**
 * TypeScript types for GenLayer AI Prediction Market
 */

export interface Market {
  id: string;
  creator: string;
  question: string;
  resolution_url: string;
  resolved: boolean;
  outcome: string;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}
