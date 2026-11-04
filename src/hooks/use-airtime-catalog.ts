import { useCallback, useEffect, useState } from 'react';

import { getOperatorProducts, getOperators } from '@/services/airtime';
import type { AirtimeOperator, AirtimeProduct } from '@/types/airtime';

export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

type OperatorsState = {
  status: Exclude<CatalogStatus, 'idle'>;
  operators: AirtimeOperator[];
  error: string | null;
};
type ProductsState = {
  operatorId: number;
  attempt: number;
  status: 'ready' | 'error';
  products: AirtimeProduct[];
  error: string | null;
};

const messageOf = (prefix: string, error: unknown) =>
  `${prefix}${error instanceof Error && error.message ? error.message : 'Please try again.'}`;

/** Loads Liberia operators and selected operator products, cancelling stale requests. */
export function useAirtimeCatalog(operatorId: number | null) {
  const [operatorsState, setOperatorsState] = useState<OperatorsState>({
    status: 'loading',
    operators: [],
    error: null,
  });
  const [operatorsAttempt, setOperatorsAttempt] = useState(0);
  const [productsState, setProductsState] = useState<ProductsState | null>(null);
  const [productsAttempt, setProductsAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getOperators(controller.signal)
      .then((operators) => setOperatorsState({ status: 'ready', operators, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setOperatorsState({
          status: 'error',
          operators: [],
          error: messageOf('Could not load operators: ', error),
        });
      });
    return () => controller.abort();
  }, [operatorsAttempt]);

  useEffect(() => {
    if (operatorId === null) return;
    const controller = new AbortController();
    const attempt = productsAttempt;
    getOperatorProducts(operatorId, controller.signal)
      .then((products) =>
        setProductsState({
          operatorId,
          attempt,
          status: 'ready',
          products,
          error: null,
        }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setProductsState({
          operatorId,
          attempt,
          status: 'error',
          products: [],
          error: messageOf('Could not load products: ', error),
        });
      });
    return () => controller.abort();
  }, [operatorId, productsAttempt]);

  const reloadOperators = useCallback(() => {
    setOperatorsState((state) => ({
      ...state,
      status: 'loading',
      error: null,
    }));
    setOperatorsAttempt((currentAttempt) => currentAttempt + 1);
  }, []);
  const reloadProducts = useCallback(
    () => setProductsAttempt((currentAttempt) => currentAttempt + 1),
    [],
  );

  // Treat products from an earlier operator or retry as still loading.
  const current =
    operatorId !== null &&
    productsState?.operatorId === operatorId &&
    productsState.attempt === productsAttempt
      ? productsState
      : null;
  const productsStatus: CatalogStatus =
    operatorId === null ? 'idle' : (current?.status ?? 'loading');

  return {
    operators: operatorsState.operators,
    operatorsStatus: operatorsState.status as CatalogStatus,
    operatorsError: operatorsState.error,
    reloadOperators,
    products: current?.products ?? [],
    productsStatus,
    productsError: current?.error ?? null,
    reloadProducts,
  };
}
