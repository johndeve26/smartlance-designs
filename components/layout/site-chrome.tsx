import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PreFooterCta } from "@/components/layout/pre-footer-cta";
import { getPublicNavigation } from "@/lib/repositories/navigationRepository";
import { getPublicSettings } from "@/lib/repositories/siteSettingsRepository";
import type { SocialLink } from "@/types";

export async function SiteHeader() {
  const nav = await getPublicNavigation();
  return <Header primaryCta={nav.primaryCta} />;
}

export async function SitePreFooter() {
  const nav = await getPublicNavigation();
  return <PreFooterCta primaryCta={nav.primaryCta} />;
}

export async function SiteFooter() {
  const [nav, settings] = await Promise.all([
    getPublicNavigation(),
    getPublicSettings(),
  ]);
  const socials: SocialLink[] = settings.socialLinks.map((s) => ({
    label: s.platform === "instagram" ? "Instagram" : s.platform,
    href: s.url,
    icon: (s.platform === "instagram"
      ? "instagram"
      : s.platform === "facebook"
        ? "facebook"
        : "linkedin") as SocialLink["icon"],
    isPlaceholder: false,
  }));

  return (
        <Footer
      footerNavigation={nav.footerNavigation}
      primaryCta={nav.primaryCta}
      company={{
        name: settings.siteName,
        email: settings.email,
        phone: settings.phone,
        description: settings.footerDescription,
      }}
      socials={socials}
      audienceEnabled={settings.audienceEnabled}
    />
  );
}
