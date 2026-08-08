import type { NavItem, SocialLink } from "@/types";
import { siteConfig } from "@/lib/site";

export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type NavLinkGroup = {
  title: string;
  links: NavLink[];
};

export type HeaderTopItem =
  | { id: "services"; label: string; href: string; menu: "mega-services" }
  | { id: "solutions"; label: string; href: string; menu: "solutions" }
  | { id: "work"; label: string; href: string }
  | { id: "industries"; label: string; href: string; menu: "industries" }
  | { id: "resources"; label: string; href: string; menu: "mega-resources" }
  | { id: "about"; label: string; href: string };

/** Curated top-level header IA — mega menus defined separately below. */
export const headerTopNavigation: HeaderTopItem[] = [
  { id: "services", label: "Services", href: "/services", menu: "mega-services" },
  { id: "solutions", label: "Solutions", href: "/solutions", menu: "solutions" },
  { id: "work", label: "Work", href: "/work" },
  { id: "industries", label: "Industries", href: "/industries", menu: "industries" },
  { id: "resources", label: "Resources", href: "/resources", menu: "mega-resources" },
  { id: "about", label: "About", href: "/about" },
];

export const servicesMegaMenu: {
  groups: NavLinkGroup[];
  platforms: NavLink[];
  actions: NavLink[];
} = {
  groups: [
    {
      title: "Build",
      links: [
        { label: "Website Design", href: "/services/website-design" },
        { label: "Website Development", href: "/services/website-development" },
        { label: "Website Redesign", href: "/services/website-redesign" },
        {
          label: "E-commerce Development",
          href: "/services/ecommerce-development",
        },
        { label: "Landing Page Design", href: "/services/landing-page-design" },
      ],
    },
    {
      title: "Grow",
      links: [
        { label: "SEO", href: "/seo", description: "Search visibility built into the site" },
        { label: "Local SEO", href: "/seo/local-seo" },
        {
          label: "Conversion Rate Optimization",
          href: "/services/conversion-rate-optimization",
        },
        {
          label: "Website Performance Optimization",
          href: "/services/website-performance-optimization",
        },
      ],
    },
    {
      title: "Improve",
      links: [
        { label: "Website Strategy", href: "/services/website-strategy" },
        { label: "Website Audit", href: "/services/website-audit" },
        { label: "Website Migration", href: "/services/website-migration" },
        { label: "UI/UX Design", href: "/services/ui-ux-design" },
      ],
    },
  ],
  platforms: [
    { label: "WordPress", href: "/platforms/wordpress" },
    { label: "Shopify", href: "/platforms/shopify" },
    { label: "Webflow", href: "/platforms/webflow" },
    { label: "WooCommerce", href: "/platforms/woocommerce" },
    { label: "View All Platforms", href: "/platforms" },
  ],
  actions: [
    { label: "View All Services", href: "/services" },
    { label: "Pricing & Project Scope", href: "/pricing" },
  ],
};

export const solutionsMenu: NavLink[] = [
  {
    label: "Website Not Generating Leads",
    href: "/solutions/website-not-generating-leads",
    description: "Turn traffic into qualified enquiries",
  },
  {
    label: "Website Not Ranking",
    href: "/solutions/website-not-ranking",
    description: "Improve search visibility and intent match",
  },
  {
    label: "Slow Website",
    href: "/solutions/slow-website",
    description: "Speed, stability and Core Web Vitals",
  },
  {
    label: "Outdated Website",
    href: "/solutions/outdated-website",
    description: "Modernise design, UX and credibility",
  },
  {
    label: "Low Website Conversions",
    href: "/solutions/low-website-conversions",
    description: "Clarify offers and conversion paths",
  },
  {
    label: "New Business Website",
    href: "/solutions/new-business-website",
    description: "Launch with clear positioning from day one",
  },
  {
    label: "E-commerce Growth",
    href: "/solutions/ecommerce-growth",
    description: "Improve product discovery and checkout flow",
  },
  {
    label: "Local Visibility",
    href: "/solutions/local-business-visibility",
    description: "Get found by nearby customers",
  },
  { label: "View All Solutions", href: "/solutions" },
];

export const industriesMenu: NavLink[] = [
  { label: "Short-Term Rentals", href: "/industries/short-term-rentals" },
  { label: "Hospitality", href: "/industries/hospitality" },
  { label: "Cabin Rentals", href: "/industries/cabin-rentals" },
  { label: "Real Estate", href: "/industries/real-estate" },
  { label: "Property Management", href: "/industries/property-management" },
  { label: "Explore All Industries", href: "/industries" },
];

export const resourcesMegaMenu: {
  groups: NavLinkGroup[];
  footerLink: NavLink;
} = {
  groups: [
    {
      title: "Learn",
      links: [
        { label: "Insights", href: "/blog" },
        { label: "Guides", href: "/guides" },
        { label: "Glossary", href: "/glossary" },
      ],
    },
    {
      title: "Make decisions",
      links: [
        { label: "Comparisons", href: "/compare" },
        {
          label: "Website Platform Selector",
          href: "/tools/website-platform-selector",
        },
      ],
    },
    {
      title: "Get things done",
      links: [
        { label: "Checklists", href: "/checklists" },
        { label: "Templates", href: "/templates" },
      ],
    },
  ],
  footerLink: { label: "Explore All Resources", href: "/resources" },
};

