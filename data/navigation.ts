import type { NavItem, SocialLink } from "@/types";
import { siteConfig } from "@/lib/site";
import { AI_AUTOMATION_HUB, aiAutomationPaths } from "@/lib/public/ai-automation-routes";

export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type NavLinkGroup = {
  title: string;
  links: NavLink[];
};

export type HeaderMenuId =
  | "mega-services"
  | "ai-automation"
  | "solutions"
  | "work"
  | "mega-resources"
  | "company";

export type HeaderTopItem =
  | {
      id: string;
      label: string;
      href: string;
      menu: HeaderMenuId;
    }
  | {
      id: string;
      label: string;
      href: string;
    };

/** Curated top-level header IA — mega menus defined separately below. */
export const headerTopNavigation: HeaderTopItem[] = [
  { id: "services", label: "Services", href: "/services", menu: "mega-services" },
  {
    id: "ai-automation",
    label: "AI & Automation",
    href: AI_AUTOMATION_HUB,
    menu: "ai-automation",
  },
  { id: "solutions", label: "Solutions", href: "/solutions", menu: "solutions" },
  { id: "work", label: "Work", href: "/work", menu: "work" },
  { id: "resources", label: "Resources", href: "/resources", menu: "mega-resources" },
  { id: "company", label: "Company", href: "/about", menu: "company" },
];

export const servicesMegaMenu: {
  links: NavLink[];
  platforms: NavLink[];
  actions: NavLink[];
} = {
  links: [
    { label: "Web Design", href: "/services/website-design" },
    { label: "Development", href: "/services/website-development" },
    { label: "SEO", href: "/seo" },
    {
      label: "Conversion",
      href: "/services/conversion-rate-optimization",
    },
    { label: "Maintenance", href: "/services/website-maintenance" },
    { label: "Digital Growth", href: "/services/digital-marketing" },
  ],
  platforms: [
    {
      label: "Website & Commerce",
      href: "/platforms#websites",
      description: "WordPress, Shopify, Webflow and storefront platforms",
    },
    {
      label: "CRM & Business",
      href: "/platforms#connected",
      description: "HubSpot, Salesforce and connected business stacks",
    },
    {
      label: "AI & Automation",
      href: "/platforms",
      description: "Platforms for AI-enabled and automated workflows",
    },
    { label: "View All Platforms", href: "/platforms" },
  ],
  actions: [{ label: "View All Services", href: "/services" }],
};

export const aiAutomationMenu: NavLink[] = [
  {
    label: "AI & Automation Overview",
    href: AI_AUTOMATION_HUB,
    description: "Practical AI, automation and integrations for business workflows",
  },
  {
    label: "AI Agents",
    href: aiAutomationPaths["ai-agents"].path,
    description: "Task-focused assistants with approved information and human handoff",
  },
  {
    label: "Workflow Automation",
    href: aiAutomationPaths["workflow-automation"].path,
    description: "Stop moving information manually between tools",
  },
  {
    label: "Voice AI",
    href: aiAutomationPaths["voice-ai"].path,
    description: "Professional inbound enquiry and routing workflows",
  },
  {
    label: "CRM & Lead Automation",
    href: aiAutomationPaths["crm-lead-automation"].path,
    description: "Capture, qualify, assign and follow up on leads consistently",
  },
  {
    label: "Integrations",
    href: aiAutomationPaths.integrations.path,
    description: "Connect websites, CRM, email, messaging and business APIs",
  },
  {
    label: "Custom AI Tools",
    href: aiAutomationPaths["custom-ai-tools"].path,
    description: "Focused tools when off-the-shelf software does not fit",
  },
];

export const solutionsMenu: NavLink[] = [
  {
    label: "Website Problems",
    href: "/solutions#website-quality",
    description: "Slow, outdated or underperforming websites",
  },
  {
    label: "Growth Problems",
    href: "/solutions#visibility",
    description: "Search visibility and discovery challenges",
  },
  {
    label: "Respond to Leads Faster",
    href: "/solutions/respond-to-leads-faster",
    description: "Follow-up is slow or inconsistent after enquiries arrive",
  },
  {
    label: "Automate Repetitive Work",
    href: "/solutions/automate-repetitive-work",
    description: "Manual copying and routine handoffs between tools",
  },
  {
    label: "Connect Business Tools",
    href: "/solutions/connect-business-tools",
    description: "Systems that should share information but do not",
  },
  { label: "View All Solutions", href: "/solutions" },
];

export const workMenu: NavLink[] = [
  {
    label: "Websites",
    href: "/work?capability=websites",
    description: "Design, development and SEO projects",
  },
  {
    label: "AI",
    href: "/work?capability=ai",
    description: "AI products, integrations and intelligent experiences",
  },
  {
    label: "Automation",
    href: "/work?capability=automation",
    description: "Workflow automation and connected systems",
  },
  { label: "View All Work", href: "/work" },
];

export const companyMenu: NavLink[] = [
  { label: "About", href: "/about", description: "Who we are and how we think" },
  {
    label: "How We Work",
    href: "/how-we-work",
    description: "Our structured client journey",
  },
  { label: "Contact", href: "/contact", description: "Tell us about your project" },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Project scope and pricing guidance",
  },
];

