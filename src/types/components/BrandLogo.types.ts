import type { OperatorId, VendorId } from '@/data';
import type { IconName } from '@/types/components/UiComponents.types';

export type Brand = OperatorId | VendorId | 'lec' | 'voucher' | 'airtime';
export type BrandLogoAsset = { source: number; label: string; bg: string };
export type BrandLogoProps = { brand?: Brand; size?: number };
export type BrandFallbackIcons = Partial<Record<Brand, IconName>>;
