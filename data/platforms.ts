/** @migration-reference Phase 2 — runtime reads DB repositories; this file remains seed/reference source. */
import type { Platform, PlatformGroupId } from "@/types";
import { additionalPlatforms } from "@/data/additional-platforms";

export const platforms: Platform[] = [
  {
    slug: "wordpress",
    name: "WordPress",
    title: "WordPress Website Design & Development",
    href: "/platforms/wordpress",
    summary:
      "Flexible websites for service businesses, hospitality brands and content-heavy sites that need manageable updates.",
    description:
      "Smartlance Designs designs, builds and improves WordPress websites for businesses that need a professional online presence, clearer conversion paths and content they can manage day to day — without treating WordPress as a one-size-fits-all shortcut.",
    tagline:
      "Custom WordPress websites built around strategy, performance and SEO foundations.",
    icon: "layers",
    featured: true,
    group: "websites",
    prominence: "high",
    navigationFeatured: true,
    verifiedExperience: true,
    platformMatch: "WordPress",
    legacyUrl: "https://www.smartlancedesigns.com/platform/wordpress/",
    audiences: [
      "Service businesses",
      "Hospitality and vacation rental brands",
      "Property management companies",
      "Real estate businesses",
      "Content-rich businesses",
      "Local businesses that need regular page updates",
    ],
    whenItFits: [
      "Content flexibility and ownership matter",
      "Marketing pages change frequently",
      "The team needs to manage content day to day",
      "Integrations and SEO foundations are important",
      "A custom experience is more valuable than a rigid template",
    ],
    capabilities: [
      "Custom WordPress website design and development",
      "WordPress redesigns for outdated or underperforming sites",
      "Responsive theme and template development",
      "CMS setup and editor training",
      "Performance optimization and speed improvements",
      "Technical SEO and on-page SEO foundations",
      "Landing pages and conversion-focused page structure",
      "Plugin configuration and essential integrations",
      "Website maintenance and ongoing support",
      "Troubleshooting for existing WordPress sites",
    ],
    challenges: [
      "The site looks dated or does not reflect the brand",
      "Pages are slow, bloated or hard to maintain",
      "Theme and plugin choices are hurting performance or SEO",
      "Mobile layouts feel cramped or confusing",
      "Important service pages lack clear calls to action",
      "Updates require developer help for simple content changes",
      "Search visibility has stalled despite publishing content",
    ],
    seoSection: {
      title: "WordPress Is Flexible. That Doesn't Automatically Make It SEO-Friendly.",
      intro:
        "WordPress can support strong SEO, but only when the site is built with the right structure and maintained properly. A flexible CMS does not replace good architecture, performance discipline or content strategy.",
      points: [
        "Site architecture and internal linking",
        "Theme quality and markup structure",
        "Page speed and Core Web Vitals",
        "Metadata, headings and content hierarchy",
        "Schema where appropriate",
        "Image optimization and media handling",
        "Crawlability, indexability and redirect hygiene",
        "Duplicate or thin content patterns",
      ],
    },
    conversionNote:
      "WordPress sites often fail commercially because the offer is unclear, CTAs are weak or key pages send visitors in too many directions. We improve page hierarchy, enquiry paths, booking flows and landing page structure so traffic has a clearer next step.",
    migrationNote:
      "If your WordPress site has outgrown its theme, become slow or no longer supports your goals, a focused redesign or rebuild may be more practical than patching plugins indefinitely. We evaluate what should be kept, rebuilt or simplified before recommending migration work.",
    relatedServiceHrefs: [
      "/services/website-migration",
      "/services/website-performance-optimization",
      "/services/website-design",
      "/services/website-development",
      "/services/website-redesign",
      "/services/website-maintenance",
      "/seo",
      "/seo/technical-seo",
    ],
    relatedSeoHrefs: ["technical-seo", "on-page-seo"],
    faqs: [
      {
        question: "Do you only build new WordPress sites?",
        answer:
          "No. We also redesign, improve and troubleshoot existing WordPress websites — including performance, SEO foundations, plugin issues and conversion improvements.",
      },
      {
        question: "Can we update content ourselves after launch?",
        answer:
          "Yes. WordPress is often the right choice when your team needs to update pages, listings, blog posts or key sections without developer involvement for every change.",
      },
      {
        question: "Will you recommend WordPress for every project?",
        answer:
          "No. We recommend WordPress when content management, flexibility and your business model make it the practical fit — not because it is the default option.",
      },
      {
        question: "Can you improve SEO on an existing WordPress site?",
        answer:
          "Yes. Themes and plugins do not automatically make a WordPress site SEO-friendly. We improve architecture, performance, metadata and on-page foundations where needed.",
      },
      {
        question: "Do you provide WordPress maintenance?",
        answer:
          "Yes. Updates, backups, monitoring, bug fixes and content support can continue after launch.",
      },
    ],
    ctaTitle: "Need Help With Your WordPress Website?",
    ctaDescription:
      "Tell us about your goals and current site. We will recommend a practical WordPress next step.",
    metaTitle: "WordPress Website Design & Development",
    metaDescription:
      "WordPress website design, development, redesign, SEO and maintenance from Smartlance Designs — for service, hospitality and content-driven businesses.",
  },
  {
    slug: "shopify",
    name: "Shopify",
    title: "Shopify Website Design & Development",
    href: "/platforms/shopify",
    summary:
      "Conversion-focused Shopify stores designed around product discovery, mobile shopping and checkout clarity.",
    description:
      "We help product businesses improve Shopify storefronts with clearer navigation, stronger product pages, better mobile shopping experiences and practical SEO foundations — focused on selling, not platform buzzwords.",
    tagline:
      "Shopify stores designed for product discovery, mobile shopping and smoother checkout.",
    icon: "store",
    featured: true,
    group: "ecommerce",
    prominence: "high",
    navigationFeatured: true,
    verifiedExperience: false,
    platformMatch: "Shopify",
    legacyUrl: "https://www.smartlancedesigns.com/platform/shopify/",
    audiences: [
      "E-commerce brands",
      "Product businesses",
      "Growing online retailers",
      "Businesses launching or improving a Shopify storefront",
    ],
    whenItFits: [
      "The primary business is online retail",
      "Product and catalogue management matter day to day",
      "Streamlined commerce operations are important",
      "You need clearer product discovery and checkout paths",
    ],
    capabilities: [
      "Shopify store design and UX improvements",
      "Theme customization",
      "Product page and collection structure",
      "Navigation and merchandising hierarchy",
      "Mobile shopping experience improvements",
      "Campaign and landing page support",
      "Conversion optimization for key store flows",
      "Technical SEO and on-page SEO foundations",
      "Site speed improvements within Shopify constraints",
      "App integration guidance where needed",
      "Store redesign planning and implementation",
    ],
    challenges: [
      "Product pages do not explain the offer clearly enough",
      "Collections and navigation make products hard to find",
      "Mobile shopping feels awkward or slow",
      "Checkout or cart friction is hurting sales",
      "Store SEO is weak despite having a product catalogue",
      "Theme limitations are blocking better merchandising",
      "Traffic is arriving but not converting",
    ],
    seoSection: {
      title: "Shopify SEO Still Needs Structure, Not Just Product Uploads",
      intro:
        "Shopify handles a lot of commerce infrastructure, but discoverability and conversion still depend on how the store is organized and maintained.",
      points: [
        "Collection and navigation structure",
        "Product titles, metadata and descriptions",
        "Duplicate content and thin category pages",
        "Internal linking between collections and products",
        "Site speed and image optimization",
        "Structured data and product discoverability",
        "Landing pages for campaigns and seasonal offers",
      ],
    },
    conversionNote:
      "Shopify stores convert better when product pages answer buyer questions quickly, trust signals are visible and the path from browse to checkout stays simple — especially on mobile.",
    migrationNote:
      "If your current Shopify theme no longer supports your catalogue, brand or conversion goals, a redesign or structured rebuild may be more effective than stacking apps on top of a weak foundation.",
    relatedServiceHrefs: [
      "/services/website-migration",
      "/services/website-performance-optimization",
      "/services/ecommerce-development",
      "/services/website-redesign",
      "/services/conversion-rate-optimization",
      "/seo",
      "/seo/technical-seo",
    ],
    relatedSeoHrefs: ["technical-seo", "on-page-seo"],
    faqs: [
      {
        question: "Do you claim Shopify Plus expertise?",
        answer:
          "We do not claim Shopify Plus specialization unless a specific project requires and verifies it. Our focus is practical Shopify store design, development, SEO and conversion improvements for growing product businesses.",
      },
      {
        question: "Can you improve an existing Shopify store?",
        answer:
          "Yes. Many projects focus on redesigning product pages, improving navigation, strengthening SEO foundations or fixing conversion issues on an existing store.",
      },
      {
        question: "Do you handle SEO for Shopify stores?",
        answer:
          "Yes. Collection architecture, product metadata, duplicate-URL risks, performance and campaign landing pages are all part of practical Shopify SEO work.",
      },
      {
        question: "Can you redesign a Shopify theme?",
        answer:
          "Yes. If the current theme no longer supports brand, catalogue or conversion goals, a structured redesign is often more effective than stacking apps.",
      },
    ],
    ctaTitle: "Planning a New Shopify Store or Redesign?",
    ctaDescription:
      "Tell us about your catalogue and goals. We will recommend a practical Shopify path forward.",
    metaTitle: "Shopify Website Design & Development",
    metaDescription:
      "Shopify store design, theme customization, SEO and conversion support from Smartlance Designs for product businesses and online retailers.",
  },
  {
    slug: "bigcommerce",
    name: "BigCommerce",
    title: "BigCommerce Website Design & Development",
    href: "/platforms/bigcommerce",
    summary:
      "E-commerce development for businesses that need scalable catalogue, commerce and integration capabilities.",
    description:
      "Smartlance Designs supports BigCommerce storefronts with practical design, development and optimization work — focused on catalogue clarity, responsive commerce, performance and integrations that support how the business actually sells.",
    tagline:
      "BigCommerce storefronts built for catalogue clarity, commerce performance and growth.",
    icon: "shopping-bag",
    featured: true,
    group: "ecommerce",
    prominence: "high",
    navigationFeatured: true,
    verifiedExperience: false,
    platformMatch: "BigCommerce",
    legacyUrl: "https://www.smartlancedesigns.com/platform/bigcommerce/",
    audiences: [
      "Product businesses with larger catalogues",
      "Retailers needing scalable e-commerce structure",
      "Businesses evaluating BigCommerce as a commerce platform",
      "Teams needing clearer storefront UX and SEO foundations",
    ],
    whenItFits: [
      "Catalogue size and structure need room to grow",
      "Merchandising clarity matters across categories",
      "You need stronger SEO foundations for product and category pages",
      "Responsive commerce and conversion paths need improvement",
    ],
    capabilities: [
      "Storefront design and UX improvements",
      "Theme customization",
      "Product catalogue and category structure",
      "Navigation and merchandising hierarchy",
      "Responsive commerce experiences",
      "SEO foundations for categories and products",
      "Conversion improvements on key store paths",
      "Performance optimization within platform constraints",
      "Integration planning for essential business tools",
      "Store redesign and structured improvements",
    ],
    challenges: [
      "Catalogue growth has made navigation confusing",
      "Category pages lack clear merchandising structure",
      "Product detail pages are not converting well",
      "Mobile commerce needs improvement",
      "SEO visibility is weak across product and category pages",
      "Integrations or apps are creating friction",
      "The storefront no longer matches the brand or offer",
    ],
    seoSection: {
      title: "BigCommerce SEO Depends on Catalogue Structure and Page Quality",
      intro:
        "A scalable commerce platform still needs thoughtful category architecture, metadata discipline and fast, clear product pages to perform in search and convert traffic.",
      points: [
        "Category and product page structure",
        "Metadata and on-page content quality",
        "Internal linking across catalogue pages",
        "Duplicate or thin category content",
        "Image optimization and page speed",
        "Structured data where appropriate",
        "Campaign landing pages for key product lines",
      ],
    },
    conversionNote:
      "BigCommerce stores benefit when category pages guide buyers efficiently, product pages answer key objections and checkout paths stay straightforward across devices.",
    migrationNote:
      "If your storefront has outgrown its theme or become difficult to merchandize, a redesign with clearer information architecture may be the right next step rather than continuing to patch individual pages.",
    relatedServiceHrefs: [
      "/services/website-migration",
      "/services/website-performance-optimization",
      "/services/ecommerce-development",
      "/services/website-development",
      "/services/website-redesign",
      "/seo",
      "/seo/technical-seo",
    ],
    relatedSeoHrefs: ["technical-seo", "on-page-seo"],
    faqs: [
      {
        question: "Do you provide enterprise BigCommerce consulting?",
        answer:
          "We focus on practical storefront design, development, SEO and conversion improvements. We do not position Smartlance as an enterprise commerce consultancy or make unsupported platform claims.",
      },
      {
        question: "Can you improve an existing BigCommerce store?",
        answer:
          "Yes. Many projects focus on clearer category structure, stronger product pages, SEO foundations and conversion improvements on an existing storefront.",
      },
      {
        question: "How does SEO work on BigCommerce?",
        answer:
          "Catalogue architecture, metadata, internal linking, thin category content and performance all affect visibility. We improve those foundations rather than treating SEO as an afterthought.",
      },
    ],
    ctaTitle: "Need a Better BigCommerce Storefront?",
    ctaDescription:
      "Tell us about your catalogue and current store. We will recommend a practical next step.",
    metaTitle: "BigCommerce Website Development",
    metaDescription:
      "BigCommerce storefront design, development, SEO and conversion support from Smartlance Designs for scalable product businesses.",
  },
  {
    slug: "salesforce",
    name: "Salesforce",
    title: "Salesforce Website & CRM Integration",
    href: "/platforms/salesforce",
    summary:
      "Website and landing-page work connected to Salesforce lead capture, forms and customer journeys.",
    description:
      "Smartlance Designs supports website experiences that connect cleanly to Salesforce-powered workflows — including lead capture, forms, landing pages and customer journeys — without positioning the company as a full enterprise Salesforce implementation partner.",
    tagline:
      "Website experiences that connect lead capture and customer journeys to Salesforce workflows.",
    icon: "briefcase",
    featured: false,
    group: "connected",
    prominence: "low",
    navigationFeatured: false,
    verifiedExperience: false,
    platformMatch: "Salesforce",
    legacyUrl: "https://www.smartlancedesigns.com/platform/salesforce/",
    audiences: [
      "Businesses using Salesforce in sales or marketing workflows",
      "Teams needing better website-to-CRM lead capture",
      "Companies improving landing pages tied to Salesforce journeys",
      "Organizations aligning website UX with CRM handoff",
    ],
    whenItFits: [
      "Salesforce already powers sales or marketing workflows",
      "Website forms need cleaner CRM handoff",
      "Landing pages should match campaign intent",
      "Enquiry and demo paths need clearer conversion structure",
    ],
    capabilities: [
      "Website-to-Salesforce integration planning",
      "Lead capture forms and landing pages",
      "CRM-connected website experiences",
      "Customer journey and handoff improvements",
      "Marketing and sales landing page support",
      "Website UX around Salesforce-powered workflows",
      "Conversion structure for enquiry and demo paths",
    ],
    challenges: [
      "Website forms do not connect reliably to Salesforce",
      "Lead capture pages are unclear or underperforming",
      "Marketing and sales handoff feels disjointed",
      "Landing pages do not match campaign intent",
      "Website UX does not support the CRM workflow",
      "Teams need clearer enquiry paths without rebuilding the entire stack",
    ],
    conversionNote:
      "Salesforce-connected websites work best when forms are simple, landing pages match campaign intent and visitors understand what happens after they enquire.",
    migrationNote:
      "If your current site makes CRM integration fragile or creates duplicate lead handling, it may be worth redesigning key conversion pages and form flows before adding more tooling on top.",
    relatedServiceHrefs: [
      "/services/website-development",
      "/services/landing-page-design",
      "/services/digital-marketing",
      "/services/conversion-rate-optimization",
    ],
    faqs: [
      {
        question: "Is Smartlance a Salesforce implementation partner?",
        answer:
          "No. We do not position Smartlance Designs as a Salesforce-certified consultancy or enterprise CRM transformation partner. Our focus is the website experience, landing pages, forms and integration points that support your existing Salesforce workflow.",
      },
      {
        question: "What kind of Salesforce work do you support?",
        answer:
          "Practical website-side work: lead capture, landing pages, form integration planning and UX improvements around Salesforce-powered sales or marketing journeys.",
      },
      {
        question: "Do you rebuild entire Salesforce orgs?",
        answer:
          "No. We focus on the website and conversion experience that connects to Salesforce — not full CRM implementation or enterprise consulting.",
      },
    ],
    ctaTitle: "Need Your Website and CRM to Work Together?",
    ctaDescription:
      "Tell us about your current Salesforce workflow and website. We will focus on practical lead-capture and landing-page improvements.",
    metaTitle: "Salesforce Website & CRM Integration",
    metaDescription:
      "Website, landing page and lead-capture support for Salesforce-connected workflows — without enterprise CRM consulting claims.",
  },
  {
    slug: "clixlo",
    name: "Clixlo",
    title: "Clixlo Website & Funnel Support",
    href: "/platforms/clixlo",
    summary:
      "Website and funnel support for businesses already operating within the Clixlo ecosystem.",
    description:
      "Smartlance Designs provides practical design and improvement support for businesses using Clixlo — including page setup, funnel pages, landing pages and conversion-focused structure within an existing Clixlo workflow.",
    tagline:
      "Practical page and funnel support for businesses already using Clixlo.",
    icon: "layout-template",
    featured: false,
    group: "connected",
    prominence: "low",
    navigationFeatured: false,
    verifiedExperience: false,
    platformMatch: "Clixlo",
    legacyUrl: "https://www.smartlancedesigns.com/platform/clixlo/",
    audiences: [
      "Businesses already using Clixlo",
      "Teams needing clearer funnel or landing page structure",
      "Operators improving an existing Clixlo site or page set",
    ],
    whenItFits: [
      "You are already operating within Clixlo",
      "Funnel or landing pages need clearer structure",
      "Offers need stronger conversion hierarchy",
      "You want page improvements without changing platforms",
    ],
    capabilities: [
      "Page design and layout improvements",
      "Website and funnel page setup support",
      "Landing page structure for offers and campaigns",
      "Existing site improvements within Clixlo",
      "Conversion-focused content organization",
      "Clearer calls to action and page hierarchy",
    ],
    challenges: [
      "Pages do not explain the offer clearly",
      "Funnel structure feels confusing or incomplete",
      "Landing pages are not aligned with campaigns",
      "The site needs better organization without changing platforms",
      "Conversion paths need simplification",
    ],
    conversionNote:
      "Clixlo pages perform better when each step has one clear purpose, the offer is easy to understand and visitors always know what to do next.",
    relatedServiceHrefs: [
      "/services/landing-page-design",
      "/services/website-design",
      "/services/conversion-rate-optimization",
    ],
    faqs: [
      {
        question: "Do you implement full Clixlo platform setups?",
        answer:
          "We focus on practical website and funnel page support for businesses already operating in Clixlo — design, structure, landing pages and conversion improvements rather than broad platform consulting.",
      },
      {
        question: "Can you improve existing Clixlo pages?",
        answer:
          "Yes. Many projects focus on clearer offers, better page hierarchy, stronger CTAs and more usable funnel steps within an existing Clixlo workflow.",
      },
      {
        question: "Do you provide SEO for Clixlo?",
        answer:
          "We can improve page clarity, structure and conversion paths. Broader SEO programmes are scoped separately based on what the platform and project support.",
      },
    ],
    ctaTitle: "Need Help Improving Your Clixlo Website or Funnel?",
    ctaDescription:
      "Tell us about your current pages and offer. We will recommend practical structure and conversion improvements.",
    metaTitle: "Clixlo Website & Funnel Support",
    metaDescription:
      "Clixlo page design, funnel support and conversion-focused improvements from Smartlance Designs for businesses already using the platform.",
  },
  ...additionalPlatforms,
];

export const platformGroupMeta: {
  id: PlatformGroupId;
  title: string;
  description: string;
}[] = [
  {
    id: "websites",
    title: "Core Website Platforms",
    description:
      "Content and marketing platforms for business websites, redesigns and ongoing publishing.",
  },
  {
    id: "ecommerce",
    title: "E-commerce Platforms",
    description:
      "Storefront platforms when product discovery, catalogues and checkout are central.",
  },
  {
    id: "connected",
    title: "Connected / Specialist Platforms",
    description:
      "Specialist environments for CRM-connected journeys and existing funnel workflows.",
  },
];

export function getPlatformBySlug(slug: string) {
  return platforms.find((platform) => platform.slug === slug);
}

export function getFeaturedPlatforms() {
  return platforms.filter((platform) => platform.featured);
}

export function getPlatformsByGroup(group: PlatformGroupId) {
  return platforms.filter((platform) => platform.group === group);
}

export function getPlatformHrefForName(name?: string) {
  if (!name) return undefined;
  return platforms.find(
    (platform) => platform.platformMatch === name || platform.name === name,
  )?.href;
}
