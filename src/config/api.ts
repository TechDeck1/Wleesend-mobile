export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://porsche-retrorse-unblenchingly.ngrok-free.dev').replace(/\/+$/, '');
export const API_BASE_URL = `${BASE_URL}/api`;

export const WEBSITE_URL = 'https://www.wleesend.com';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/WleeUserAcccount/login`,
    signUp: `${API_BASE_URL}/Account/Mobile-Registration`,
    resendVerificationEmail: `${API_BASE_URL}/Account/resend-verification-email`,
    logout: `${BASE_URL}/auth/logout`,
    forgotPassword: `${BASE_URL}/auth/forgot-password`,
    changeEmail: `${BASE_URL}/auth/change-email`,
  },

  products: `${BASE_URL}/products`,
  orders: `${BASE_URL}/orders`,
  payments: `${BASE_URL}/payments`,
  transactions: `${BASE_URL}/transactions`,
} as const;

export function getApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!BASE_URL) {
    throw new Error('Set EXPO_PUBLIC_API_URL before making API requests.');
  }

  return new URL(path.replace(/^\/+/, ''), `${BASE_URL}/`).toString();
}
