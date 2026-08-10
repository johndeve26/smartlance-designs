import type { Metadata } from "next";
import { headers } from "next/headers";
import { Figtree, Syne } from "next/font/google";
import { SiteFooter, SiteHeader, SitePreFooter } from "@/components/layout/site-chrome";
import { AnalyticsScripts } from "@/components/layout/analytics-scripts";
import { StructuredData } from "@/components/ui/structured-data";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import { siteConfig } from "@/lib/site";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bingVerification = process.env.BING_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(settings.url),
    title: {
      default: `${settings.siteName} | ${siteConfig.tagline}`,
      template: settings.defaultTitleTemplate || `%s | ${settings.siteName}`,
    },
    description: settings.description,
    applicationName: settings.siteName,
    authors: [{ name: settings.siteName }],
    creator: settings.siteName,
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
    ...(bingVerification
      ? { other: { "msvalidate.01": bingVerification } }
      : {}),
    icons: {
      icon: [
        {
          url: settings.faviconPath || "/images/brand/favicon-32.png",
          sizes: "32x32",
          type: "image/png",
        },
      ],
      apple: [{ url: "/images/brand/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      locale: settings.locale,
      url: settings.url,
      siteName: settings.siteName,
      title: settings.siteName,
      description: settings.description,
      images: [
        {
          url: settings.ogImage,
          width: 1200,
          height: 630,
          alt: settings.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteName,
      description: settings.description,
      images: [settings.ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSettings();
  const headerList = await headers();
  const isAdminRoute = headerList.get("x-smartlance-admin") === "1";
  const isPortalRoute = headerList.get("x-smartlance-portal") === "1";
  const isWorkspaceRoute = headerList.get("x-smartlance-workspace") === "1";
  const hidePublicChrome = isAdminRoute || isPortalRoute || isWorkspaceRoute;
  const org = organizationJsonLd({
    name: settings.siteName,
    legalName: settings.businessName,
    url: settings.url,
    description: settings.description,
    email: settings.email,
    phone: settings.phone,
    sameAs: settings.socialLinks.map((s) => s.url),
    logoPath: settings.primaryLogoPath || "/images/brand/smartlance-logo.png",
    address: settings.presentation.address,
  });
  const website = websiteJsonLd({
    name: settings.siteName,
    url: settings.url,
    description: settings.description,
  });

  return (
    <html lang="en" className={`${syne.variable} ${figtree.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        {!hidePublicChrome ? <StructuredData data={[org, website]} /> : null}
        {!hidePublicChrome && settings.analyticsEnabled ? (
          <AnalyticsScripts
            gaId={settings.gaMeasurementId || ""}
            gtmId={settings.gtmContainerId || ""}
            clarityId={settings.clarityProjectId || ""}
          />
        ) : null}
        {!hidePublicChrome ? <SiteHeader /> : null}
        <main className="flex-1">{children}</main>
        {!hidePublicChrome ? <SitePreFooter /> : null}
        {!hidePublicChrome ? <SiteFooter /> : null}
      </body>
    </html>
  );
}
