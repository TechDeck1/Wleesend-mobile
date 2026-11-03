import { useCallback, useEffect, useState } from 'react';

import { VOUCHER_OPERATOR_ID, VOUCHER_OPERATOR_NAME } from '@/data';
import { getOperatorProducts } from '@/services/airtime';
import { getVoucherOperatorName } from '@/services/voucher';
import type { AirtimeProduct } from '@/types/airtime';

type State = {
  status: 'loading' | 'ready' | 'error';
  products: AirtimeProduct[];
  operatorName: string;
  error: string | null;
};

/** Loads the gift voucher operator name and its products. Pass `enabled=false` to skip the request. */
export function useVoucherCatalog(enabled: boolean) {
  const [state, setState] = useState<State>({
    status: 'loading',
    products: [],
    operatorName: VOUCHER_OPERATOR_NAME,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    Promise.all([
      getOperatorProducts(VOUCHER_OPERATOR_ID, controller.signal),
      getVoucherOperatorName(controller.signal),
    ])
      .then(([products, operatorName]) => setState({ status: 'ready', products, operatorName, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          products: [],
          operatorName: VOUCHER_OPERATOR_NAME,
          error: `Could not load vouchers: ${error instanceof Error && error.message ? error.message : 'Please try again.'}`,
        });
      });
    return () => controller.abort();
  }, [enabled, attempt]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, reload };
}