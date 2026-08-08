/**
 * Pricing & project-scope guidance.
 * Public numeric prices are intentionally not published.
 * Do not invent amounts, packages, retainers, or payment percentages here.
 */

export const pricingConfig = {
  showPublicPricing: false as const,
  /** Future: when true, UI may surface verified startingFrom fields — none exist today */
  publicPricingNote:
    "We don't publish a single website price because the work varies significantly by scope. We would rather define the project first than attach the same package to different requirements.",
};

export type ScopeFactor = {
  id: string;
  number: string; // "01"
  title: string;
  body: string;
  links?: { label: string; href: string }[];
};

export type EngagementType = {
  id: "improve" | "redesign" | "build" | "grow";
  title: string;
  description: string;
  mayFitIf: string[];
  commonScope: string[];
  relatedSolutionLinks?: { label: string; href: string }[];
  /** Future verified public pricing only — do not invent values */
  // startingFrom?: never;
};

export type ScopeExample = {
  id: string;
  title: string;
  summary: string;
  couldInclude: string[];
};

export type MatrixCell = "common" | "sometimes" | "not-typically";

export type ScopeMatrixRow = {
  id: string;
  label: string;
  improve: MatrixCell;
  redesign: MatrixCell;
  build: MatrixCell;
  grow: MatrixCell;
};

export type PricingProcessStep = {
  id: string;
  number: string;
  title: string;
  body: string;
};

export type PricingFaq = { question: string; answer: string };

export type IncludedCategory = {
  id: string;
  title: string;
  body: string;
};

export type PricingLink = {
  label: string;
  href: string;
  description?: string;
};

export type PricingEntryPoints = {
  startingFromZero: PricingLink;
  existingWebsite: PricingLink;
  planningRedesign: PricingLink;
  unsurePlatform: PricingLink;
};

export const matrixCellLabels: Record<MatrixCell, string> = {
  common: "Common",
  sometimes: "Sometimes",
  "not-typically": "Not typically",
};

export const scopeFactors: ScopeFactor[] = [
  {
    id: "strategy",
    number: "01",
    title: "Strategy",
    body: "Scope can grow when the project needs audience clarity, content architecture, conversion planning, platform evaluation, service hierarchy, location strategy or discovery. Not every small project needs an enterprise-level strategy engagement.",
  },
  {
    id: "site-structure",
    number: "02",
    title: "Site structure",
    body: "A simple brochure site, structured service website, multi-industry or multi-location site, resource-heavy site and large e-commerce architecture each create different planning and build work. Page count matters, but it is not the full scope.",
  },
  {
    id: "content",
    number: "03",
    title: "Content",
    body: "Scope differs when content is ready, needs editing, must be written new, requires SEO copy, needs product or service restructuring, or must be migrated from an existing site.",
    links: [
      { label: "SEO Copywriting", href: "/services/seo-copywriting" },
    ],
  },
  {
    id: "design-complexity",
    number: "04",
    title: "Design complexity",
    body: "Design work can range from working within an established brand, to a new page system and interface direction, to broader brand and website alignment. Unique layouts, interaction, responsive behaviour, visual assets and component systems all affect effort — not whether something simply “looks premium.”",
  },
  {
    id: "development-complexity",
    number: "05",
    title: "Development complexity",
    body: "Standard marketing pages sit differently from custom content structures, dynamic functionality, custom integrations, e-commerce, booking, membership or account systems and special workflows. Implementation scope follows what the site must do.",
  },
  {
    id: "platform",
    number: "06",
    title: "Platform",
    body: "Platform choice affects development workflow, hosting, maintenance, integrations, editing, commerce and future extensibility. No single platform is always cheaper — fit and long-term ownership matter more than a default stack.",
    links: [
      {
        label: "Website Platform Selector",
        href: "/tools/website-platform-selector",
      },
      { label: "Platforms", href: "/platforms" },
    ],
  },
  {
    id: "integrations",
    number: "07",
    title: "Integrations",
    body: "CRM, booking, payments, email marketing, analytics, inventory, calendars, reviews, forms, automation and membership can all sit in scope. The number of integrations matters less than their complexity — a standard embedded form is different from a custom data workflow.",
  },
  {
    id: "seo-migration",
    number: "08",
    title: "SEO / migration",
    body: "Technical SEO foundations should not be ignored in a new site or redesign, while broader SEO research, content strategy, on-page work, local SEO and ongoing monitoring may be separate. Redesigns may also need URL mapping, redirects, SEO protection, analytics continuity and content or CMS migration — so redesign can involve more risk than a simple new build.",
    links: [
      { label: "Website Migration", href: "/solutions/website-migration" },
      {
        label: "Website Redesign Guide",
        href: "/guides/website-redesign-guide",
      },
    ],
  },
  {
    id: "ecommerce-advanced",
    number: "09",
    title: "E-commerce / advanced functionality",
    body: "Store and advanced project scope may include catalogue architecture, product templates, categories or collections, variants, cart, checkout, payments, shipping, inventory, apps, analytics and SEO. Complexity follows the commerce model — not a fixed store package.",
    links: [
      { label: "E-commerce Growth", href: "/solutions/ecommerce-growth" },
      {
        label: "E-commerce Development",
        href: "/services/ecommerce-development",
      },
    ],
  },
  {
    id: "ongoing-support",
    number: "10",
    title: "Ongoing support",
    body: "Maintenance, SEO, conversion work, performance and related improvements can continue after launch. Ongoing support is useful for many businesses, but it is not required for every client or every project.",
  },
];

