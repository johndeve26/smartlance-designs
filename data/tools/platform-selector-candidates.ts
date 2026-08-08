/**
 * Candidate platforms for the Website Platform Selector.
 * Salesforce and Clixlo are intentionally excluded from this shortlist.
 */

export const PLATFORM_SELECTOR_SLUGS = [
  "wordpress",
  "webflow",
  "shopify",
  "woocommerce",
  "bigcommerce",
  "wix-studio",
  "squarespace",
  "framer",
  "hubspot-cms",
] as const;

export type PlatformSelectorSlug = (typeof PLATFORM_SELECTOR_SLUGS)[number];

export type PlatformSelectorCandidate = {
  slug: PlatformSelectorSlug;
  name: string;
  description: string;
  strengths: string[];
  considerations: string[];
  route: string;
};

export const platformSelectorCandidates: PlatformSelectorCandidate[] = [
  {
    slug: "wordpress",
    name: "WordPress",
    description:
      "Flexible CMS for content-rich sites, custom builds and teams that need ownership over structure and hosting.",
    strengths: [
      "Flexible content models and editorial workflows",
      "Strong extensibility for integrations and custom features",
      "Hosting and infrastructure can be chosen to suit the project",
      "Works well for service, content and hybrid commerce sites",
    ],
    considerations: [
      "Implementation quality affects maintainability",
      "Plugin and theme choices should be controlled",
      "Hosting and updates need a clear maintenance plan",
    ],
    route: "/platforms/wordpress",
  },
  {
    slug: "webflow",
    name: "Webflow",
    description:
      "Visual development platform suited to marketing sites with structured CMS collections and design control.",
    strengths: [
      "Strong visual design control without a traditional theme model",
      "Structured CMS collections for marketing content",
      "Integrated hosting reduces infrastructure overhead",
      "Good fit for landing pages and brand-led marketing sites",
    ],
    considerations: [
      "Advanced custom application logic may need external systems",
      "Team workflow and CMS limits should be validated early",
      "Complex integrations can push beyond a pure Webflow build",
    ],
    route: "/platforms/webflow",
  },
  {
    slug: "shopify",
    name: "Shopify",
    description:
      "Commerce-first platform for stores that need managed infrastructure, checkout and a product-led experience.",
    strengths: [
      "Commerce-first architecture and checkout",
      "Managed store operations and app ecosystem",
      "Strong fit when selling is the centre of the business",
      "Lower infrastructure burden for many store teams",
    ],
    considerations: [
      "Complex non-commerce content needs careful evaluation",
      "App and theme quality still affect performance and UX",
      "Custom workflows may require apps or headless approaches",
    ],
    route: "/platforms/shopify",
  },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    description:
      "WordPress-powered commerce for stores that need content flexibility alongside products and categories.",
    strengths: [
      "Commerce tightly connected to a WordPress content site",
      "Flexible storefront and content marketing together",
      "Extensible when catalogue and content both matter",
      "Familiar editing for teams already on WordPress",
    ],
    considerations: [
      "Hosting, performance and plugin discipline matter",
      "Large catalogues need careful architecture",
      "Maintenance sits closer to the WordPress ecosystem",
    ],
    route: "/platforms/woocommerce",
  },
  {
    slug: "bigcommerce",
    name: "BigCommerce",
    description:
      "Dedicated commerce platform for catalogue-led stores and more specialized commerce/integration needs.",
    strengths: [
      "Dedicated commerce architecture",
      "Useful for complex catalogues and commerce integrations",
      "Strong when the store itself is the primary system",
      "Supports more specialized commerce operations",
    ],
    considerations: [
      "Team ecosystem and implementation path should be validated",
      "Content-heavy marketing sites may need a complementary approach",
      "Fit depends on catalogue complexity and operational requirements",
    ],
    route: "/platforms/bigcommerce",
  },
  {
    slug: "wix-studio",
    name: "Wix Studio",
    description:
      "Managed visual platform for business websites that need editable layouts and lower technical overhead.",
    strengths: [
      "Visual workflow with managed hosting",
      "Practical day-to-day editing for business teams",
      "Useful for responsive marketing and service sites",
      "Lower infrastructure management for many teams",
    ],
    considerations: [
      "Complex custom backends may outgrow the platform",
      "Validate integrations and content model early",
      "Advanced application requirements may need a different architecture",
    ],
    route: "/platforms/wix-studio",
  },
  {
    slug: "squarespace",
    name: "Squarespace",
    description:
      "Managed website platform for clean professional sites with straightforward editing and lower overhead.",
    strengths: [
      "Straightforward editing for owners and small teams",
      "Managed environment reduces hosting complexity",
      "Clean fit for service, local and portfolio sites",
      "Lower technical overhead for many projects",
    ],
    considerations: [
      "Significant custom functionality may be constrained",
      "Complex content models and deep integrations need review",
      "Not ideal as a primary choice for heavy application logic",
    ],
    route: "/platforms/squarespace",
  },
  {
    slug: "framer",
    name: "Framer",
    description:
      "Design-led platform for polished marketing and campaign sites with strong visual presentation.",
    strengths: [
      "Excellent for visually polished marketing experiences",
      "Strong fit for brand and campaign-led sites",
      "Responsive layouts with a design-first workflow",
      "Useful when presentation and conversion matter most",
    ],
    considerations: [
      "Complex backends and deep integrations are a weak fit",
      "Large structured content libraries may need another CMS",
      "Validate editing and growth needs before committing",
    ],
    route: "/platforms/framer",
  },
  {
    slug: "hubspot-cms",
    name: "HubSpot CMS",
    description:
      "CMS aligned with HubSpot CRM and marketing tools when the business already runs on HubSpot.",
    strengths: [
      "Strong alignment with HubSpot CRM and marketing",
      "Useful when content, CRM and campaigns share one stack",
      "Marketing teams can keep workflows closer together",
      "Reduces glue work when HubSpot is already central",
    ],
    considerations: [
      "Best when HubSpot is already a core business system",
      "Not automatically the right CMS for every CRM need",
      "Validate design, content model and development path",
    ],
    route: "/platforms/hubspot-cms",
  },
];

export const PURE_COMMERCE_SLUGS: PlatformSelectorSlug[] = [
  "shopify",
  "woocommerce",
  "bigcommerce",
];

export function getPlatformSelectorCandidate(
  slug: PlatformSelectorSlug,
): PlatformSelectorCandidate {
  const candidate = platformSelectorCandidates.find((item) => item.slug === slug);
  if (!candidate) {
    throw new Error(`Unknown platform selector candidate: ${slug}`);
  }
  return candidate;
}
