import { siteConfig } from "@/lib/site";
import { z } from "zod";

/** Non-secret site configuration stored in SiteSettings.extras (DB-managed). */
export const siteSettingsExtrasSchema = z.object({
  locationLabel: z.string().max(120).nullable().optional(),
  serviceAreas: z.string().max(300).nullable().optional(),
  workingHours: z.string().max(200).nullable().optional(),
  streetAddress: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  region: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  twitterHandle: z.string().max(50).nullable().optional(),
  responseExpectation: z.string().max(300).nullable().optional(),
  contactToEmail: z.string().max(200).nullable().optional(),
  contactFromEmail: z.string().max(200).nullable().optional(),
  formToEmail: z.string().max(200).nullable().optional(),
  mediaMaxUploadMb: z.number().min(1).max(25).nullable().optional(),
});

export type SiteSettingsExtras = z.infer<typeof siteSettingsExtrasSchema>;

export type ResolvedSitePresentation = {
  locationLabel: string;
  serviceAreas: string;
  workingHours: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  twitterHandle: string;
  responseExpectation: string;
  contactToEmail: string | null;
  contactFromEmail: string | null;
  formToEmail: string | null;
  mediaMaxUploadMb: number;
};

function trimOrEmpty(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseSiteSettingsExtras(raw: unknown): SiteSettingsExtras {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const parsed = siteSettingsExtrasSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function resolveSitePresentation(
  extrasInput?: SiteSettingsExtras | null,
): ResolvedSitePresentation {
  const extras = extrasInput ?? {};
  const pick = (dbValue: string | null | undefined, envValue: string) =>
    trimOrEmpty(dbValue) || envValue;

  const mediaMaxUploadMb = (() => {
    if (extras.mediaMaxUploadMb != null) return extras.mediaMaxUploadMb;
    const envMb = Number(process.env.MEDIA_MAX_UPLOAD_MB || "8");
    return Number.isFinite(envMb) && envMb > 0 ? Math.min(envMb, 25) : 8;
  })();

  return {
    locationLabel: pick(extras.locationLabel, siteConfig.locationLabel),
    serviceAreas: pick(extras.serviceAreas, siteConfig.serviceAreas),
    workingHours: pick(extras.workingHours, siteConfig.workingHours),
    address: {
      streetAddress: pick(extras.streetAddress, siteConfig.address.streetAddress),
      addressLocality: pick(extras.city, siteConfig.address.addressLocality),
      addressRegion: pick(extras.region, siteConfig.address.addressRegion),
      postalCode: pick(extras.postalCode, siteConfig.address.postalCode),
      addressCountry: pick(extras.country, siteConfig.address.addressCountry),
    },
    twitterHandle: pick(extras.twitterHandle, siteConfig.twitterHandle),
    responseExpectation: pick(
      extras.responseExpectation,
      siteConfig.responseExpectation,
    ),
    contactToEmail:
      trimOrNull(extras.contactToEmail) ||
      trimOrNull(process.env.CONTACT_TO_EMAIL) ||
      trimOrNull(process.env.FORM_TO_EMAIL),
    contactFromEmail:
      trimOrNull(extras.contactFromEmail) ||
      trimOrNull(process.env.CONTACT_FROM_EMAIL),
    formToEmail:
      trimOrNull(extras.formToEmail) || trimOrNull(process.env.FORM_TO_EMAIL),
    mediaMaxUploadMb,
  };
}

export function hasResolvedAddress(presentation: ResolvedSitePresentation) {
  const { streetAddress, addressLocality, addressCountry } = presentation.address;
  return Boolean(streetAddress && addressLocality && addressCountry);
}

export function mergeSiteSettingsExtras(
  existing: unknown,
  patch: SiteSettingsExtras,
): SiteSettingsExtras {
  const current = parseSiteSettingsExtras(existing);
  const next: Record<string, unknown> = { ...current };

  for (const key of Object.keys(patch) as Array<keyof SiteSettingsExtras>) {
    const value = patch[key];
    if (value === undefined) continue;
    if (value === null || value === "") {
      delete next[key as string];
      continue;
    }
    next[key as string] = value;
  }

  return parseSiteSettingsExtras(next);
}
