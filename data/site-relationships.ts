/**
 * Central relationship + CTA vocabulary for Smartlance Designs.
 * Prefer this file over duplicating Solution↔Service maps in JSX.
 *
 * Display limits (defaults):
 * - Solutions: 2–3
 * - Services: 3–4
 * - Resources: 2–4
 * - Work: 3
 * - Platforms: 2–3
 */

export const CTA_LABELS = {
  contact: "Tell Us About Your Project",
  freeReview: "Get a Free Website Review",
  planner: "Plan Your Project",
  projectBrief: "Use the Project Brief Template",
  platformSelector: "Use Website Platform Selector",
  pricing: "View Pricing & Project Scope",
  services: "Explore Services",
  solutions: "Explore Solutions",
  work: "View Our Work",
  resources: "Explore Resources",
  caseStudy: "View Case Study",
} as const;

export type RelationPriority = "primary" | "secondary" | "contextual";

export type RelatedHref = {
  href: string;
  label: string;
  priority: RelationPriority;
};

/** Canonical utility routes */
export const SITE_ROUTES = {
  contact: "/contact",
  freeReview: "/free-website-review",
  planner: "/project-planner",
  pricing: "/pricing",
  projectBrief: "/templates/website-project-brief-template",
  platformSelector: "/tools/website-platform-selector",
  redesignGuide: "/guides/website-redesign-guide",
  redesignChecklist: "/checklists/website-redesign-checklist",
  wordpressVsWebflow: "/compare/wordpress-vs-webflow",
  services: "/services",
  solutions: "/solutions",
  platforms: "/platforms",
  industries: "/industries",
  work: "/work",
  resources: "/resources",
  seo: "/seo",
  about: "/about",
} as const;

/**
 * Solution → prioritized capabilities / education / actions.
 * Caps: services 3–4, resources 2–4.
 */
export const solutionJourney: Record<
  string,
  {
    services: RelatedHref[];
    resources?: RelatedHref[];
    /** Existing-site diagnosis — omit for new-business journeys */
    existingSiteAction?: boolean;
    planningAction?: boolean;
  }
