import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/config/api';
import { COUNTRY_ID, RANGE_PRICE_TYPE } from '@/data';
import type { AirtimeOperator, AirtimeProduct, ApiOperator, ApiProduct } from '@/types/airtime';

const isRangePriceType = (priceType: ApiProduct['priceType']) =>
  priceType !== null && priceType !== undefined && String(priceType).toLowerCase() === String(RANGE_PRICE_TYPE).toLowerCase();

function toProduct(item: ApiProduct): AirtimeProduct {
  const isRange = isRangePriceType(item.priceType);
  return {
    id: Number(item.sochitelProductId),
    name: item.name,
    stripeProductId: item.stripeProductId ?? null,
    isRange,
    price: isRange ? null : (item.price ?? null),
    min: item.priceMin ?? 0,
    max: item.priceMax ?? 0,
  };
}

/** Operators for Liberia only. Rejects when the request fails or the response isn't a list. */
export async function getOperators(signal?: AbortSignal): Promise<AirtimeOperator[]> {
  const response = await apiClient.get<unknown>(API_ENDPOINTS.airtime.operators, { signal });
  if (!Array.isArray(response)) {
    throw new Error('Unexpected operators response from the server.');
  }

  return (response as ApiOperator[])
    .filter((item) => item.countryId === COUNTRY_ID)
    .map((item) => ({ id: Number(item.sochitelId), name: item.name }));
}

/** Products for one operator. Rejects when the request fails or the response isn't a list. */
export async function getOperatorProducts(operatorId: number, signal?: AbortSignal): Promise<AirtimeProduct[]> {
  const response = await apiClient.get<unknown>(API_ENDPOINTS.airtime.operatorProducts(operatorId), { signal });
  if (!Array.isArray(response)) {
    throw new Error('Unexpected products response from the server.');
  }
  return (response as ApiProduct[]).map(toProduct);
}
