import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api'; // use your file's real export name
import type { SendKind } from '@/data';
import type { ApiTransactionDraft, TransactionHistoryResponse } from '@/types/transactions';
import type { ComponentProps } from 'react';
import type { BrandLogo } from '@/components/brand-logo';

export const TRANSACTIONS_PAGE_SIZE = 20;
type Brand = ComponentProps<typeof BrandLogo>['brand'];

const BRAND_BY_OPERATOR: Record<string, Brand> = {
  '2470': 'lec', // electricity ('lec' is the only brand id I can see in your code)
  '10': 'airtime',   // airtime operator
  '151': 'airtime-1',  // airtime operator
  '2482': 'voucher', // gift vouchers
};

export function brandForDraft(draft: ApiTransactionDraft): Brand | undefined {
  return draft.operatorId ? BRAND_BY_OPERATOR[draft.operatorId] : undefined;
}

export function getTransactionHistory(
  kind: 'all' | SendKind,
  page: number,
  pageSize: number = TRANSACTIONS_PAGE_SIZE,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (kind !== 'all') params.set('kind', kind);

  return apiClient.get<TransactionHistoryResponse>(
    `${API_ENDPOINTS.transactions.mobileHistory}?${params.toString()}`,
  );
}