export const engagementTypes: EngagementType[] = [
  {
    id: "improve",
    title: "Improve",
    description:
      "Targeted work on an existing website — performance, SEO, conversion, landing pages, content, tracking, UX fixes or maintenance — without rebuilding what already works.",
    mayFitIf: [
      "The site fundamentally works but has specific limitations.",
      "You need priority fixes rather than a full rebuild.",
      "Problems are concentrated in speed, conversion, SEO, content or tracking.",
    ],
    commonScope: [
      "Website audit and priority fixes",
      "Performance improvements",
      "Conversion and UX refinements",
      "Landing pages or selected page updates",
      "Content and tracking improvements",
      "Maintenance-level changes",
    ],
    relatedSolutionLinks: [
      { label: "Slow Website", href: "/solutions/slow-website" },
      {
        label: "Low Website Conversions",
        href: "/solutions/low-website-conversions",
      },
      {
        label: "Website Not Ranking",
        href: "/solutions/website-not-ranking",
      },
    ],
  },
  {
    id: "redesign",
    title: "Redesign",
    description:
      "Broader changes to structure, content, visual system, UX, conversion and technical implementation while preserving what remains valuable.",
    mayFitIf: [
      "Structure, content or UX no longer serves the business.",
      "The business has outgrown its current site.",
      "You need a stronger foundation without discarding everything that works.",
    ],
    commonScope: [
      "Strategy and information architecture",
      "Content review and restructuring",
      "Design system and UX updates",
      "Development and technical refresh",
      "SEO-aware migration planning",
      "Analytics continuity and launch QA",
    ],
    relatedSolutionLinks: [
      { label: "Outdated Website", href: "/solutions/outdated-website" },
    ],
  },
  {
    id: "build",
    title: "Build",
    description:
      "Planning and creating a new website, or rebuilding the foundation of an existing one when the current base is unsuitable.",
    mayFitIf: [
      "You are starting from zero.",
      "The current foundation is unsuitable for the business.",
      "You need a full planning-to-launch website engagement.",
    ],
    commonScope: [
      "Strategy and messaging",
      "Site architecture",
      "Design and development",
      "SEO foundations",
      "Analytics setup",
      "Launch preparation",
    ],
    relatedSolutionLinks: [
      {
        label: "New Business Website",
        href: "/solutions/new-business-website",
      },
    ],
  },
  {
    id: "grow",
    title: "Grow",
    description:
      "Ongoing work after launch — SEO, content, conversion optimization, performance, maintenance, landing pages, analytics or digital marketing — without implying every client needs a retainer.",
    mayFitIf: [
      "The site is already live and needs ongoing acquisition or improvement.",
      "You want continuous SEO, conversion or performance work.",
      "Launch is complete and priorities now sit in growth rather than rebuild.",
    ],
    commonScope: [
      "SEO and content improvements",
      "Conversion optimization",
      "Performance and maintenance",
      "Landing pages",
      "Analytics and measurement",
      "Digital marketing support where relevant",
    ],
    relatedSolutionLinks: [
      {
        label: "Local Business Visibility",
        href: "/solutions/local-business-visibility",
      },
      { label: "E-commerce Growth", href: "/solutions/ecommerce-growth" },
      {
        label: "Website Not Generating Leads",
        href: "/solutions/website-not-generating-leads",
      },
    ],
  },
];

