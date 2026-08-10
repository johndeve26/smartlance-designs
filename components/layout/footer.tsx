import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { SocialLinks } from "@/components/ui/social-links";
import {
  companyDetails as defaultCompany,
  footerNavigation as defaultFooterNav,
  getPublishedSocialLinks,
  primaryCta as defaultPrimaryCta,
} from "@/data/navigation";
import { siteConfig } from "@/lib/site";
import { SubscribeSection } from "@/components/audience/subscribe-section";
import { TrackedMailto, TrackedTel } from "@/components/forms/tracked-links";
import type { SocialLink } from "@/types";

type FooterNav = typeof defaultFooterNav;

type FooterProps = {
  footerNavigation?: FooterNav;
  primaryCta?: { label: string; href: string };
  company?: {
    name: string;
    email: string;
    phone: string;
    description?: string | null;
  };
  socials?: SocialLink[];
  audienceEnabled?: boolean;
};

export function Footer({
  footerNavigation = defaultFooterNav,
  primaryCta = defaultPrimaryCta,
  company = {
    name: defaultCompany.name,
    email: defaultCompany.email,
    phone: defaultCompany.phone,
    description: null,
  },
  socials = getPublishedSocialLinks(),
  audienceEnabled = true,
}: FooterProps) {
  const year = new Date().getFullYear();
  const positioning = company.description || siteConfig.tagline;

  return (
    <footer className="border-t border-white/10 bg-surface-dark text-white print:hidden">
      <Container className="py-14 lg:py-16">
        <div className="grid gap-x-8 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Logo onDark />
            <p className="mt-5 max-w-xs text-[0.9375rem] leading-[1.65] text-white/70">
              {positioning}
            </p>
            <div className="mt-6 space-y-2.5 text-[0.9375rem] text-white/80">
              <p>
                <TrackedMailto
                  email={company.email}
                  className="font-medium hover:text-white"
                />
              </p>
              {company.phone ? (
                <p>
                  <TrackedTel
                    phone={company.phone}
                    className="font-medium hover:text-white"
                  />
                </p>
              ) : null}
            </div>
            {socials.length > 0 ? (
              <SocialLinks links={socials} onDark className="mt-6" />
            ) : null}
            <div className="mt-7">
              <Link
                href={primaryCta.href}
                className="inline-flex h-11 items-center justify-center rounded-[0.5rem] bg-cta px-5 text-sm font-semibold text-cta-foreground transition-colors hover:bg-cta-hover"
              >
                {primaryCta.label}
              </Link>
            </div>
          </div>

          <FooterColumn
            title="Services"
            links={footerNavigation.services}
            className="lg:col-span-2"
          />
          <FooterColumn
            title="AI & Automation"
            links={footerNavigation.aiAutomation}
            className="lg:col-span-2"
          />
          <FooterColumn
            title="Solutions"
            links={footerNavigation.solutions}
            className="lg:col-span-2"
          />
          <FooterColumn
            title="Company"
            links={footerNavigation.company}
            className="lg:col-span-2"
          />
          <FooterColumn
            title="Resources"
            links={footerNavigation.resources}
            className="lg:col-span-4"
          />
        </div>

        <SubscribeSection
          source="FOOTER"
          sourceUrl="/"
          variant="footer"
          enabled={audienceEnabled}
        />

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-[0.9375rem] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {company.name}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerNavigation.legal.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white/50">
        {title}
      </p>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-[0.9375rem] leading-snug text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
