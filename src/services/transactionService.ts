import { apiClient } from '@/api/client';
import type { Brand } from '@/types/components/BrandLogo.types';
import { API_ENDPOINTS } from '@/config/api';
import type { SendKind } from '@/data';
import type { TransactionHistoryResponse } from '@/types/transactions';
import { operatorForPhone } from '@/utils/airtime';

export const TRANSACTIONS_PAGE_SIZE = 20;

export function brandForTransaction(transaction: { kind: SendKind; receiver: string }): Brand {
  if (transaction.kind === 'utility') return 'lec';
  if (transaction.kind === 'voucher') return 'voucher';

  const digits = transaction.receiver.replace(/\D/g, '');
  const local = digits.startsWith('231') ? digits.slice(3) : digits;
  return operatorForPhone(local) ?? 'airtime';
}

export function getTransactionHistory(
  kind: 'all' | SendKind,
  page: number,
  pageSize: number = TRANSACTIONS_PAGE_SIZE,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (kind !== 'all') params.set('kind', kind);

  return apiClient.get<TransactionHistoryResponse>(
    `${API_ENDPOINTS.transactions.mobileHistory}?${params.toString()}`,
  );
}