export const scopeExamples: ScopeExample[] = [
  {
    id: "focused-improvement",
    title: "Focused website improvement",
    summary:
      "Targeted work on an existing site that already has a usable foundation.",
    couldInclude: [
      "Audit and priority findings",
      "Performance improvements",
      "Conversion refinements",
      "Tracking and measurement updates",
      "Selected page or landing-page work",
    ],
  },
  {
    id: "business-website-redesign",
    title: "Business website redesign",
    summary:
      "A broader refresh of structure, design and implementation while protecting what still performs.",
    couldInclude: [
      "Strategy and sitemap",
      "Content review",
      "Design system",
      "Development",
      "SEO-aware migration",
      "Analytics continuity",
      "Launch QA",
    ],
  },
  {
    id: "new-business-website",
    title: "New business website",
    summary:
      "Planning and building a new site from clear goals rather than inheriting an old foundation.",
    couldInclude: [
      "Planning and messaging",
      "Site architecture",
      "Design",
      "Build",
      "SEO foundations",
      "Analytics",
      "Launch",
    ],
  },
  {
    id: "ecommerce-project",
    title: "E-commerce project",
    summary:
      "Commerce-focused work where catalogue, product experience and checkout matter as much as presentation.",
    couldInclude: [
      "Catalogue architecture",
      "Commerce platform setup",
      "Product and category UX",
      "Development",
      "Checkout and integrations",
      "SEO",
      "Analytics",
    ],
  },
];

export const scopeMatrixRows: ScopeMatrixRow[] = [
  {
    id: "strategy",
    label: "Strategy",
    improve: "sometimes",
    redesign: "common",
    build: "common",
    grow: "sometimes",
  },
  {
    id: "design",
    label: "Design",
    improve: "sometimes",
    redesign: "common",
    build: "common",
    grow: "not-typically",
  },
  {
    id: "development",
    label: "Development",
    improve: "sometimes",
    redesign: "common",
    build: "common",
    grow: "sometimes",
  },
  {
    id: "content",
    label: "Content",
    improve: "sometimes",
    redesign: "common",
    build: "common",
    grow: "common",
  },
  {
    id: "seo",
    label: "SEO",
    improve: "common",
    redesign: "common",
    build: "common",
    grow: "common",
  },
  {
    id: "analytics",
    label: "Analytics",
    improve: "common",
    redesign: "common",
    build: "common",
    grow: "common",
  },
  {
    id: "migration",
    label: "Migration",
    improve: "not-typically",
    redesign: "common",
    build: "sometimes",
    grow: "not-typically",
  },
  {
    id: "integrations",
    label: "Integrations",
    improve: "sometimes",
    redesign: "sometimes",
    build: "sometimes",
    grow: "sometimes",
  },
  {
    id: "ongoing-optimization",
    label: "Ongoing optimization",
    improve: "sometimes",
    redesign: "not-typically",
    build: "not-typically",
    grow: "common",
  },
];

export const scopeMatrixNote =
  "Cells show what is often involved — not a guarantee. The actual proposal defines final scope.";

