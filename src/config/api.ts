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

  transactions: {
    mobileHistory: `${API_BASE_URL}/WleeTransaction/mobile/transactions`,
  },

  account: {
    sendDualEmailOtp: `${API_BASE_URL}/account/send-dual-email-otp`,
    verifyDualEmailOtp: `${API_BASE_URL}/account/verify-dual-email-otp`,
    resetPassword: `${API_BASE_URL}/WleeUserAcccount/reset-pin`
  },

  airtime: {
    operators: `${API_BASE_URL}/Product/operators`,
    operatorProducts: (operatorId: number | string) => `${API_BASE_URL}/Product/operators/${operatorId}/products`,
    operatorById: (operatorId: number | string) => `${API_BASE_URL}/Product/operators/${operatorId}`,
  },

  products: `${BASE_URL}/products`,
  orders: `${BASE_URL}/orders`,
  payments: `${BASE_URL}/payments`,
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
