import { CURRENCY_SYMBOL } from './constants';

const numberFormat = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 0,
});

/**
 * Format an amount as PKR, e.g. 4500 -> "Rs 4,500".
 *
 * Prices come from Firestore and admin input, so a non-numeric value is
 * possible; render it as zero rather than letting "NaN" reach a price tag.
 */
export function formatPKR(amount) {
  const value = Number(amount);
  return `${CURRENCY_SYMBOL} ${numberFormat.format(Number.isFinite(value) ? value : 0)}`;
}

/** Bare number, no currency symbol — for inputs and data attributes. */
export function formatAmount(amount) {
  const value = Number(amount);
  return numberFormat.format(Number.isFinite(value) ? value : 0);
}
