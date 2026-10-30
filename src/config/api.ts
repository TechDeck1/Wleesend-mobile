export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export const WEBSITE_URL = 'https://www.wleesend.com';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signUp: '/auth/signup',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    changeEmail: '/auth/change-email',
  },
  products: '/products',
  orders: '/orders',
  payments: '/payments',
  transactions: '/transactions',
} as const;

export function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('Set EXPO_PUBLIC_API_URL before making API requests.');
  }

  return new URL(path.replace(/^\/+/, ''), `${API_BASE_URL}/`).toString();
}
