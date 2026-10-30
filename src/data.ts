/**
 * Placeholder catalogue taken from the website screenshots.
 * Replace with the live product list from the Wleesend API.
 */
export const FEE_RATE = 0.12;
export const COUNTRY_CODE = '+231';

/**
 * A product an operator sells. `price` is null where the website list doesn't
 * show one yet; those packages are listed but can't be chosen until it's set.
 */
export type Package = { id: string; name: string; price: number | null };

/** The "1-100 USD Top Up" entry: the sender picks any whole-dollar amount in range. */
export const TOP_UP = { id: 'topup', name: '1-100 USD Top Up', min: 1, max: 100 } as const;

export const OPERATORS = {
  mtn: {
    label: 'Lonestar MTN',
    name: 'Liberia MTN',
    samplePhone: '880771597',
    defaultPackage: 'mtn-9-15gb',
    packages: [
      { id: 'mtn-x5-1', name: '$1 (X5 Multiplier) Bundle', price: 1 },
      { id: 'mtn-x5-2', name: '$2 (X5 Multiplier) Bundle', price: 2 },
      { id: 'mtn-x5-5', name: '$5 (X5 Multiplier) Bundle', price: 5 },
      { id: 'mtn-x5-10', name: '$10 (X5 Multiplier) Bundle', price: 10 },
      { id: 'mtn-x5-20', name: '$20 (X5 Multiplier) Bundle', price: 20 },
      { id: 'mtn-ent-179', name: 'Enterprise Bundle $179 - Unlimited (30 Days)', price: 179 },
      { id: 'mtn-1-500mb', name: '$1 - 500MB Data Bundle (3 Days)', price: 1 },
      { id: 'mtn-2-1.8gb', name: '$2 - 1.8GB Data Bundle (7 Days)', price: 2 },
      { id: 'mtn-prestige-5', name: '$5 Prestige Bundle (30 Days)', price: 5 },
      { id: 'mtn-9-15gb', name: '$9 - 15GB (30 Days)', price: 9 },
      { id: 'mtn-ent-25gb', name: '25GB MTN Enterprise Bundle (30 Days)', price: null },
      { id: 'mtn-prestige-20', name: '001 - MTN PRESTIGE $20 - 23GB (30 Days)', price: 20 },
      { id: 'mtn-ent-29', name: 'Enterprise Bundle $29 - 70GB (30 Days)', price: 29 },
      { id: 'mtn-ent-49', name: 'Enterprise Bundle $49 - 250GB (30 Days)', price: 49 },
      { id: 'mtn-prestige-50', name: '$50 Prestige Bundle', price: 50 },
      { id: 'mtn-ent-69', name: 'Enterprise Bundle $69 - 500GB (30 Days)', price: 69 },
      { id: 'mtn-ent-99', name: 'Enterprise Bundle $99 - 1TB (30 Days)', price: 99 },
      { id: 'mtn-ent-200gb', name: '200GB MTN Enterprise Bundle (30 Days)', price: null },
      { id: 'mtn-ent-unlimited', name: 'Unlimited Enterprise Bundle', price: null },
    ] as Package[],
  },
  orange: {
    label: 'Orange',
    name: 'Liberia Orange (Cellcom)',
    samplePhone: '777123456',
    defaultPackage: 'orange-monthly-10gb',
    packages: [
      { id: 'orange-daily-350mb', name: 'Turbo Daily 350MB (1 Day)', price: null },
      { id: 'orange-weekly-1.8gb', name: 'Turbo Weekly 1.8GB (7 Days)', price: null },
      { id: 'orange-weekly-6.5gb', name: 'Turbo Weekly 6.5GB (7 Days)', price: null },
      { id: 'orange-weekly-12gb', name: 'Turbo Weekly 12GB Data (7 Days)', price: null },
      { id: 'orange-monthly-10gb', name: 'Turbo Monthly 10GB Data (30 Days)', price: 10 },
    ] as Package[],
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
