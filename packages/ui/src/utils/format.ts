const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

export function formatDate(
  value: Date | string | number,
  locale = "en-GB",
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(locale, options);
}

export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/** Odoo account report figures: `120,810.00` (no currency symbol). */
export function formatReportAmount(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
