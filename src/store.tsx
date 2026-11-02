import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Brand } from '@/components/brand-logo';
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  subscribeToSessionExpiration,
} from '@/api/auth-session';
import { Login, Register } from '@/api/auth';
import type { AuthUser } from '@/api/auth-session';
import {
  COUNTRY_CODE,
  FEE_RATE,
  LEC_NAME,
  OPERATORS,
  TOP_UP,
  VOUCHER_AMOUNTS,
  VOUCHER_VENDORS,
  approxKw,
  money,
  type OperatorId,
  type SendKind,
  type VendorId,
} from '@/data';

export type Draft = {
  kind: SendKind;
  operator: OperatorId;
  /** A package id from the operator's list, or TOP_UP.id. */
  packageId: string;
  /** Dollar amount typed for a top-up, kept as text while editing. */
  topUp: string;
  phone: string;
  phoneEdited: boolean;
  meter: string;
  /** LEC credit amount in dollars. */
  amount: number;
  vendor: VendorId;
  voucherAmount: number;
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

/** The original details are kept so the transaction can be sent again. */
export type Transaction = Order & { id: string; date: string; draft: Draft };

export type User = AuthUser;

/** The logo for whoever receives the money: the operator, LEC or the voucher vendor. */
export function brandOf(draft: Draft): Brand {
  if (draft.kind === 'airtime') return draft.operator;
  if (draft.kind === 'utility') return 'lec';
  return draft.vendor;
}

/** Turns the in-progress send into the order summary shown at checkout. */
export function buildOrder(draft: Draft): Order {
  const receiver = COUNTRY_CODE + draft.phone;
  const rows: Order['rows'] = [['Receiver phone', receiver]];
  let amount: number;
  let product: string;
  let provider: string;

  if (draft.kind === 'airtime') {
    const operator = OPERATORS[draft.operator];
    const isTopUp = draft.packageId === TOP_UP.id;
    const pkg = operator.packages.find((p) => p.id === draft.packageId);
    const topUp = Number(draft.topUp);
    const validTopUp = topUp >= TOP_UP.min && topUp <= TOP_UP.max ? topUp : 0;
    amount = isTopUp ? validTopUp : (pkg?.price ?? 0);
    product = isTopUp ? `${money(amount)} Top Up` : (pkg?.name ?? '');
    provider = operator.name;
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
    const vendor = VOUCHER_VENDORS.find((v) => v.id === draft.vendor) ?? VOUCHER_VENDORS[0];
    amount = draft.voucherAmount;
    product = `${vendor.name} shopping voucher`;
    provider = vendor.name;
    rows.push(['Vendor', provider], ['Product', product]);
  }

  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  rows.push(['Amount', money(amount)], ['Credit', money(amount)], ['Transaction fee', money(fee)]);
  return { kind: draft.kind, rows, product, provider, receiver, fee, total: amount + fee };
}

function newDraft(kind: SendKind, operator: OperatorId): Draft {
  return {
    kind,
    operator,
    packageId: OPERATORS[operator].defaultPackage,
    topUp: '',
    phone: OPERATORS[operator].samplePhone,
    phoneEdited: false,
    meter: '',
    amount: 10,
    vendor: VOUCHER_VENDORS[0].id,
    voucherAmount: VOUCHER_AMOUNTS[1],
  };
}

type Store = {
  draft: Draft;
  startSend: (kind: SendKind, operator?: OperatorId) => void;
  updateDraft: (patch: Partial<Draft>) => void;
  transactions: Transaction[];
  lastOrder: Order | null;
  /** Records the order locally. Replace with the real payment + order API call. */
  completeOrder: (order: Order) => void;
  /** Loads a past transaction's details so it can be paid again. */
  resend: (transaction: Transaction) => void;
  /** Null when signed out. */
  user: User | null;
  authReady: boolean;
  authError: string | null;
  signUp: (
    user: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>,
    pin: string,
    confirmPin: string,
  ) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(() => newDraft('airtime', 'mtn'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
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
          setAuthError(error instanceof Error ? error.message : 'Unable to restore your sign-in session.');
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const store: Store = {
    draft,
    startSend: (kind, operator) =>
      setDraft(newDraft(kind, operator ?? (kind === 'airtime' ? 'mtn' : 'orange'))),
    updateDraft: (patch) => setDraft((d) => ({ ...d, ...patch })),
    transactions,
    lastOrder,
    completeOrder: (order) => {
      const date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      setLastOrder(order);
      setTransactions((list) => [{ ...order, id: String(Date.now()), date, draft }, ...list]);
    },
    resend: (transaction) => setDraft({ ...transaction.draft }),
    user,
    authReady,
    authError,
    signUp: async (newUser, pin, confirmPin) => {
      setAuthError(null);
      await Register(newUser, pin, confirmPin);
    },
    logIn: async (email, password) => {
      setAuthError(null);
      const session = await Login(email, password);
      await saveAuthSession(session);
      setUser(session.user);
    },
    signOut: async () => {
      await clearAuthSession();
      setUser(null);
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
