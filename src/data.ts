export const FEE_RATE = 0.12;
export const COMMISSION_PERCENT = 8;
export const AIRTIME_FEE_RATE = COMMISSION_PERCENT / 100;
export const COUNTRY_CODE = '+231';
export const COUNTRY_ID = 'LR';
export const RANGE_PRICE_TYPE = 'range';

export const OPERATORS = {
  mtn: {
    label: 'Lonestar MTN',
    name: 'Liberia MTN',
    samplePhone: '880771597',
  },
  orange: {
    label: 'Orange',
    name: 'Liberia Orange',
    samplePhone: '777123456',
  },
};

export type OperatorId = keyof typeof OPERATORS;
export type SendKind = 'airtime' | 'utility' | 'voucher';

export const UTILITY_AMOUNTS = [5, 10, 20, 50, 75, 100, 150, 200, 300, 400, 500];
export const LEC_NAME = 'Liberia Electricity Corporation (LEC)';
export const KW_PER_DOLLAR = 3.77;
export const VOUCHER_VENDORS = [{ id: 'voucher', name: 'Stop & Shop' }] as const;
export const VOUCHER_AMOUNTS = [10, 25, 50, 75, 100];



export const approxKw = (dollars: number) => `${(dollars * KW_PER_DOLLAR).toFixed(2)} kW`;
export const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;



export const VOUCHER_OPERATOR_ID = 2482;
export const VOUCHER_OPERATOR_NAME = 'Stop & Shop Supermarket - Liberia';
export type VendorId = 'voucher';
export const VOUCHER_VENDOR_ID: VendorId = 'voucher';