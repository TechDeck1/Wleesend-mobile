export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const API_BASE_URL = `${BASE_URL}/api`;
export const WEBSITE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL ?? '';
export const STRIPE_PUBLISHABLE_KEY = (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '').trim();

const apiEndpoint = (path: string) => `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
const webEndpoint = (path: string) => `${BASE_URL}/${path.replace(/^\/+/, '')}`;



export const API_ENDPOINTS = {
  auth: {
    login: apiEndpoint('WleeUserAcccount/login'),
    signUp: apiEndpoint('Account/Mobile-Registration'),
    resendVerificationEmail: apiEndpoint('Account/resend-verification-email'),
    logout: webEndpoint('auth/logout'),
    forgotPassword: webEndpoint('auth/forgot-password'),
    changeEmail: webEndpoint('auth/change-email'),
  },

  transactions: {
    mobileHistory: apiEndpoint('WleeTransaction/mobile/transactions'),
  },

  account: {
    forgotPin: apiEndpoint('WleeUserAcccount/forgot-pin'),
    sendDualEmailOtp: apiEndpoint('account/send-dual-email-otp'),
    verifyDualEmailOtp: apiEndpoint('account/verify-dual-email-otp'),
    resetPassword: apiEndpoint('WleeUserAcccount/reset-pin')
  },

  airtime: {
    operators: apiEndpoint('Product/operators'),
    operatorProducts: (operatorId: number | string) => apiEndpoint(`Product/operators/${operatorId}/products`),
    operatorById: (operatorId: number | string) => apiEndpoint(`Product/operators/${operatorId}`),
  },

  products: webEndpoint('products'),
  orders: webEndpoint('orders'),
  payments: {
    mobilePaymentIntent: apiEndpoint('Stripe/createMobilePaymentIntent'),
  },
} as const;
