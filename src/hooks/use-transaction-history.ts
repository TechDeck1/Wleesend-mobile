import { useCallback, useEffect, useState } from 'react';

import type { SendKind } from '@/data';
import { getTransactionHistory, TRANSACTIONS_PAGE_SIZE } from '@/services/transactionService';
import type { Transaction } from '@/store';
import type { ApiTransaction, TransactionTotals } from '@/types/transactions';

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
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Isolated so it is the only place that depends on the store's Transaction/Draft shape.
// TODO: replace the cast with the real Draft type from src/store.tsx, and make sure
// brandOf() and resend() understand operatorId/productId/meterNumber.
const toTransaction = (r: ApiTransaction): Transaction =>
  ({
    id: r.id,
    kind: r.kind,
    product: r.product,
    provider: r.provider,
    receiver: r.receiver,
    date: formatDate(r.createdAt),
    total: r.total,
    draft: r.draft,
  }) as unknown as Transaction;

const messageOf = (e: unknown) => (e instanceof Error ? e.message : 'Could not load transactions.');

export function useTransactionHistory(filter: Filter) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // First page for the current filter. State is only set inside the promise callbacks,
  // never synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;

    getTransactionHistory(filter, 1, TRANSACTIONS_PAGE_SIZE)
      .then((res) => {
        console.log("response of transaction history" , res);
        if (cancelled) return;
        setFailure(null);
        setLoaded({
          filter,
          page: 1,
          rows: res.data.map(toTransaction),
          totals: res.totals,
          totalCount: res.totalCount,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setFailure({ filter, message: messageOf(e) });
      });

    return () => {
      cancelled = true;
    };
  }, [filter, reloadKey]);

  // Anything stored for a different filter is ignored, so old rows never flash after a filter change.
  const current = loaded && loaded.filter === filter ? loaded : null;
  const error = failure && failure.filter === filter ? failure.message : null;
  const rows = current ? current.rows : [];
  const totalCount = current ? current.totalCount : 0;

  const refresh = useCallback(() => {
    setFailure(null);
    setReloadKey((k) => k + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (!current || loadingMore || current.rows.length >= current.totalCount) return;
    const nextPage = current.page + 1;
    setLoadingMore(true);
    setFailure(null);
    try {
      const res = await getTransactionHistory(filter, nextPage, TRANSACTIONS_PAGE_SIZE);
      const more = res.data.map(toTransaction);
      // Apply only if the list is still the one this request was made for.
      setLoaded((prev) =>
        prev && prev.filter === filter && prev.page === nextPage - 1
          ? { ...prev, page: nextPage, rows: [...prev.rows, ...more], totals: res.totals, totalCount: res.totalCount }
          : prev,
      );
    } catch (e) {
      setFailure({ filter, message: messageOf(e) });
    } finally {
      setLoadingMore(false);
    }
  }, [current, filter, loadingMore]);

  const initialLoading = !current && !error;

  return {
    rows,
    totals: current ? current.totals : EMPTY_TOTALS,
    loading: initialLoading || loadingMore,
    error,
    hasMore: rows.length < totalCount,
    refresh,
    loadMore,
  };
}