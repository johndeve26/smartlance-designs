"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/lib/admin/phase4-actions";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { DeploymentEnvPanel } from "@/components/admin/DeploymentEnvPanel";
import type { DeploymentEnvRow } from "@/lib/admin/deployment-env-status";
import type { ResolvedSitePresentation } from "@/lib/site-settings-extras";

type Settings = {
  siteName: string;
  businessName: string;
  defaultSiteDescription: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsapp: string | null;
  canonicalHost: string | null;
  footerDescription: string | null;
  primaryLogoPath: string | null;
  logoOnDarkPath: string | null;
  brandMarkPath: string | null;
  faviconPath: string | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImagePath: string | null;
  defaultTitleTemplate: string | null;
  publisherName: string | null;
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
  clarityProjectId: string | null;
  analyticsEnabled: boolean;
  contactFormEnabled: boolean;
  freeReviewFormEnabled: boolean;
  formSuccessMessage: string | null;
  formFallbackMessage: string | null;
  showPublicPricing: boolean;
  robotsDefaultIndex: boolean;
  socialLinks: Array<{
    platform: string;
    url: string;
    enabled: boolean;
    displayOrder: number;
  }>;
  presentation: ResolvedSitePresentation;
};

function readExtras(formData: FormData) {
  const mediaMaxUploadMbRaw = String(formData.get("mediaMaxUploadMb") || "").trim();
  const mediaMaxUploadMb = mediaMaxUploadMbRaw
    ? Number(mediaMaxUploadMbRaw)
    : null;

  return {
    locationLabel: String(formData.get("locationLabel") || "") || null,
    serviceAreas: String(formData.get("serviceAreas") || "") || null,
    workingHours: String(formData.get("workingHours") || "") || null,
    streetAddress: String(formData.get("streetAddress") || "") || null,
    city: String(formData.get("city") || "") || null,
    region: String(formData.get("region") || "") || null,
    postalCode: String(formData.get("postalCode") || "") || null,
    country: String(formData.get("country") || "") || null,
    twitterHandle: String(formData.get("twitterHandle") || "") || null,
    responseExpectation: String(formData.get("responseExpectation") || "") || null,
    contactToEmail: String(formData.get("contactToEmail") || "") || null,
    contactFromEmail: String(formData.get("contactFromEmail") || "") || null,
    formToEmail: String(formData.get("formToEmail") || "") || null,
    mediaMaxUploadMb:
      mediaMaxUploadMb != null && Number.isFinite(mediaMaxUploadMb)
        ? mediaMaxUploadMb
        : null,
  };
}

