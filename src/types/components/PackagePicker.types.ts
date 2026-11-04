import type { AirtimeProduct } from '@/types/airtime';

export type PackagePickerAnchor = { x: number; y: number; width: number; height: number };
export type PackagePickerProps = {
  packages: AirtimeProduct[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};
