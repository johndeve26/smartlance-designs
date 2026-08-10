import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${figtree.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
