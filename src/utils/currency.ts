// What? Converts a formatted currency string or float to an integer representation (Kuruş/Cents).
// Why? We must store all financial data as integers in the database to prevent floating-point precision loss.
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// What? Converts the integer (Kuruş/Cents) from the DB back to a string/float for the UI.
// Why? Users expect to see standard decimal formats (like 930.00 TL), not isolated large numbers like 93000.
export function fromCents(cents: number): number {
  return cents / 100;
}

// What? Formats the cents value into a localized currency string.
// Why? To display visually appealing amounts to the user depending on their locale (e.g., ₺930.00).
export function formatCurrency(cents: number, locale: string = 'tr-TR', currency: string = 'TRY'): string {
  const value = fromCents(cents);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}
