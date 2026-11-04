export type AmountGridProps = {
  amounts: number[];
  value: number;
  onChange: (amount: number) => void;
};

export type CatalogNoticeProps = {
  loadingMessage: string;
  error: string | null;
  onRetry: () => void;
};
