import type { Transaction } from '@/store';

export type TransactionDetailsModalProps = {
  transaction: Transaction | null;
  onClose: () => void;
  onResend: (transaction: Transaction) => void;
};
