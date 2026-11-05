import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Brand } from '@/types/components/BrandLogo.types';
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  subscribeToSessionExpiration,
} from '@/api/auth-session';
import type { AuthUser } from '@/api/auth-session';
import type { AirtimeProduct } from '@/types/airtime';
import { calculateAirtimePricing, roundToTwoDecimals, toLocalLiberiaPhone } from '@/utils/airtime';
import {
  COUNTRY_CODE,
  FEE_RATE,
  LEC_NAME,
  OPERATORS,
  VOUCHER_OPERATOR_NAME,
  VOUCHER_VENDOR_ID,
  approxKw,
  money,
  type OperatorId,
  type SendKind,
  type VendorId,
} from '@/data';
import { login, register } from './services/authService';

export type Draft = {
  kind: SendKind;
  operator: OperatorId;
  operatorId: number | null;
  operatorName: string;
  product: AirtimeProduct | null;
  topUp: string;
  phone: string;
  isPhoneEdited: boolean;
  meter: string;
  amount: number;
  vendor: VendorId;
  voucherProduct: AirtimeProduct | null;
  voucherOperatorName: string;
};

export type Order = {
  kind: SendKind;
  rows: [label: string, value: string][];
  product: string;
  provider: string;
  receiver: string;
  fee: number;
  total: number;
};

export type Transaction = Order & { id: string; date: string; draft: Draft };

export type User = AuthUser;

export function brandOf(draft: Draft): Brand {
  if (draft.kind === 'airtime') return draft.operator;
  if (draft.kind === 'utility') return 'lec';
  return draft.vendor;
}

function chosenAmount(product: AirtimeProduct | null, topUp: string): number {
  if (!product) return 0;
  if (!product.isRange) return product.price ?? 0;
  const topUpAmount = Number(topUp);
  return topUpAmount >= product.min && topUpAmount <= product.max
    ? roundToTwoDecimals(topUpAmount)
    : 0;
}

export function buildOrder(draft: Draft): Order {
  const receiver = draft.kind === 'voucher' ? '' : COUNTRY_CODE + draft.phone;
  const rows: Order['rows'] = receiver ? [['Receiver phone', receiver]] : [];
  let amount: number;
  let product: string;
  let provider: string;

  if (draft.kind === 'airtime') {
    amount = chosenAmount(draft.product, draft.topUp);
    product = draft.product?.name ?? '';
    provider = draft.operatorName || OPERATORS[draft.operator].name;
    rows.push(['Operator', provider], ['Product', product]);
  } else if (draft.kind === 'utility') {
    amount = draft.amount;
    product = 'LEC credit token';
    provider = LEC_NAME;
    rows.push(
      ['Meter number', draft.meter || 'Not entered'],
      ['Operator', provider],
      ['Product', product],
      ['Approx. energy', approxKw(amount)],
    );
  } else {
    amount = chosenAmount(draft.voucherProduct, draft.topUp);
    product = draft.voucherProduct?.name ?? '';
    provider = draft.voucherOperatorName || VOUCHER_OPERATOR_NAME;
    rows.push(['Vendor', provider], ['Product', product]);
  }

  let fee: number;
  let total: number;
  if (draft.kind === 'airtime' || draft.kind === 'voucher') {
    ({ fee, total } = calculateAirtimePricing(amount));
  } else {
    fee = Math.round(amount * FEE_RATE * 100) / 100;
    total = amount + fee;
  }
  rows.push(['Amount', money(amount)], ['Credit', money(amount)], ['Transaction fee', money(fee)]);
  return { kind: draft.kind, rows, product, provider, receiver, fee, total };
}

function newDraft(kind: SendKind, operator: OperatorId, personalPhone = ''): Draft {
  return {
    kind,
    operator,
    operatorId: null,
    operatorName: '',
    product: null,
    topUp: '',
    phone: kind === 'voucher' ? '' : toLocalLiberiaPhone(personalPhone),
    isPhoneEdited: false,
    meter: '',
    amount: 10,
    vendor: VOUCHER_VENDOR_ID,
    voucherProduct: null,
    voucherOperatorName: '',
  };
}

type Store = {
  draft: Draft;
  startSend: (kind: SendKind, operator?: OperatorId) => void;
  updateDraft: (patch: Partial<Draft>) => void;
  lastOrder: Order | null;
  setLastOrder: (order: Order | null) => void;
  resend: (transaction: Transaction) => void;
  user: User | null;
  isAuthReady: boolean;
  authError: string | null;
  signUp: (
    user: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>,
    pin: string,
    confirmPin: string,
  ) => Promise<void>;
  changeEmail: (email: string) => Promise<void>;
  updateProfilePic: (profilePic: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(() => newDraft('airtime', 'mtn'));
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToSessionExpiration(() => {
      if (active) setUser(null);
    });

    getAuthSession()
      .then((session) => {
        if (active) setUser(session?.user ?? null);
      })
      .catch((error: unknown) => {
        if (active) {
          setAuthError(
            error instanceof Error ? error.message : 'Unable to restore your sign-in session.',
          );
        }
      })
      .finally(() => {
        if (active) setIsAuthReady(true);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const store: Store = {
    draft,
    startSend: (kind, operator) => {
      setLastOrder(null);
      setDraft(
        newDraft(kind, operator ?? (kind === 'airtime' ? 'mtn' : 'orange'), user?.phone ?? ''),
      );
    },
    updateDraft: (patch) => setDraft((currentDraft) => ({ ...currentDraft, ...patch })),
    lastOrder,
    setLastOrder,
    resend: (transaction) => setDraft({ ...transaction.draft }),
    user,
    isAuthReady,
    authError,
    signUp: async (newUser, pin, confirmPin) => {
      setAuthError(null);
      await register(newUser, pin, confirmPin);
    },
    logIn: async (email, password) => {
      setAuthError(null);
      const session = await login(email, password);
      await saveAuthSession(session);
      setUser(session.user);
    },
    signOut: async () => {
      await clearAuthSession();
      setUser(null);
    },
    changeEmail: async (email) => {
      const session = await getAuthSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');

      const updatedSession = {
        ...session,
        user: { ...session.user, email: email.trim() },
      };
      await saveAuthSession(updatedSession);
      setUser(updatedSession.user);
    },
    updateProfilePic: async (profilePic) => {
      const session = await getAuthSession();
      if (!session) throw new Error('Your session has expired. Please sign in again.');
      const updatedSession = { ...session, user: { ...session.user, profilePic } };
      await saveAuthSession(updatedSession);
      setUser(updatedSession.user);
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
