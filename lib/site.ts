/**
 * Central company / site configuration.
 * Prefer editing values here (or env vars) rather than scattering them in components.
 */

export const DEFAULT_SITE_ORIGIN = "https://smartlancedesigns.com";

/** Strip accidental env concatenation and return a valid HTTPS origin. */
export function sanitizeSiteOrigin(raw?: string | null): string {
  const candidate = raw?.trim().split(/DATABASE_URL=/i)[0]?.trim() ?? "";
  if (!candidate) return DEFAULT_SITE_ORIGIN;

  try {
    const normalized = /^https?:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate.replace(/^https?:\/\//, "")}`;

    if (/postgresql|DATABASE_URL/i.test(normalized)) {
      return DEFAULT_SITE_ORIGIN;
    }

    const url = new URL(normalized);
    if (!url.hostname || /\s/.test(url.hostname)) {
      return DEFAULT_SITE_ORIGIN;
    }

    return `${url.protocol}//${url.host}`;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export const siteConfig = {
  name: "Smartlance Designs",
  legalName: "Smartlance Designs",
  tagline: "Websites Built to Rank, Convert and Grow.",
  description:
    "Smartlance Designs builds websites and SEO strategies that help businesses get found, earn trust and turn visitors into customers.",
  /** Production origin — set NEXT_PUBLIC_SITE_URL (no trailing slash) */
  url: sanitizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "en_US",
  email:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "Contact@smartlancedesigns.com",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+2348075582466",
  /** WhatsApp not verified as a dedicated public link on the live site — leave empty unless set */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "",
  /** Optional human-readable location label */
  locationLabel: process.env.NEXT_PUBLIC_LOCATION_LABEL ?? "",
  /** Optional service-area summary */
  serviceAreas:
    process.env.NEXT_PUBLIC_SERVICE_AREAS ?? "International remote clients",
  workingHours: process.env.NEXT_PUBLIC_WORKING_HOURS ?? "",
  /**
   * Only include address fields that are verified.
   * Empty fields are omitted from structured data.
   */
  address: {
    streetAddress: process.env.NEXT_PUBLIC_STREET_ADDRESS ?? "",
    addressLocality: process.env.NEXT_PUBLIC_CITY ?? "",
    addressRegion: process.env.NEXT_PUBLIC_REGION ?? "",
    postalCode: process.env.NEXT_PUBLIC_POSTAL_CODE ?? "",
    addressCountry: process.env.NEXT_PUBLIC_COUNTRY ?? "",
  },
  ogImage: "/images/og/default.svg",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "",
  brand: {
    orange: "#F47A48",
    dark: "#535353",
    white: "#FFFFFF",
  },
  cta: {
    /** Persistent commercial CTA — ready visitors should reach Contact quickly */
    primary: {
      label: "Tell Us About Your Project",
      href: "/contact",
    },
    /** Existing-site diagnosis path — secondary globally; primary on review-oriented pages */
    secondary: {
      label: "Get a Free Website Review",
      href: "/free-website-review",
    },
  },
  /** Expected reply window shown on thank-you screens (leave empty to omit) */
  responseExpectation: process.env.NEXT_PUBLIC_RESPONSE_EXPECTATION ?? "",
  /** Verified experience claim from existing Smartlance copy */
  experienceClaim: "Over 5 years of experience",
} as const;

export function hasRealAddress() {
  const { streetAddress, addressLocality, addressCountry } = siteConfig.address;
  return Boolean(streetAddress && addressLocality && addressCountry);
}

export function absoluteUrl(path = "") {
  const base = siteConfig.url.replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
