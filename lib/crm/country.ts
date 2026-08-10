import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export type NormalizedCountry = {
  countryCode: string;
  countryName: string;
};

const NAME_TO_CODE = new Map<string, string>();

function buildNameIndex() {
  if (NAME_TO_CODE.size) return;
  const names = countries.getNames("en", { select: "official" });
  for (const [code, name] of Object.entries(names)) {
    NAME_TO_CODE.set(name.trim().toLowerCase(), code.toUpperCase());
    NAME_TO_CODE.set(code.toLowerCase(), code.toUpperCase());
  }
  // Common aliases
  NAME_TO_CODE.set("united states", "US");
  NAME_TO_CODE.set("usa", "US");
  NAME_TO_CODE.set("u.s.", "US");
  NAME_TO_CODE.set("uk", "GB");
  NAME_TO_CODE.set("united kingdom", "GB");
}

export function normalizeCountryInput(raw: string | null | undefined): NormalizedCountry | null {
  const v = raw?.trim();
  if (!v) return null;
  buildNameIndex();

  const upper = v.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && countries.isValid(upper)) {
    return {
      countryCode: upper,
      countryName: countries.getName(upper, "en") ?? upper,
    };
  }

  const code = NAME_TO_CODE.get(v.toLowerCase());
  if (code && countries.isValid(code)) {
    return {
      countryCode: code,
      countryName: countries.getName(code, "en") ?? code,
    };
  }

  return null;
}

export function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function formatContactLocation(input: {
  city?: string | null;
  stateRegion?: string | null;
  countryName?: string | null;
}): string {
  return [input.city, input.stateRegion, input.countryName]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}

export function listCountryOptions(): Array<{ code: string; name: string }> {
  buildNameIndex();
  return Object.entries(countries.getNames("en"))
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