export const includedCategories: IncludedCategory[] = [
  {
    id: "strategy",
    title: "Strategy",
    body: "Goals, audience priorities and project direction — depending on scope.",
  },
  {
    id: "ux-ui",
    title: "UX / UI",
    body: "Structure, usability and interface decisions that support clear journeys — depending on scope.",
  },
  {
    id: "website-design",
    title: "Website Design",
    body: "Layouts, visual system and page design matched to the brand and conversion needs — depending on scope.",
  },
  {
    id: "development",
    title: "Development",
    body: "Build, templates, functionality and technical implementation — depending on scope.",
  },
  {
    id: "content-support",
    title: "Content Support",
    body: "Editing, restructuring, migration support or new copy where agreed — depending on scope.",
  },
  {
    id: "seo",
    title: "SEO",
    body: "Foundations during build or redesign, or broader SEO work when scoped separately — depending on scope.",
  },
  {
    id: "performance",
    title: "Performance",
    body: "Speed, technical health and experience improvements where they belong in the project — depending on scope.",
  },
  {
    id: "analytics",
    title: "Analytics",
    body: "Measurement setup and continuity so important actions can be reviewed — depending on scope.",
  },
  {
    id: "migration",
    title: "Migration",
    body: "URL mapping, redirects, content moves and launch protection when changing platforms or structures — depending on scope.",
  },
  {
    id: "integrations",
    title: "Integrations",
    body: "Forms, CRM, booking, payments, email and related connections — depending on scope.",
  },
  {
    id: "launch-qa",
    title: "Launch QA",
    body: "Checks across key pages, forms, tracking and launch readiness before go-live — depending on scope.",
  },
];

export const includedCategoriesNote =
  "Not every project automatically includes every category. What is included depends on scope.";

export const processSteps: PricingProcessStep[] = [
  {
    id: "understand",
    number: "01",
    title: "Understand",
    body: "Learn the business, website, goal, audience and constraints before recommending work.",
  },
  {
    id: "review",
    number: "02",
    title: "Review",
    body: "Where relevant, review the existing website, content, SEO, platform, integrations and technical limitations.",
  },
  {
    id: "define",
    number: "03",
    title: "Define",
    body: "Clarify what must change, what can remain, what belongs now and what can wait.",
  },
  {
    id: "recommend",
    number: "04",
    title: "Recommend",
    body: "Recommend an appropriate scope, platform, services and project approach — not automatically the largest engagement.",
  },
  {
    id: "scope",
    number: "05",
    title: "Scope",
    body: "Define deliverables, responsibilities, dependencies, content needs, technical work and timeline assumptions.",
  },
  {
    id: "proposal",
    number: "06",
    title: "Proposal",
    body: "Share scope, deliverables, commercial terms, timing and what is or is not included before work begins.",
  },
];

export const reduceScopeItems: string[] = [
  "Clear requirements",
  "Content already prepared",
  "Established branding",
  "Fewer unique layouts",
  "Simple integrations",
  "Stable platform",
  "Focused launch scope",
  "Reusing what already works",
];

export const increaseScopeItems: string[] = [
  "Unclear requirements",
  "Many stakeholders",
  "New brand direction",
  "Large content migration",
  "Multiple locations",
  "Complex integrations",
  "Commerce requirements",
  "Custom workflows",
  "Platform migration",
  "Many unique page types",
  "Large product catalogue",
  "Special compliance or accessibility requirements where applicable",
];

export const thirdPartyCostItems: string[] = [
  "Hosting",
  "Domain",
  "Platform subscriptions",
  "Apps and plugins",
  "Email tools",
  "Booking systems",
  "Payment processors",
  "Stock or licensed media",
  "External services",
];

export const thirdPartyCostsNote =
  "These may sit separate from Smartlance fees. Vendor pricing is not invented here — requirements differ by project.";

export const timelineFactors: string[] = [
  "Overall project scope",
  "Content readiness",
  "Feedback turnaround",
  "Number of stakeholders",
  "Integrations",
  "Platform migration",
  "Revision complexity",
  "Launch dependencies",
];

export const paymentTermsNote =
  "Payment terms are included in the project proposal before work begins.";

