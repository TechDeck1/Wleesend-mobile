import { apiClient } from '@/api/client';
import { API_ENDPOINTS, STRIPE_PUBLISHABLE_KEY } from '@/config/api';
import {
  LEC_OPERATOR_ID,
  LEC_PRODUCT_ID,
  RECHARGE_COMMAND,
  TRANSFER_TYPE_ID,
  VOUCHER_OPERATOR_ID,
} from '@/data';
import type { Draft, Order } from '@/store';

type PaymentIntentResponse = {
  success: boolean;
  paymentIntentClientSecret?: string | null;
  paymentIntentId?: string | null;
  publishableKey?: string | null;
  message?: string | null;
};

export async function createRechargePaymentIntent(
  draft: Draft,
  order: Order,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  let payload: Record<string, string | number>;
  if (draft.kind === 'utility') {
    payload = {
      flow: 'lec',
      meterNumber: draft.meter.trim(),
      amount: draft.amount,
      phoneNumber: order.receiver,
      productId: String(LEC_PRODUCT_ID),
      operatorId: LEC_OPERATOR_ID,
      command: RECHARGE_COMMAND,
      transferTypeId: TRANSFER_TYPE_ID.utility,
    };
  } else {
    if (draft.kind === 'airtime' && draft.operatorId === null) {
      throw new Error('Select a mobile operator before checkout.');
    }
    const product = draft.kind === 'voucher' ? draft.voucherProduct : draft.product;
    if (!product?.stripeProductId) {
      throw new Error(
        'The selected package is missing its payment product reference. Please choose another package.',
      );
    }
    payload = {
      flow: draft.kind === 'voucher' ? 'voucher' : 'mobile',
      productId: String(product.id),
      stripeProductId: String(product.stripeProductId),
      ...(product.isRange ? { amount: order.total } : {}),
      ...(draft.kind === 'voucher' ? {} : { phoneNumber: order.receiver }),
      operator: String(draft.kind === 'voucher' ? VOUCHER_OPERATOR_ID : draft.operatorId),
      command: RECHARGE_COMMAND,
      transferTypeId:
        draft.kind === 'voucher' ? TRANSFER_TYPE_ID.voucher : TRANSFER_TYPE_ID.airtime,
    };
  }

  const response = await apiClient.post<PaymentIntentResponse>(
    API_ENDPOINTS.payments.mobilePaymentIntent,
    payload,
  );
  if (!response?.success || !response.paymentIntentClientSecret || !response.paymentIntentId) {
    throw new Error(response?.message || 'The payment service did not return payment details.');
  }
  if (response.publishableKey?.trim() !== STRIPE_PUBLISHABLE_KEY) {
    throw new Error(
      'The mobile app Stripe key does not match the payment server. Update EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and rebuild the app.',
    );
  }
  return {
    clientSecret: response.paymentIntentClientSecret,
    paymentIntentId: response.paymentIntentId,
  };
}
