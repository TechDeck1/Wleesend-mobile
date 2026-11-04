import { AddressCollectionMode, CollectionMode, useStripe } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import { useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/api';
import { createRechargePaymentIntent } from '@/services/checkoutService';
import { buildOrder, useStore } from '@/store';

export function usePaymentFlow() {
  const { draft, setLastOrder, user } = useStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const order = buildOrder(draft);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');
    try {
      if (!/^pk_(test|live)_/.test(STRIPE_PUBLISHABLE_KEY)) {
        throw new Error(
          'Secure payment is not configured. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to your Stripe publishable key, then rebuild the app.',
        );
      }

      console.log('stripe api key', STRIPE_PUBLISHABLE_KEY);
      const intent = await createRechargePaymentIntent(draft, order);
      const initialized = await initPaymentSheet({
        merchantDisplayName: 'Wleesend',
        paymentIntentClientSecret: intent.clientSecret,
        allowsDelayedPaymentMethods: false,
        returnURL: 'wleesend://stripe-redirect',
        defaultBillingDetails: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim(),
          email: user?.email ?? undefined,
          phone: user?.phone ?? undefined,
        },
        billingDetailsCollectionConfiguration: {
          name: CollectionMode.ALWAYS,
          address: AddressCollectionMode.FULL,
          attachDefaultsToPaymentMethod: true,
        },
      });
      if (initialized.error) throw new Error(initialized.error.message);
      const presented = await presentPaymentSheet();
      if (presented.error) {
        if (presented.error.code !== 'Canceled') throw new Error(presented.error.message);
        return;
      }

      setLastOrder(order);
      router.replace(ROUTES.SEND_SENT);
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : 'Could not start secure checkout. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return { order, isProcessing, error, handlePayment };
}