export function SettingsForm({
  settings,
  isSuperAdmin,
  envStatus,
  deploymentEnvRows,
}: {
  settings: Settings;
  isSuperAdmin: boolean;
  envStatus: { email: string; media: string; analytics: string };
  deploymentEnvRows: DeploymentEnvRow[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const instagram =
    settings.socialLinks.find((s) => s.platform === "instagram") || {
      platform: "instagram",
      url: "",
      enabled: false,
      displayOrder: 0,
    };
  const xLink =
    settings.socialLinks.find((s) => s.platform === "x") || {
      platform: "x",
      url: "",
      enabled: false,
      displayOrder: 1,
    };
  const presentation = settings.presentation;

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = {
          siteName: String(fd.get("siteName") || ""),
          businessName: String(fd.get("businessName") || ""),
          defaultSiteDescription: String(fd.get("defaultSiteDescription") || "") || null,
          contactEmail: String(fd.get("contactEmail") || ""),
          contactPhone: String(fd.get("contactPhone") || ""),
          whatsapp: String(fd.get("whatsapp") || "") || null,
          footerDescription: String(fd.get("footerDescription") || "") || null,
          primaryLogoPath: String(fd.get("primaryLogoPath") || "") || null,
          logoOnDarkPath: String(fd.get("logoOnDarkPath") || "") || null,
          brandMarkPath: String(fd.get("brandMarkPath") || "") || null,
          faviconPath: String(fd.get("faviconPath") || "") || null,
          defaultMetaTitle: String(fd.get("defaultMetaTitle") || "") || null,
          defaultMetaDescription:
            String(fd.get("defaultMetaDescription") || "") || null,
          defaultOgImagePath: String(fd.get("defaultOgImagePath") || "") || null,
          defaultTitleTemplate:
            String(fd.get("defaultTitleTemplate") || "") || null,
          publisherName: String(fd.get("publisherName") || "") || null,
          gaMeasurementId: String(fd.get("gaMeasurementId") || "") || null,
          gtmContainerId: String(fd.get("gtmContainerId") || "") || null,
          clarityProjectId: String(fd.get("clarityProjectId") || "") || null,
          analyticsEnabled: fd.get("analyticsEnabled") === "on",
          contactFormEnabled: fd.get("contactFormEnabled") === "on",
          freeReviewFormEnabled: fd.get("freeReviewFormEnabled") === "on",
          formSuccessMessage: String(fd.get("formSuccessMessage") || "") || null,
          formFallbackMessage:
            String(fd.get("formFallbackMessage") || "") || null,
          showPublicPricing: fd.get("showPublicPricing") === "on",
          robotsDefaultIndex: fd.get("robotsDefaultIndex") === "on",
          canonicalHost: isSuperAdmin
            ? String(fd.get("canonicalHost") || "") || null
            : undefined,
          socialLinks: [
            {
              platform: "instagram" as const,
              url: String(fd.get("instagramUrl") || ""),
              enabled: fd.get("instagramEnabled") === "on",
              displayOrder: 0,
            },
            {
              platform: "x" as const,
              url: String(fd.get("xUrl") || ""),
              enabled: fd.get("xEnabled") === "on",
              displayOrder: 1,
            },
          ],
          extras: readExtras(fd),
        };
        start(async () => {
          const res = await saveSettingsAction(data);
          setMessage(res.ok ? "Settings saved." : res.error);
        });
      }}
    >
      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">General</h2>
        <Field name="siteName" label="Site name" defaultValue={settings.siteName} />
        <Field name="businessName" label="Business name" defaultValue={settings.businessName} />
        <Field
          name="defaultSiteDescription"
          label="Default site description"
          defaultValue={settings.defaultSiteDescription || ""}
          textarea
        />
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Contact</h2>
        <Field name="contactEmail" label="Public contact email" defaultValue={settings.contactEmail || ""} required />
        <Field name="contactPhone" label="Public phone" defaultValue={settings.contactPhone || ""} required />
        <Field name="whatsapp" label="WhatsApp (optional)" defaultValue={settings.whatsapp || ""} />
        <Field name="footerDescription" label="Footer description override" defaultValue={settings.footerDescription || ""} textarea />
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Location &amp; hours</h2>
        <p className="text-xs text-neutral-500">
          Public-facing location copy. Empty fields are omitted from structured data.
        </p>
        <Field
          name="locationLabel"
          label="Location label"
          defaultValue={presentation.locationLabel}
        />
        <Field
          name="serviceAreas"
          label="Service areas"
          defaultValue={presentation.serviceAreas}
        />
        <Field
          name="workingHours"
          label="Working hours"
          defaultValue={presentation.workingHours}
        />
        <Field
          name="streetAddress"
          label="Street address"
          defaultValue={presentation.address.streetAddress}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="city" label="City" defaultValue={presentation.address.addressLocality} />
          <Field name="region" label="Region / state" defaultValue={presentation.address.addressRegion} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="postalCode" label="Postal code" defaultValue={presentation.address.postalCode} />
          <Field name="country" label="Country" defaultValue={presentation.address.addressCountry} />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Brand</h2>
        <MediaPicker name="primaryLogoPath" label="Primary logo" defaultValue={settings.primaryLogoPath} />
        <MediaPicker name="logoOnDarkPath" label="Logo on dark" defaultValue={settings.logoOnDarkPath} />
        <MediaPicker name="brandMarkPath" label="Brand mark" defaultValue={settings.brandMarkPath} />
        <MediaPicker name="faviconPath" label="Favicon" defaultValue={settings.faviconPath} />
        <p className="text-xs text-neutral-500">
          Brand colors remain code-managed (approved tokens). No public theme
          builder.
        </p>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Social</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="instagramEnabled" defaultChecked={instagram.enabled} />
          Instagram enabled
        </label>
        <Field name="instagramUrl" label="Instagram URL" defaultValue={instagram.url} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="xEnabled" defaultChecked={xLink.enabled} />
          X (Twitter) enabled
        </label>
        <Field name="xUrl" label="X profile URL" defaultValue={xLink.url} />
        <Field
          name="twitterHandle"
          label="X / Twitter handle (for metadata, e.g. @smartlance)"
          defaultValue={presentation.twitterHandle}
        />
        <p className="text-xs text-neutral-500">
          Facebook / LinkedIn remain blank until verified.
        </p>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">SEO defaults</h2>
        <Field name="defaultMetaTitle" label="Default meta title" defaultValue={settings.defaultMetaTitle || ""} />
        <Field name="defaultMetaDescription" label="Default meta description" defaultValue={settings.defaultMetaDescription || ""} textarea />
        <Field name="defaultTitleTemplate" label="Title template" defaultValue={settings.defaultTitleTemplate || ""} />
        <Field name="publisherName" label="Publisher name" defaultValue={settings.publisherName || ""} />
        <MediaPicker name="defaultOgImagePath" label="Default OG image" defaultValue={settings.defaultOgImagePath} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="robotsDefaultIndex" defaultChecked={settings.robotsDefaultIndex} />
          Default indexable
        </label>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Analytics (public IDs only)</h2>
        <Field name="gaMeasurementId" label="GA4 measurement ID" defaultValue={settings.gaMeasurementId || ""} />
        <Field name="gtmContainerId" label="GTM container ID" defaultValue={settings.gtmContainerId || ""} />
        <Field name="clarityProjectId" label="Clarity project ID" defaultValue={settings.clarityProjectId || ""} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="analyticsEnabled" defaultChecked={settings.analyticsEnabled} />
          Analytics enabled
        </label>
        <p className="text-xs text-neutral-500">
          Env/provider status: {envStatus.analytics}. Secrets are never displayed.
        </p>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Forms</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="contactFormEnabled"
            defaultChecked={settings.contactFormEnabled}
            disabled={!isSuperAdmin && !settings.contactFormEnabled}
          />
          Contact form enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="freeReviewFormEnabled"
            defaultChecked={settings.freeReviewFormEnabled}
            disabled={!isSuperAdmin && !settings.freeReviewFormEnabled}
          />
          Free review form enabled
        </label>
        <Field name="formSuccessMessage" label="Success message" defaultValue={settings.formSuccessMessage || ""} textarea />
        <Field name="formFallbackMessage" label="Fallback contact message" defaultValue={settings.formFallbackMessage || ""} textarea />
        <Field
          name="responseExpectation"
          label="Response expectation (thank-you screens)"
          defaultValue={presentation.responseExpectation}
          textarea
        />
        <Field
          name="contactToEmail"
          label="Notification recipient (Contact / Review)"
          defaultValue={presentation.contactToEmail || ""}
        />
        <Field
          name="contactFromEmail"
          label="Notification sender (Resend From)"
          defaultValue={presentation.contactFromEmail || ""}
        />
        <Field
          name="formToEmail"
          label="Legacy form recipient (optional override)"
          defaultValue={presentation.formToEmail || ""}
        />
        <p className="text-xs text-neutral-500">
          Email delivery secrets: {envStatus.email}. Media storage: {envStatus.media}.
          Resend API key and webhooks remain environment-only.
        </p>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Media</h2>
        <Field
          name="mediaMaxUploadMb"
          label="Max upload size (MB)"
          defaultValue={String(presentation.mediaMaxUploadMb)}
        />
        <p className="text-xs text-neutral-500">
          Storage provider and S3 credentials are deployment-only ({envStatus.media}).
        </p>
      </section>

      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Public site / Advanced</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="showPublicPricing"
            defaultChecked={settings.showPublicPricing}
            disabled={!isSuperAdmin}
          />
          Show numeric public pricing (Super Admin)
        </label>
        {isSuperAdmin ? (
          <Field
            name="canonicalHost"
            label="Canonical host (Super Admin)"
            defaultValue={settings.canonicalHost || ""}
          />
        ) : (
          <p className="text-sm text-neutral-600">
            Canonical host: {settings.canonicalHost || "not set"}
          </p>
        )}
      </section>

      <DeploymentEnvPanel rows={deploymentEnvRows} />

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
      {message ? (
        <p className="text-sm" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  textarea,
  required,
}: {
  name: string;
  label: string;
  defaultValue: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={3}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          required={required}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      )}
    </label>
  );
}