> = {
  "outdated-website": {
    services: [
      {
        href: "/services/website-redesign",
        label: "Website Redesign",
        priority: "primary",
      },
      {
        href: "/services/website-strategy",
        label: "Website Strategy",
        priority: "secondary",
      },
      {
        href: "/services/website-development",
        label: "Website Development",
        priority: "secondary",
      },
    ],
    resources: [
      {
        href: SITE_ROUTES.redesignGuide,
        label: "Website Redesign Guide",
        priority: "primary",
      },
      {
        href: SITE_ROUTES.redesignChecklist,
        label: "Website Redesign Checklist",
        priority: "secondary",
      },
      {
        href: SITE_ROUTES.projectBrief,
        label: "Website Project Brief Template",
        priority: "contextual",
      },
    ],
    existingSiteAction: true,
  },
  "new-business-website": {
    services: [
      {
        href: "/services/website-strategy",
        label: "Website Strategy",
        priority: "primary",
      },
      {
        href: "/services/website-design",
        label: "Website Design",
        priority: "primary",
      },
      {
        href: "/services/website-development",
        label: "Website Development",
        priority: "secondary",
      },
    ],
    resources: [
      {
        href: SITE_ROUTES.planner,
        label: "Website Project Planner",
        priority: "primary",
      },
      {
        href: SITE_ROUTES.projectBrief,
        label: "Website Project Brief Template",
        priority: "secondary",
      },
      {
        href: SITE_ROUTES.platformSelector,
        label: "Website Platform Selector",
        priority: "secondary",
      },
      {
        href: "/glossary/cms",
        label: "What Is a CMS?",
        priority: "contextual",
      },
      {
        href: SITE_ROUTES.pricing,
        label: "Pricing & Project Scope",
        priority: "contextual",
      },
    ],
    existingSiteAction: false,
    planningAction: true,
  },
  "slow-website": {
    services: [
      {
        href: "/services/website-performance-optimization",
        label: "Website Performance Optimization",
        priority: "primary",
      },
      {
        href: "/services/website-development",
        label: "Website Development",
        priority: "secondary",
      },
      {
        href: "/services/website-audit",
        label: "Website Audit",
        priority: "secondary",
      },
    ],
    resources: [
      {
        href: "/glossary/core-web-vitals",
        label: "Core Web Vitals",
        priority: "primary",
      },
      {
        href: "/glossary/lcp",
        label: "LCP",
        priority: "contextual",
      },
      {
        href: "/glossary/inp",
        label: "INP",
        priority: "contextual",
      },
      {
        href: "/glossary/cls",
        label: "CLS",
        priority: "contextual",
      },
    ],
    existingSiteAction: true,
  },
  "website-not-ranking": {
    services: [
      { href: "/seo", label: "SEO", priority: "primary" },
      {
        href: "/seo/technical-seo",
        label: "Technical SEO",
        priority: "secondary",
      },
      { href: "/seo/seo-audit", label: "SEO Audit", priority: "secondary" },
      {
        href: "/services/seo-copywriting",
        label: "SEO Copywriting",
        priority: "contextual",
      },
    ],
    resources: [
      { href: "/glossary/seo", label: "What Is SEO?", priority: "contextual" },
    ],
    existingSiteAction: true,
  },
  "website-not-generating-leads": {
    services: [
      {
        href: "/services/conversion-rate-optimization",
        label: "Conversion Rate Optimization",
        priority: "primary",
      },
      {
        href: "/services/analytics-conversion-tracking",
        label: "Analytics & Conversion Tracking",
        priority: "secondary",
      },
      {
        href: "/services/website-design",
        label: "Website Design",
        priority: "secondary",
      },
      {
        href: "/services/landing-page-design",
        label: "Landing Page Design",
        priority: "contextual",
      },
    ],
    existingSiteAction: true,
  },
  "low-website-conversions": {
    services: [
      {
        href: "/services/conversion-rate-optimization",
        label: "Conversion Rate Optimization",
        priority: "primary",
      },
      {
        href: "/services/analytics-conversion-tracking",
        label: "Analytics & Conversion Tracking",
        priority: "secondary",
      },
      {
        href: "/services/landing-page-design",
        label: "Landing Page Design",
        priority: "secondary",
      },
    ],
    resources: [
      { href: "/glossary/cta", label: "What Is a CTA?", priority: "contextual" },
      {
        href: "/glossary/conversion-rate",
        label: "Conversion Rate",
        priority: "contextual",
      },
    ],
    existingSiteAction: true,
  },
  "website-migration": {
    services: [
      {
        href: "/services/website-migration",
        label: "Website Migration",
        priority: "primary",
      },
      {
        href: "/seo/technical-seo",
        label: "Technical SEO",
        priority: "secondary",
      },
      {
        href: "/services/website-development",
        label: "Website Development",
        priority: "secondary",
      },
    ],
    resources: [
      {
        href: SITE_ROUTES.redesignGuide,
        label: "Website Redesign Guide",
        priority: "primary",
      },
      {
        href: "/glossary/301-redirect",
        label: "301 Redirect",
        priority: "contextual",
      },
      {
        href: "/glossary/canonical-url",
        label: "Canonical URL",
        priority: "contextual",
      },
      {
        href: "/glossary/xml-sitemap",
        label: "XML Sitemap",
        priority: "contextual",
      },
      {
        href: "/glossary/structured-data",
        label: "Structured Data",
        priority: "contextual",
      },
      {
        href: SITE_ROUTES.platformSelector,
        label: "Website Platform Selector",
        priority: "contextual",
      },
    ],
    existingSiteAction: true,
  },
  "ecommerce-growth": {
    services: [
      {
        href: "/services/ecommerce-development",
        label: "E-commerce Development",
        priority: "primary",
      },
      {
        href: "/services/conversion-rate-optimization",
        label: "Conversion Rate Optimization",
        priority: "secondary",
      },
      {
        href: "/services/analytics-conversion-tracking",
        label: "Analytics & Conversion Tracking",
        priority: "secondary",
      },
    ],
    resources: [
      {
        href: SITE_ROUTES.platformSelector,
        label: "Website Platform Selector",
        priority: "primary",
      },
      {
        href: "/platforms/shopify",
        label: "Shopify",
        priority: "contextual",
      },
      {
        href: "/platforms/woocommerce",
        label: "WooCommerce",
        priority: "contextual",
      },
      {
        href: "/platforms/bigcommerce",
        label: "BigCommerce",
        priority: "contextual",
      },
    ],
    existingSiteAction: true,
  },
  "local-business-visibility": {
    services: [
      { href: "/seo/local-seo", label: "Local SEO", priority: "primary" },
      { href: "/seo", label: "SEO", priority: "secondary" },
      {
        href: "/services/website-design",
        label: "Website Design",
        priority: "secondary",
      },
    ],
    resources: [
      {
        href: SITE_ROUTES.industries,
        label: "Industries",
        priority: "contextual",
      },
    ],
    existingSiteAction: true,
  },
};

