import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api';
import { VOUCHER_OPERATOR_ID, VOUCHER_OPERATOR_NAME } from '@/data';
import type { ApiOperator } from '@/types/airtime';

export async function getVoucherOperatorName(signal?: AbortSignal): Promise<string> {
  try {
    const response = await apiClient.get<unknown>(API_ENDPOINTS.airtime.operatorById(VOUCHER_OPERATOR_ID), {
      signal,
    });
    const operator = (Array.isArray(response) ? response[0] : response) as Partial<ApiOperator> | null;
    return operator?.name || VOUCHER_OPERATOR_NAME;
  } catch (error) {
    if (signal?.aborted) throw error;
    return VOUCHER_OPERATOR_NAME;
  }
}