export const resourcesMegaMenu: {
  groups: NavLinkGroup[];
  footerLink: NavLink;
} = {
  groups: [
    {
      title: "Free Tools",
      links: [
        { label: "Free Website Review", href: "/free-website-review" },
        { label: "Website Brief Builder", href: "/website-brief" },
        { label: "Project Planner", href: "/project-planner" },
      ],
    },
    {
      title: "Learn",
      links: [
        { label: "Guides", href: "/guides" },
        { label: "Insights", href: "/blog" },
        { label: "Glossary", href: "/glossary" },
        { label: "Templates", href: "/templates" },
      ],
    },
  ],
  footerLink: { label: "Explore All Resources", href: "/resources" },
};

/** Flattened mobile Services accordion. */
export const mobileServicesLinks: NavLink[] = [
  ...servicesMegaMenu.links,
  { label: "View All Services", href: "/services" },
  ...servicesMegaMenu.platforms,
];

export const mobileAiAutomationLinks: NavLink[] = [
  { label: "Overview", href: AI_AUTOMATION_HUB },
  { label: "AI Agents", href: aiAutomationPaths["ai-agents"].path },
  { label: "Workflow Automation", href: aiAutomationPaths["workflow-automation"].path },
  { label: "Voice AI", href: aiAutomationPaths["voice-ai"].path },
  { label: "CRM & Lead Automation", href: aiAutomationPaths["crm-lead-automation"].path },
  { label: "Integrations", href: aiAutomationPaths.integrations.path },
];

export const mobileResourcesLinks: NavLink[] = [
  ...resourcesMegaMenu.groups.flatMap((group) => group.links),
  resourcesMegaMenu.footerLink,
  { label: "Checklists", href: "/checklists" },
  { label: "All Free Tools", href: "/free-tools" },
];

export const mobileUtilityLinks: NavLink[] = [
  { label: "Project Planner", href: "/project-planner" },
  { label: "Pricing", href: "/pricing" },
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
    { label: "Web Design", href: "/services/website-design" },
    { label: "Development", href: "/services/website-development" },
    { label: "SEO", href: "/seo" },
    { label: "Conversion", href: "/services/conversion-rate-optimization" },
    { label: "Maintenance", href: "/services/website-maintenance" },
    { label: "Digital Growth", href: "/services/digital-marketing" },
    { label: "View All Services", href: "/services" },
  ],
  aiAutomation: [
    { label: "Overview", href: AI_AUTOMATION_HUB },
    { label: "AI Agents", href: aiAutomationPaths["ai-agents"].path },
    { label: "Workflow Automation", href: aiAutomationPaths["workflow-automation"].path },
    { label: "Voice AI", href: aiAutomationPaths["voice-ai"].path },
    { label: "CRM & Lead Automation", href: aiAutomationPaths["crm-lead-automation"].path },
    { label: "Integrations", href: aiAutomationPaths.integrations.path },
    { label: "Custom AI Tools", href: aiAutomationPaths["custom-ai-tools"].path },
  ],
  solutions: [
    { label: "Website Problems", href: "/solutions#website-quality" },
    { label: "Respond to Leads Faster", href: "/solutions/respond-to-leads-faster" },
    { label: "Automate Repetitive Work", href: "/solutions/automate-repetitive-work" },
    { label: "Connect Business Tools", href: "/solutions/connect-business-tools" },
    { label: "View All Solutions", href: "/solutions" },
  ],
  work: [
    { label: "Websites", href: "/work?capability=websites" },
    { label: "AI", href: "/work?capability=ai" },
    { label: "Automation", href: "/work?capability=automation" },
    { label: "View All Work", href: "/work" },
  ],
  platforms: [
    { label: "Website & Commerce", href: "/platforms#websites" },
    { label: "CRM & Business", href: "/platforms#connected" },
    { label: "View All Platforms", href: "/platforms" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "How We Work", href: "/how-we-work" },
    { label: "Contact", href: "/contact" },
    { label: "Pricing", href: "/pricing" },
  ],
  resources: [
    { label: "Free Website Review", href: "/free-website-review" },
    { label: "Website Brief Builder", href: "/website-brief" },
    { label: "Project Planner", href: "/project-planner" },
    { label: "Free Tools", href: "/free-tools" },
    { label: "Guides", href: "/guides" },
    { label: "Insights", href: "/blog" },
    { label: "Glossary", href: "/glossary" },
    { label: "Templates", href: "/templates" },
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

/** @deprecated Use servicesMegaMenu — kept for legacy imports during transition */
export const desktopResourceNavGroups = resourcesMegaMenu.groups;
export const mobileResourceNavGroups = resourcesMegaMenu.groups;
export const desktopPlatformNavGroups: NavLinkGroup[] = [];
export const mobileServiceNavGroups: NavLinkGroup[] = [];
export const mobilePlatformNavGroups: NavLinkGroup[] = [];
export const industriesMenu: NavLink[] = [];
