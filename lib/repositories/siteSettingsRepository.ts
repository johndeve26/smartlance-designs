import { unstable_cache } from "next/cache";
import { hasDatabaseUrl, isDatabaseConnectivityError, prisma, resetDatabaseConnection } from "@/lib/db";
import { sanitizeSiteOrigin, siteConfig } from "@/lib/site";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  CACHE_TAGS,
  createContentRevision,
  revalidateSiteSettings,
} from "@/lib/admin/publishing";
import type { Prisma } from "@prisma/client";
import {
  isSafePublicUrl,
  type SocialLinkSetting,
} from "@/lib/ops/url-safety";
import { z } from "zod";
import {
  mergeSiteSettingsExtras,
  parseSiteSettingsExtras,
  resolveSitePresentation,
  siteSettingsExtrasSchema,
  type ResolvedSitePresentation,
  type SiteSettingsExtras,
} from "@/lib/site-settings-extras";
import { resolveMediaUrl } from "@/lib/media/urls";

export type PublicSiteSettings = {
  siteName: string;
  businessName: string;
  description: string;
  url: string;
  email: string;
  phone: string;
  whatsapp: string;
  ogImage: string;
  locale: string;
  contactFormEnabled: boolean;
  freeReviewFormEnabled: boolean;
  audienceEnabled: boolean;
  formSuccessMessage: string | null;
  formFallbackMessage: string | null;
  showPublicPricing: boolean;
  socialLinks: SocialLinkSetting[];
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
  clarityProjectId: string | null;
  analyticsEnabled: boolean;
  primaryLogoPath: string | null;
  logoOnDarkPath: string | null;
  faviconPath: string | null;
  footerDescription: string | null;
  publisherName: string | null;
  defaultTitleTemplate: string | null;
  canonicalHost: string | null;
  presentation: ResolvedSitePresentation;
};

const FALLBACK_SOCIAL: SocialLinkSetting[] = [
  {
    platform: "instagram",
    url: "https://www.instagram.com/smartlance_designs/",
    enabled: true,
    displayOrder: 0,
  },
];

function hostFromUrl(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "smartlancedesigns.com";
  }
}

export function fallbackPublicSiteSettings(): PublicSiteSettings {
  return {
    siteName: siteConfig.name,
    businessName: siteConfig.legalName,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.email,
    phone: siteConfig.phone,
    whatsapp: siteConfig.whatsapp,
    ogImage: resolveMediaUrl(siteConfig.ogImage),
    locale: siteConfig.locale,
    contactFormEnabled: true,
    freeReviewFormEnabled: true,
    audienceEnabled: true,
    formSuccessMessage: null,
    formFallbackMessage: null,
    showPublicPricing: false,
    socialLinks: FALLBACK_SOCIAL,
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
    gtmContainerId: process.env.NEXT_PUBLIC_GTM_ID || null,
    clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_ID || null,
    analyticsEnabled: true,
    primaryLogoPath: resolveMediaUrl("/images/brand/smartlance-logo-v2.webp"),
    logoOnDarkPath: resolveMediaUrl("/images/brand/smartlance-logo-on-dark.png"),
    faviconPath: resolveMediaUrl("/images/brand/favicon-32.png"),
    footerDescription: null,
    publisherName: siteConfig.name,
    defaultTitleTemplate: `%s | ${siteConfig.name}`,
    canonicalHost: hostFromUrl(siteConfig.url),
    presentation: resolveSitePresentation(),
  };
}

