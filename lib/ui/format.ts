/** Centralized date and money formatting for product surfaces. */

const DEFAULT_DATE_LOCALE = "en-US";

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function resolveDateFormatOptions(
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  if (!options) return DEFAULT_DATE_OPTIONS;
  // dateStyle/timeStyle cannot be combined with day/month/year — Intl throws RangeError.
  if ("dateStyle" in options || "timeStyle" in options) return options;
  return { ...DEFAULT_DATE_OPTIONS, ...options };
}

export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(
    DEFAULT_DATE_LOCALE,
    resolveDateFormatOptions(options),
  );
}

export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(DEFAULT_DATE_LOCALE, {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  if (options) {
    return parsed.toLocaleString(DEFAULT_DATE_LOCALE, options);
  }
  return parsed.toLocaleString(DEFAULT_DATE_LOCALE, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function formatMoney(
  amountMinor: number,
  currency: string,
  locale?: string,
) {
  const amount = amountMinor / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`;
  }
}

export function formatRelativeTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d) ?? "";
}
