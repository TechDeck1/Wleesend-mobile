export const COMMISSION_PERCENT = 8;
export const FEE_RATE = COMMISSION_PERCENT / 100;
export const AIRTIME_FEE_RATE = COMMISSION_PERCENT / 100;
export const COUNTRY_CODE = '+231';
export const COUNTRY_ID = 'LR';
export const RANGE_PRICE_TYPE = 'range';

export const OPERATORS = {
  mtn: {
    label: 'Lonestar MTN',
    name: 'Liberia MTN',
  },
  orange: {
    label: 'Orange',
    name: 'Liberia Orange',
  },
};

export type OperatorId = keyof typeof OPERATORS;
export type SendKind = 'airtime' | 'utility' | 'voucher';

export const UTILITY_AMOUNTS = [10, 15, 25, 50, 75, 100];
export const UTILITY_MIN_AMOUNT = 1;
export const LEC_OPERATOR_ID = 2470;
export const LEC_PRODUCT_ID = 14028;
export const RECHARGE_COMMAND = 'execTransaction';
export const TRANSFER_TYPE_ID = { airtime: 10, utility: 11, voucher: 17 } as const;
export const LEC_NAME = 'Liberia Electricity Corporation (LEC)';
export const KW_PER_DOLLAR = 3.77;
export const approxKw = (dollars: number) => `${(dollars * KW_PER_DOLLAR).toFixed(2)} kW`;
export const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;



export const VOUCHER_OPERATOR_ID = 2482;
export const VOUCHER_OPERATOR_NAME = 'Stop & Shop Supermarket - Liberia';
export type VendorId = 'voucher';
export const VOUCHER_VENDOR_ID: VendorId = 'voucher';