/**
 * Service href → solutions this capability most often solves.
 * Used on Service detail pages (max 2–3).
 */
export const serviceToSolutions: Record<string, RelatedHref[]> = {
  "/services/website-redesign": [
    {
      href: "/solutions/outdated-website",
      label: "Outdated Website",
      priority: "primary",
    },
    {
      href: "/solutions/website-migration",
      label: "Website Migration",
      priority: "secondary",
    },
  ],
  "/services/website-performance-optimization": [
    {
      href: "/solutions/slow-website",
      label: "Slow Website",
      priority: "primary",
    },
  ],
  "/services/conversion-rate-optimization": [
    {
      href: "/solutions/low-website-conversions",
      label: "Low Website Conversions",
      priority: "primary",
    },
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "secondary",
    },
  ],
  "/services/website-migration": [
    {
      href: "/solutions/website-migration",
      label: "Website Migration",
      priority: "primary",
    },
  ],
  "/services/ecommerce-development": [
    {
      href: "/solutions/ecommerce-growth",
      label: "E-commerce Growth",
      priority: "primary",
    },
  ],
  "/services/website-strategy": [
    {
      href: "/solutions/new-business-website",
      label: "New Business Website",
      priority: "primary",
    },
    {
      href: "/solutions/outdated-website",
      label: "Outdated Website",
      priority: "secondary",
    },
  ],
  "/services/website-design": [
    {
      href: "/solutions/new-business-website",
      label: "New Business Website",
      priority: "primary",
    },
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "secondary",
    },
  ],
  "/services/website-development": [
    {
      href: "/solutions/new-business-website",
      label: "New Business Website",
      priority: "primary",
    },
    {
      href: "/solutions/slow-website",
      label: "Slow Website",
      priority: "secondary",
    },
  ],
  "/services/landing-page-design": [
    {
      href: "/solutions/low-website-conversions",
      label: "Low Website Conversions",
      priority: "primary",
    },
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "secondary",
    },
  ],
  "/services/website-audit": [
    {
      href: "/solutions/slow-website",
      label: "Slow Website",
      priority: "secondary",
    },
    {
      href: "/solutions/website-not-ranking",
      label: "Website Not Ranking",
      priority: "secondary",
    },
  ],
  "/services/analytics-conversion-tracking": [
    {
      href: "/solutions/low-website-conversions",
      label: "Low Website Conversions",
      priority: "primary",
    },
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "secondary",
    },
  ],
  "/services/seo-copywriting": [
    {
      href: "/solutions/website-not-ranking",
      label: "Website Not Ranking",
      priority: "primary",
    },
  ],
  "/seo": [
    {
      href: "/solutions/website-not-ranking",
      label: "Website Not Ranking",
      priority: "primary",
    },
  ],
  "/seo/local-seo": [
    {
      href: "/solutions/local-business-visibility",
      label: "Local Business Visibility",
      priority: "primary",
    },
  ],
  "/seo/technical-seo": [
    {
      href: "/solutions/website-not-ranking",
      label: "Website Not Ranking",
      priority: "primary",
    },
    {
      href: "/solutions/website-migration",
      label: "Website Migration",
      priority: "secondary",
    },
    {
      href: "/solutions/slow-website",
      label: "Slow Website",
      priority: "contextual",
    },
  ],
  "/seo/on-page-seo": [
    {
      href: "/solutions/website-not-ranking",
      label: "Website Not Ranking",
      priority: "primary",
    },
  ],
  "/seo/seo-audit": [
    {
      href: "/solutions/website-not-ranking",
      label: "Website Not Ranking",
      priority: "primary",
    },
  ],
};

/** Platform → comparison / selector / commerce cues */
export const platformConnections: Record<
  string,
  {
    comparisonHref?: string;
    showSelector?: boolean;
    commerceSolution?: boolean;
  }
