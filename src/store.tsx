import { createContext, useContext, useState, type ReactNode } from 'react';

import type { Brand } from '@/components/brand-logo';
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

export type User = { firstName: string; lastName: string; email: string; phone: string };

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
  /** Creates the account locally. Replace with the Wleesend API sign-up call. */
  signUp: (user: User, password: string) => void;
  /** Checks against accounts made on this device this session. Replace with the Wleesend API log-in call. */
  logIn: (email: string, password: string) => boolean;
  signOut: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(() => newDraft('airtime', 'mtn'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  // The app opens signed out, like the website. Accounts live in memory until the
  // Wleesend API is connected, so they last only until the app is closed.
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<{ user: User; password: string }[]>([]);

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
    signUp: (newUser, password) => {
      setAccounts((list) => [
        ...list.filter((a) => a.user.email.toLowerCase() !== newUser.email.toLowerCase()),
        { user: newUser, password },
      ]);
      setUser(newUser);
    },
    logIn: (email, password) => {
      const account = accounts.find(
        (a) => a.user.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
      );
      if (account) setUser(account.user);
      return account !== undefined;
    },
    signOut: () => setUser(null),
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
