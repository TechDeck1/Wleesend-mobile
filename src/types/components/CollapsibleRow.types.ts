import type { ReactNode } from 'react';

export type CollapsibleRowProps = {
  isVisible: boolean;
  height: number;
  gap?: number;
  children: ReactNode;
};
