/** Normalize email for case-insensitive lookup. Does not alter valid local parts. */
export function normalizeCrmEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed;
}

/** Extract registrable domain from a website URL. */
export function normalizeCompanyDomain(
  website: string | null | undefined,
): string | null {
  if (!website?.trim()) return null;
  try {
    let url = website.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

/** Conservative phone normalization — strip common formatting, preserve digits and leading +. */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits.replace(/\D/g, "")) return null;
  return hasPlus ? `+${digits.replace(/\D/g, "")}` : digits.replace(/\D/g, "");
}

/** Split a full name into first/last or return displayName-only shape. */
export function parsePersonName(fullName: string): {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
} {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: null, lastName: null, displayName: "" };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: null, lastName: null, displayName: trimmed };
  }
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
    displayName: trimmed,
  };
}

/** Resolve display name for UI from contact fields. */
export function contactDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
}): string {
  if (input.displayName?.trim()) return input.displayName.trim();
  const parts = [input.firstName, input.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (input.email?.trim()) return input.email.trim();
  return "Unknown contact";
}
