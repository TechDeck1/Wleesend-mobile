/** Raw operator as returned by `GET /Product/operators`. */
export type ApiOperator = {
  sochitelId: number;
  name: string;
  /** Country code, e.g. 'LR' for Liberia. */
  countryId: string;
};

/** Raw product as returned by `GET /Product/operators/{sochitelId}/products`. */
export type ApiProduct = {
  sochitelProductId: number;
  stripeProductId?: string | null;
  name: string;
  priceType?: string | number | null;
  price?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
};

/** An operator the sender can choose. `id` is the Sochitel operator id the checkout call needs. */
export type AirtimeOperator = {
  id: number;
  name: string;
};

/** A product from the API. Fixed products have a `price`; range products let the sender pick min–max. */
export type AirtimeProduct = {
  /** Sochitel product id. */
  id: number;
  name: string;
  stripeProductId: string | null;
  isRange: boolean;
  /** Null for range products, and for fixed products the API sent without a price. */
  price: number | null;
  min: number;
  max: number;
};

export type AirtimePricing = {
  amount: number;
  fee: number;
  total: number;
};
