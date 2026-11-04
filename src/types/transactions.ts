import type { SendKind } from '@/data';

export type ApiTransactionDraft = {
  kind: SendKind;
  operatorId: string | null;
  productId: string | null;
  receiverPhone: string | null;
  meterNumber: string | null;
  amount: number; 
};

export type ApiTransaction = {
  id: string;
  kind: SendKind;
  product: string;
  provider: string;
  receiver: string;
  createdAt: string; 
  total: number; 
  fee: number;
  draft: ApiTransactionDraft;
};

export type TransactionTotals = Record<SendKind, number>;

export type TransactionHistoryResponse = {
  totalCount: number;
  totals: TransactionTotals;
  data: ApiTransaction[];
};