export const faqs: PricingFaq[] = [
  {
    question: "Why don't you show one fixed website price?",
    answer:
      "Different websites can need very different levels of strategy, content, design, development, SEO, integrations and migration. We define scope and commercial terms before work begins rather than attaching one figure to every requirement.",
  },
  {
    question: "What affects the cost of a website project?",
    answer:
      "Cost follows scope: goals, site structure, content readiness, design and development complexity, platform, integrations, SEO or migration needs, advanced functionality and any ongoing support. Page count is only one part of that picture.",
  },
  {
    question: "Do I need a full redesign?",
    answer:
      "Not always. If the site fundamentally works but has specific problems, targeted improvement may be enough. Redesign or rebuild becomes more relevant when structure, content, UX or the technical foundation no longer serve the business.",
  },
  {
    question: "Can I start with a smaller project?",
    answer:
      "Often yes. Clear requirements, prepared content, fewer unique layouts and a focused launch scope can keep the first phase smaller. Some projects can also separate launch essentials from later improvements when the foundation stays sound.",
  },
  {
    question: "Does SEO cost extra?",
    answer:
      "Foundational SEO work may sit inside website planning and implementation. Broader SEO — research, content strategy, ongoing optimization, local SEO or monitoring — may be separate. The proposal should state what is included.",
  },
  {
    question: "Does platform choice affect price?",
    answer:
      "Yes, because platform choice affects workflow, hosting, maintenance, integrations, editing and extensibility. That does not mean one platform is always cheaper — fit for the business matters more than a default stack.",
  },
  {
    question: "Are hosting and third-party tools included?",
    answer:
      "Hosting, platform costs and responsibilities are clarified in the proposal because requirements differ by platform and project. Domains, apps, email tools, booking systems, payment processors and similar services may also sit with other providers.",
  },
  {
    question: "How do you scope a project?",
    answer:
      "You do not need every requirement locked before speaking with us. We understand the business and goals, review what already exists where relevant, define priorities, recommend an approach, then set deliverables and commercial terms in a proposal before work begins.",
  },
  {
    question: "Do you offer ongoing support?",
    answer:
      "Where it fits, ongoing work can include maintenance, SEO, performance, conversion improvements and related digital marketing. Ongoing support is available when useful — it is not required for every client, and retainer structures are defined per engagement rather than published as one fixed model.",
  },
];

export const entryPoints: PricingEntryPoints = {
  startingFromZero: {
    label: "New Business Website",
    href: "/solutions/new-business-website",
    description: "Starting from zero?",
  },
  existingWebsite: {
    label: "Free Website Review",
    href: "/free-website-review",
    description: "Have an existing website?",
  },
  planningRedesign: {
    label: "Website Redesign Guide",
    href: "/guides/website-redesign-guide",
    description: "Planning a redesign?",
  },
  unsurePlatform: {
    label: "Website Platform Selector",
    href: "/tools/website-platform-selector",
    description: "Not sure about platform?",
  },
};

export const relatedServices: PricingLink[] = [
  {
    label: "Website Strategy",
    href: "/services/website-strategy",
  },
  {
    label: "Website Design",
    href: "/services/website-design",
  },
  {
    label: "Website Development",
    href: "/services/website-development",
  },
  {
    label: "Website Redesign",
    href: "/services/website-redesign",
  },
  {
    label: "SEO",
    href: "/seo",
  },
];

export const relatedResources: PricingLink[] = [
  {
    label: "Website Project Planner",
    href: "/project-planner",
    description: "Narrow the project type before choosing scope or services.",
  },
  {
    label: "Website Project Brief Template",
    href: "/templates/website-project-brief-template",
  },
  {
    label: "Website Platform Selector",
    href: "/tools/website-platform-selector",
  },
  {
    label: "Website Redesign Guide",
    href: "/guides/website-redesign-guide",
  },
];

export const relatedSolutions: PricingLink[] = [
  {
    label: "New Business Website",
    href: "/solutions/new-business-website",
  },
  {
    label: "Outdated Website",
    href: "/solutions/outdated-website",
  },
  {
    label: "Website Migration",
    href: "/solutions/website-migration",
  },
  {
    label: "Low Website Conversions",
    href: "/solutions/low-website-conversions",
  },
];
