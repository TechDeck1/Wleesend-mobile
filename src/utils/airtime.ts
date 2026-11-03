import { AIRTIME_FEE_RATE, type OperatorId } from '@/data';
import type { AirtimeOperator, AirtimePricing } from '@/types/airtime';

const PHONE_PATTERN = /^[578][0-9]{8}$/;
const MTN_PREFIXES = new Set(['555', '880', '881', '882', '883', '884', '885', '886', '887', '888', '889']);
const ORANGE_PREFIXES = new Set(['770', '775', '776', '777', '778', '779']);
const PREFIX_LOOKUP_MIN_DIGITS = 3;

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

export const roundToTwoDecimals = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function operatorForPhone(digits: string): OperatorId | undefined {
  const leading = digits.charAt(0);
  if (leading === '5' || leading === '8') return 'mtn';
  if (leading === '7') return 'orange';
  return undefined;
}

export function brandForOperatorName(name: string): OperatorId | undefined {
  if (/mtn/i.test(name)) return 'mtn';
  if (/orange|cellcom/i.test(name)) return 'orange';
  return undefined;
}

export function findRestrictedOperator(digits: string, operators: AirtimeOperator[]): AirtimeOperator | undefined {
  if (digits.length < PREFIX_LOOKUP_MIN_DIGITS) return undefined;
  const family = operatorForPhone(digits);
  return family ? operators.find((op) => brandForOperatorName(op.name) === family) : undefined;
}

export function getPhonePrefixError(digits: string): string | undefined {
  if (digits.length < PREFIX_LOOKUP_MIN_DIGITS) return undefined;
  const prefix = digits.slice(0, 3);
  const family = operatorForPhone(digits);
  const valid =
    (family === 'mtn' && MTN_PREFIXES.has(prefix)) || (family === 'orange' && ORANGE_PREFIXES.has(prefix));
  return valid ? undefined : 'Enter a valid MTN or Orange number.';
}

export const isValidLiberiaPhone = (digits: string) => PHONE_PATTERN.test(digits) && !getPhonePrefixError(digits);

export function calculateAirtimePricing(amount: number): AirtimePricing {
  const fee = roundToTwoDecimals(amount * AIRTIME_FEE_RATE);
  return { amount, fee, total: roundToTwoDecimals(amount + fee) };
}