> = {
  wordpress: {
    comparisonHref: SITE_ROUTES.wordpressVsWebflow,
    showSelector: true,
  },
  webflow: {
    comparisonHref: SITE_ROUTES.wordpressVsWebflow,
    showSelector: true,
  },
  shopify: { showSelector: true, commerceSolution: true },
  woocommerce: { showSelector: true, commerceSolution: true },
  bigcommerce: { showSelector: true, commerceSolution: true },
  "wix-studio": { showSelector: true },
  squarespace: { showSelector: true },
  framer: { showSelector: true },
  "hubspot-cms": { showSelector: true },
  salesforce: { showSelector: false },
  clixlo: { showSelector: false },
};

/** Industry hub themes → solution links (hub-only industries) */
export const industryToSolutions: Record<string, RelatedHref[]> = {
  "short-term-rentals": [
    {
      href: "/solutions/new-business-website",
      label: "New Business Website",
      priority: "secondary",
    },
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "primary",
    },
  ],
  hospitality: [
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "primary",
    },
    {
      href: "/solutions/local-business-visibility",
      label: "Local Business Visibility",
      priority: "secondary",
    },
  ],
  "cabin-rentals": [
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "primary",
    },
  ],
  "real-estate": [
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "primary",
    },
    {
      href: "/solutions/local-business-visibility",
      label: "Local Business Visibility",
      priority: "secondary",
    },
  ],
  "property-management": [
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "primary",
    },
  ],
  "local-businesses": [
    {
      href: "/solutions/local-business-visibility",
      label: "Local Business Visibility",
      priority: "primary",
    },
  ],
  ecommerce: [
    {
      href: "/solutions/ecommerce-growth",
      label: "E-commerce Growth",
      priority: "primary",
    },
  ],
  "professional-services": [
    {
      href: "/solutions/website-not-generating-leads",
      label: "Website Not Generating Leads",
      priority: "primary",
    },
    {
      href: "/solutions/website-not-ranking",
      label: "Website Not Ranking",
      priority: "secondary",
    },
  ],
};

/** Resource progression (format → next educational step) */
export const resourceProgression = {
  guideToChecklist: {
    from: SITE_ROUTES.redesignGuide,
    to: SITE_ROUTES.redesignChecklist,
    label: "Website Redesign Checklist",
  },
  checklistToGuide: {
    from: SITE_ROUTES.redesignChecklist,
    to: SITE_ROUTES.redesignGuide,
    label: "Website Redesign Guide",
  },
  checklistToBrief: {
    from: SITE_ROUTES.redesignChecklist,
    to: SITE_ROUTES.projectBrief,
    label: "Website Project Brief Template",
  },
  briefToPlanner: {
    from: SITE_ROUTES.projectBrief,
    to: SITE_ROUTES.planner,
    label: "Website Project Planner",
  },
  briefToSelector: {
    from: SITE_ROUTES.projectBrief,
    to: SITE_ROUTES.platformSelector,
    label: "Website Platform Selector",
  },
  comparisonToSelector: {
    from: SITE_ROUTES.wordpressVsWebflow,
    to: SITE_ROUTES.platformSelector,
    label: "Website Platform Selector",
  },
} as const;

/** Contact page secondary helpers (keep visually secondary) */
export const contactHelpers: RelatedHref[] = [
  {
    href: SITE_ROUTES.planner,
    label: "Still defining your project? Plan Your Project",
    priority: "secondary",
  },
  {
    href: SITE_ROUTES.projectBrief,
    label: "Need to organize requirements? Use the Project Brief Template",
    priority: "contextual",
  },
  {
    href: SITE_ROUTES.freeReview,
    label: "Already have a site? Get a Free Website Review",
    priority: "contextual",
  },
];

/** Free Review post-explanation next steps (not before the form) */
export const freeReviewNextSteps: RelatedHref[] = [
  {
    href: "/services/website-audit",
    label: "Website Audit — deeper prioritized diagnosis",
    priority: "secondary",
  },
  {
    href: SITE_ROUTES.solutions,
    label: "Explore Solutions",
    priority: "contextual",
  },
  {
    href: SITE_ROUTES.pricing,
    label: "View Pricing & Project Scope",
    priority: "contextual",
  },
];
