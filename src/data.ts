/**
 * Static send data. Airtime operators and products now come from the Wleesend API
 * (see src/services/airtime.ts); the utility and voucher values below are still placeholders.
 */
export const FEE_RATE = 0.12;
/** Commission percent, same as COMMISSION_PERCENT on the website. */
export const COMMISSION_PERCENT = 8;
export const AIRTIME_FEE_RATE = COMMISSION_PERCENT / 100;
export const COUNTRY_CODE = '+231';

/** Liberia's `countryId` in the API's operator list (COUNTRY_ID on the website). */
export const COUNTRY_ID = 'LR';

/** The `priceType` the API uses for products whose amount the sender chooses (RANGE_PRICE_TYPE on the website). */
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

/** Same estimate the website shows under the LEC amount: approx. 3.77 kW per dollar. */
export const KW_PER_DOLLAR = 3.77;
export const approxKw = (dollars: number) => `${(dollars * KW_PER_DOLLAR).toFixed(2)} kW`;

export const VOUCHER_VENDORS = [{ id: 'stop-and-shop', name: 'Stop & Shop' }] as const;
export type VendorId = (typeof VOUCHER_VENDORS)[number]['id'];
/** Placeholder amounts until the vendor's voucher values are confirmed. */
export const VOUCHER_AMOUNTS = [10, 25, 50, 75, 100];

export const money = (n: number) => `$${n.toFixed(2)}`;
