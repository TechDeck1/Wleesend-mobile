import { useCallback, useEffect, useRef, useState } from 'react';

import type { SendKind } from '@/data';
import { getTransactionHistory, TRANSACTIONS_PAGE_SIZE } from '@/services/transactionService';
import type { Draft, Transaction } from '@/store';
import type { ApiTransaction, TransactionTotals } from '@/types/transactions';
import { VOUCHER_VENDOR_ID } from '@/data';
import { digitsOnly, operatorForPhone } from '@/utils/airtime';
const EMPTY_TOTALS: TransactionTotals = { airtime: 0, utility: 0, voucher: 0 };

type Filter = 'all' | SendKind;

type Loaded = {
  filter: Filter;
  page: number;
  rows: Transaction[];
  totals: TransactionTotals;
  totalCount: number;
};

type Failure = { filter: Filter; message: string };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function draftFromApi(apiTransaction: ApiTransaction): Draft {
  const apiDraft = apiTransaction.draft ?? ({} as Partial<ApiTransaction['draft']>);
  const amount =
    Number(apiDraft.amount) ||
    Math.max(0, +(apiTransaction.total - (apiTransaction.fee ?? 0)).toFixed(2));

  const receiverDigits = digitsOnly(
    apiDraft.receiverPhone ?? (apiTransaction.kind === 'airtime' ? apiTransaction.receiver : ''),
  );
  const phone = receiverDigits.startsWith('231') ? receiverDigits.slice(3) : receiverDigits;

  const operatorId =
    apiDraft.operatorId != null && !Number.isNaN(Number(apiDraft.operatorId))
      ? Number(apiDraft.operatorId)
      : null;
  const productId =
    apiDraft.productId != null && !Number.isNaN(Number(apiDraft.productId))
      ? Number(apiDraft.productId)
      : null;

  const fixedProduct = {
    id: productId ?? 0,
    name: apiTransaction.product,
    stripeProductId: null,
    isRange: false,
    price: amount,
    min: 0,
    max: 0,
  };

  return {
    kind: apiTransaction.kind,
    operator: operatorForPhone(phone) ?? 'mtn',
    operatorId,
    operatorName: '',
    product: apiTransaction.kind === 'airtime' ? fixedProduct : null,
    topUp: '',
    phone,
    isPhoneEdited: false,
    meter: apiDraft.meterNumber ?? apiTransaction.receiver.replace(/^Meter\s*/i, ''),
    amount,
    vendor: VOUCHER_VENDOR_ID,
    voucherProduct: apiTransaction.kind === 'voucher' ? fixedProduct : null,
    voucherOperatorName: apiTransaction.kind === 'voucher' ? apiTransaction.provider : '',
  };
}

// TODO: Align API draft fields with Draft before removing this cast.
const toTransaction = (apiTransaction: ApiTransaction): Transaction =>
  ({
    id: apiTransaction.id,
    kind: apiTransaction.kind,
    product: apiTransaction.product,
    provider: apiTransaction.provider,
    receiver: apiTransaction.receiver,
    date: formatDate(apiTransaction.createdAt),
    total: apiTransaction.total,
    fee: apiTransaction.fee,
    draft: draftFromApi(apiTransaction),
  }) as unknown as Transaction;

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : 'Could not load transactions.';

export function useTransactionHistory(filter: Filter) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Keep state updates in async callbacks so the effect doesn't update state during setup.
  useEffect(() => {
    let cancelled = false;

    getTransactionHistory(filter, 1, TRANSACTIONS_PAGE_SIZE)
      .then((response) => {
        if (cancelled) return;
        setFailure(null);
        setLoaded({
          filter,
          page: 1,
          rows: response.data.map(toTransaction),
          totals: response.totals,
          totalCount: response.totalCount,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFailure({ filter, message: messageOf(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [filter, reloadKey]);

  // Ignore rows cached for another filter to avoid flashing stale results.
  const current = loaded && loaded.filter === filter ? loaded : null;
  const error = failure && failure.filter === filter ? failure.message : null;
  const rows = current ? current.rows : [];
  const totalCount = current ? current.totalCount : 0;

  const handleRefresh = useCallback(() => {
    setFailure(null);
    setReloadKey((currentKey) => currentKey + 1);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!current || isLoadingMoreRef.current || current.rows.length >= current.totalCount) return;
    const nextPage = current.page + 1;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setFailure(null);
    try {
      const response = await getTransactionHistory(filter, nextPage, TRANSACTIONS_PAGE_SIZE);
      const moreTransactions = response.data.map(toTransaction);
      // Ignore this response if the current page or filter changed while it was loading.
      setLoaded((prev) =>
        prev && prev.filter === filter && prev.page === nextPage - 1
          ? {
              ...prev,
              page: nextPage,
              rows: [...prev.rows, ...moreTransactions],
              totals: response.totals,
              totalCount: response.totalCount,
            }
          : prev,
      );
    } catch (error) {
      setFailure({ filter, message: messageOf(error) });
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [current, filter]);

  const isInitialLoading = !current && !error;

  return {
    rows,
    totals: current ? current.totals : EMPTY_TOTALS,
    isLoading: isInitialLoading || isLoadingMore,
    error,
    hasMore: rows.length < totalCount,
    handleRefresh,
    handleLoadMore,
  };
}