/** Flattened mobile Services accordion (one level). */
export const mobileServicesLinks: NavLink[] = [
  { label: "Website Design", href: "/services/website-design" },
  { label: "Website Development", href: "/services/website-development" },
  { label: "Website Redesign", href: "/services/website-redesign" },
  { label: "SEO", href: "/seo" },
  { label: "E-commerce Development", href: "/services/ecommerce-development" },
  {
    label: "Conversion Rate Optimization",
    href: "/services/conversion-rate-optimization",
  },
  { label: "View All Services", href: "/services" },
  { label: "View All Platforms", href: "/platforms" },
];

export const mobileResourcesLinks: NavLink[] = [
  { label: "Insights", href: "/blog" },
  { label: "Guides", href: "/guides" },
  { label: "Comparisons", href: "/compare" },
  { label: "Checklists", href: "/checklists" },
  { label: "Glossary", href: "/glossary" },
  { label: "Templates", href: "/templates" },
  {
    label: "Website Platform Selector",
    href: "/tools/website-platform-selector",
  },
  { label: "All Resources", href: "/resources" },
];

export const mobileUtilityLinks: NavLink[] = [
  { label: "Project Planner", href: "/project-planner" },
  { label: "Pricing & Project Scope", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export const preFooterCta = {
  title: "Have a website project in mind?",
  description:
    "Tell us what you're building, redesigning or trying to improve. We'll help you figure out the right next step.",
  primary: siteConfig.cta.primary,
  secondary: {
    label: "Plan Your Project",
    href: "/project-planner",
  },
};

/** Legacy CMS-compatible flat tree (seed / fallback). */
export const mainNavigation: NavItem[] = headerTopNavigation.map((item) => ({
  label: item.label,
  href: item.href,
}));

export const footerNavigation = {
  services: [
    { label: "Website Design", href: "/services/website-design" },
    { label: "Website Development", href: "/services/website-development" },
    { label: "Website Redesign", href: "/services/website-redesign" },
    { label: "SEO", href: "/seo" },
    { label: "E-commerce Development", href: "/services/ecommerce-development" },
    {
      label: "Conversion Rate Optimization",
      href: "/services/conversion-rate-optimization",
    },
    {
      label: "Website Performance Optimization",
      href: "/services/website-performance-optimization",
    },
    { label: "View All Services", href: "/services" },
  ],
  solutions: [
    {
      label: "Website Not Generating Leads",
      href: "/solutions/website-not-generating-leads",
    },
    { label: "Website Not Ranking", href: "/solutions/website-not-ranking" },
    { label: "Slow Website", href: "/solutions/slow-website" },
    { label: "Outdated Website", href: "/solutions/outdated-website" },
    {
      label: "Low Website Conversions",
      href: "/solutions/low-website-conversions",
    },
    { label: "View All Solutions", href: "/solutions" },
  ],
  explore: [
    { label: "Work", href: "/work" },
    { label: "Industries", href: "/industries" },
    { label: "Platforms", href: "/platforms" },
    { label: "Pricing & Project Scope", href: "/pricing" },
    { label: "Project Planner", href: "/project-planner" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Insights", href: "/blog" },
    { label: "Guides", href: "/guides" },
    { label: "Comparisons", href: "/compare" },
    { label: "Checklists", href: "/checklists" },
    { label: "Glossary", href: "/glossary" },
    { label: "Templates", href: "/templates" },
    { label: "Tools", href: "/tools" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy-statement" },
    { label: "Terms", href: "/legal/terms-and-condition" },
    { label: "Sitemap", href: "/sitemap.xml" },
  ],
};

export const primaryCta = siteConfig.cta.primary;
export const secondaryCta = siteConfig.cta.secondary;

/** Only links with isPlaceholder: false render in the UI. */
export const socialLinks: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/smartlance_designs/",
    icon: "instagram",
    isPlaceholder: false,
  },
  {
    label: "Facebook",
    href: "",
    icon: "facebook",
    isPlaceholder: true,
  },
  {
    label: "LinkedIn",
    href: "",
    icon: "linkedin",
    isPlaceholder: true,
  },
];

export function getPublishedSocialLinks() {
  return socialLinks.filter(
    (link) => !link.isPlaceholder && link.href.trim().length > 0,
  );
}

export const companyDetails = {
  name: siteConfig.name,
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  email: siteConfig.email,
  phone: siteConfig.phone,
  whatsapp: siteConfig.whatsapp,
  socialLinks,
};

/** @deprecated Use servicesMegaMenu — kept for any legacy imports during transition */
export const desktopResourceNavGroups = resourcesMegaMenu.groups;
export const mobileResourceNavGroups = resourcesMegaMenu.groups;
export const desktopPlatformNavGroups: NavLinkGroup[] = [];
export const mobileServiceNavGroups: NavLinkGroup[] = [];
export const mobilePlatformNavGroups: NavLinkGroup[] = [];
