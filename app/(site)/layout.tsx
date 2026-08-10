import { SiteFooter, SiteHeader, SitePreFooter } from "@/components/layout/site-chrome";
import { AnalyticsScripts } from "@/components/layout/analytics-scripts";
import { StructuredData } from "@/components/ui/structured-data";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSettings();
  const org = organizationJsonLd({
    name: settings.siteName,
    legalName: settings.businessName,
    url: settings.url,
    description: settings.description,
    email: settings.email,
    phone: settings.phone,
    sameAs: settings.socialLinks.map((s) => s.url),
    logoPath: settings.primaryLogoPath || "/images/brand/smartlance-logo-v2.webp",
    address: settings.presentation.address,
  });
  const website = websiteJsonLd({
    name: settings.siteName,
    url: settings.url,
    description: settings.description,
  });

  return (
    <>
      <StructuredData data={[org, website]} />
      {settings.analyticsEnabled ? (
        <AnalyticsScripts
          gaId={settings.gaMeasurementId || ""}
          gtmId={settings.gtmContainerId || ""}
          clarityId={settings.clarityProjectId || ""}
        />
      ) : null}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SitePreFooter />
      <SiteFooter />
    </>
  );
}