function mapRow(row: {
  siteName: string;
  businessName: string;
  defaultSiteDescription: string | null;
  defaultMetaDescription: string | null;
  canonicalHost: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsapp: string | null;
  defaultOgImagePath: string | null;
  defaultLocale: string;
  contactFormEnabled: boolean;
  freeReviewFormEnabled: boolean;
  audienceEnabled: boolean;
  formSuccessMessage: string | null;
  formFallbackMessage: string | null;
  showPublicPricing: boolean;
  socialLinks: Prisma.JsonValue;
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
  clarityProjectId: string | null;
  analyticsEnabled: boolean;
  primaryLogoPath: string | null;
  logoOnDarkPath: string | null;
  faviconPath: string | null;
  footerDescription: string | null;
  publisherName: string | null;
  defaultTitleTemplate: string | null;
  extras: Prisma.JsonValue;
}): PublicSiteSettings {
  const fallback = fallbackPublicSiteSettings();
  const social = Array.isArray(row.socialLinks)
    ? (row.socialLinks as SocialLinkSetting[])
    : fallback.socialLinks;
  const host = row.canonicalHost || fallback.canonicalHost;
  const siteUrl = host
    ? sanitizeSiteOrigin(
        /^https?:\/\//i.test(host)
          ? host
          : `https://${host.replace(/^https?:\/\//, "")}`,
      )
    : fallback.url;
  return {
    siteName: row.siteName || fallback.siteName,
    businessName: row.businessName || fallback.businessName,
    description:
      row.defaultSiteDescription ||
      row.defaultMetaDescription ||
      fallback.description,
    url: siteUrl,
    email: row.contactEmail || fallback.email,
    phone: row.contactPhone || fallback.phone,
    whatsapp: row.whatsapp || fallback.whatsapp,
    ogImage: resolveMediaUrl(row.defaultOgImagePath || fallback.ogImage),
    locale: row.defaultLocale === "en" ? "en_US" : row.defaultLocale,
    contactFormEnabled: row.contactFormEnabled,
    freeReviewFormEnabled: row.freeReviewFormEnabled,
    audienceEnabled: row.audienceEnabled,
    formSuccessMessage: row.formSuccessMessage,
    formFallbackMessage: row.formFallbackMessage,
    showPublicPricing: row.showPublicPricing,
    socialLinks: social.filter((s) => s.enabled && s.url),
    gaMeasurementId: row.gaMeasurementId || fallback.gaMeasurementId,
    gtmContainerId: row.gtmContainerId || fallback.gtmContainerId,
    clarityProjectId: row.clarityProjectId || fallback.clarityProjectId,
    analyticsEnabled: row.analyticsEnabled,
    primaryLogoPath: resolveMediaUrl(row.primaryLogoPath || fallback.primaryLogoPath),
    logoOnDarkPath: resolveMediaUrl(row.logoOnDarkPath || fallback.logoOnDarkPath),
    faviconPath: resolveMediaUrl(row.faviconPath || fallback.faviconPath),
    footerDescription: row.footerDescription,
    publisherName: row.publisherName || fallback.publisherName,
    defaultTitleTemplate: row.defaultTitleTemplate || fallback.defaultTitleTemplate,
    canonicalHost: hostFromUrl(siteUrl),
    presentation: resolveSitePresentation(parseSiteSettingsExtras(row.extras)),
  };
}

async function loadPublicSettingsUncached(): Promise<PublicSiteSettings> {
  if (!hasDatabaseUrl()) return fallbackPublicSiteSettings();
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "site" } });
    if (!row || !row.contactEmail) return fallbackPublicSiteSettings();
    return mapRow(row);
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      resetDatabaseConnection("siteSettings");
      return fallbackPublicSiteSettings();
    }
    throw error;
  }
}

export async function getPublicSettings(): Promise<PublicSiteSettings> {
  if (!hasDatabaseUrl()) return fallbackPublicSiteSettings();
  if (process.env.NODE_ENV === "test") {
    return loadPublicSettingsUncached();
  }
  return unstable_cache(loadPublicSettingsUncached, ["public-site-settings"], {
    tags: [CACHE_TAGS.siteSettings],
    revalidate: 300,
  })();
}

export async function getSiteSettingsAdmin() {
  if (!hasDatabaseUrl()) return null;
  return prisma.siteSettings.findUnique({ where: { id: "site" } });
}

export const siteSettingsUpdateSchema = z.object({
  siteName: z.string().min(1).max(120).optional(),
  businessName: z.string().min(1).max(120).optional(),
  defaultSiteDescription: z.string().max(500).nullable().optional(),
  defaultLocale: z.string().max(20).optional(),
  timezone: z.string().max(60).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(5).max(40).optional(),
  whatsapp: z.string().max(40).nullable().optional(),
  footerDescription: z.string().max(600).nullable().optional(),
  primaryLogoPath: z.string().max(500).nullable().optional(),
  logoOnDarkPath: z.string().max(500).nullable().optional(),
  brandMarkPath: z.string().max(500).nullable().optional(),
  faviconPath: z.string().max(500).nullable().optional(),
  defaultMetaTitle: z.string().max(200).nullable().optional(),
  defaultMetaDescription: z.string().max(500).nullable().optional(),
  defaultOgImagePath: z.string().max(500).nullable().optional(),
  defaultTitleTemplate: z.string().max(120).nullable().optional(),
  publisherName: z.string().max(120).nullable().optional(),
  gaMeasurementId: z.string().max(40).nullable().optional(),
  gtmContainerId: z.string().max(40).nullable().optional(),
  clarityProjectId: z.string().max(40).nullable().optional(),
  analyticsEnabled: z.boolean().optional(),
  contactFormEnabled: z.boolean().optional(),
  freeReviewFormEnabled: z.boolean().optional(),
  audienceEnabled: z.boolean().optional(),
  audienceRequireConfirmation: z.boolean().optional(),
  formSuccessMessage: z.string().max(500).nullable().optional(),
  formFallbackMessage: z.string().max(500).nullable().optional(),
  showPublicPricing: z.boolean().optional(),
  robotsDefaultIndex: z.boolean().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(["instagram", "facebook", "linkedin", "x", "youtube"]),
        url: z.string(),
        enabled: z.boolean(),
        displayOrder: z.number().int(),
      }),
    )
    .optional(),
  canonicalHost: z.string().max(200).nullable().optional(),
  extras: siteSettingsExtrasSchema.partial().optional(),
});

export function getAdminSiteSettingsExtras(row: { extras: Prisma.JsonValue } | null) {
  return resolveSitePresentation(parseSiteSettingsExtras(row?.extras));
}

export function getStoredSiteSettingsExtras(row: { extras: Prisma.JsonValue } | null) {
  return parseSiteSettingsExtras(row?.extras);
}

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;

export async function updateSiteSettings(input: {
  data: SiteSettingsUpdateInput;
  actorId: string;
  isSuperAdmin: boolean;
}) {
  const parsed = siteSettingsUpdateSchema.parse(input.data);
  const existing = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (!existing) throw new Error("Site settings not initialized.");

  if (parsed.canonicalHost !== undefined && !input.isSuperAdmin) {
    throw new Error("Only Super Admin can change the canonical host.");
  }
  if (parsed.showPublicPricing === true && !input.isSuperAdmin) {
    throw new Error("Only Super Admin can enable public pricing.");
  }
  if (
    (parsed.contactFormEnabled === false ||
      parsed.freeReviewFormEnabled === false) &&
    !input.isSuperAdmin
  ) {
    throw new Error("Only Super Admin can disable public forms.");
  }

  if (parsed.contactEmail && !parsed.contactEmail.includes("@")) {
    throw new Error("Enter a valid contact email.");
  }
  if (parsed.socialLinks) {
    for (const link of parsed.socialLinks) {
      if (link.enabled && link.url && !isSafePublicUrl(link.url)) {
        throw new Error(`Enter a valid HTTPS URL for ${link.platform}.`);
      }
    }
  }
  if (parsed.canonicalHost) {
    const host = parsed.canonicalHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
      throw new Error("Enter a valid canonical host (e.g. smartlancedesigns.com).");
    }
    parsed.canonicalHost = host;
  }

  if (parsed.extras) {
    for (const key of ["contactToEmail", "formToEmail"] as const) {
      const value = parsed.extras[key];
      if (value && !value.includes("@")) {
        throw new Error(`Enter a valid email for ${key}.`);
      }
    }
  }

  const criticalBefore = {
    canonicalHost: existing.canonicalHost,
    contactEmail: existing.contactEmail,
    contactPhone: existing.contactPhone,
    gaMeasurementId: existing.gaMeasurementId,
    gtmContainerId: existing.gtmContainerId,
    clarityProjectId: existing.clarityProjectId,
    contactFormEnabled: existing.contactFormEnabled,
    freeReviewFormEnabled: existing.freeReviewFormEnabled,
    showPublicPricing: existing.showPublicPricing,
  };

  const { extras: extrasPatch, ...scalarPatch } = parsed;
  const mergedExtras =
    extrasPatch !== undefined
      ? (mergeSiteSettingsExtras(
          existing.extras,
          extrasPatch as SiteSettingsExtras,
        ) as Prisma.InputJsonValue)
      : undefined;

  const updated = await prisma.siteSettings.update({
    where: { id: "site" },
    data: {
      ...scalarPatch,
      socialLinks: scalarPatch.socialLinks
        ? (scalarPatch.socialLinks as Prisma.InputJsonValue)
        : undefined,
      extras: mergedExtras,
      updatedById: input.actorId,
    },
  });

  await createContentRevision({
    entityType: "SiteSettings",
    entityId: "site",
    snapshot: updated as unknown as Prisma.InputJsonValue,
    createdById: input.actorId,
  });

  const action =
    parsed.canonicalHost !== undefined &&
    parsed.canonicalHost !== criticalBefore.canonicalHost
      ? "canonical_host_change"
      : "setting_change";

  await writeAuditLog({
    actorId: input.actorId,
    action,
    entityType: "SiteSettings",
    entityId: "site",
    metadata: {
      before: criticalBefore,
      changedKeys: Object.keys(parsed),
    },
  });

  revalidateSiteSettings();
  return updated;
}

export async function ensureSiteSettingsSeed(input?: {
  actorId?: string | null;
  force?: boolean;
}) {
  const existing = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (existing?.contactEmail && !input?.force) {
    return { created: false, row: existing };
  }
  const fallback = fallbackPublicSiteSettings();
  const data = {
    id: "site" as const,
    siteName: fallback.siteName,
    businessName: fallback.businessName,
    defaultSiteDescription: fallback.description,
    defaultMetaTitle: `${fallback.siteName} | ${siteConfig.tagline}`,
    defaultMetaDescription: fallback.description,
    defaultOgImagePath: fallback.ogImage,
    defaultLocale: "en",
    timezone: "Africa/Lagos",
    canonicalHost: fallback.canonicalHost,
    contactEmail: fallback.email,
    contactPhone: fallback.phone,
    whatsapp: fallback.whatsapp || null,
    primaryLogoPath: fallback.primaryLogoPath,
    logoOnDarkPath: fallback.logoOnDarkPath,
    brandMarkPath: "/images/brand/smartlance-mark.png",
    faviconPath: fallback.faviconPath,
    publisherName: fallback.publisherName,
    defaultTitleTemplate: fallback.defaultTitleTemplate,
    gaMeasurementId: fallback.gaMeasurementId,
    gtmContainerId: fallback.gtmContainerId,
    clarityProjectId: fallback.clarityProjectId,
    showPublicPricing: false,
    socialLinks: FALLBACK_SOCIAL as unknown as Prisma.InputJsonValue,
    updatedById: input?.actorId ?? null,
  };
  const row = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: data,
    update: input?.force ? data : { updatedAt: new Date() },
  });
  return { created: !existing?.contactEmail, row };
}
