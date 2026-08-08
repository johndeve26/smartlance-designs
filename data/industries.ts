import type { Industry, IndustryServiceLink } from "@/types";

export type { IndustryServiceLink };

export type FeaturedIndustryGroup = {
  id: string;
  title: string;
  /** Large editorial feature vs half-width supporting feature */
  layout: "feature" | "half";
  summary: string;
  needs: string[];
  projectSlugs: string[];
  services: IndustryServiceLink[];
};

export type IndustryJourney = {
  label: string;
  description: string;
};

export type IndustryFundamental = {
  title: string;
  description: string;
};

/**
 * Full industries catalog for /industries.
 * group: "proven" = portfolio-backed; "supported" = can help without claiming case-study depth.
 */
export const industriesCatalog: Industry[] = [
  // —— Proven experience ——
  {
    slug: "short-term-rentals",
    name: "Short-Term Rentals",
    description:
      "Direct-booking and property websites for vacation rental and guest-stay businesses.",
    icon: "hotel",
    group: "proven",
    featured: true,
    projectSlugs: ["katerinas-place", "banyan-vacations", "zen-stays-rental"],
    relatedServices: [
      { label: "Website Strategy", href: "/services/website-strategy" },
      { label: "Website Design", href: "/services/website-design" },
      { label: "SEO", href: "/seo" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
  },
  {
    slug: "hospitality",
    name: "Hospitality",
    description:
      "Hotels, stays and guest experiences with booking-friendly design and clear next steps.",
    icon: "hotel",
    group: "proven",
    featured: true,
    projectSlugs: ["the-coast"],
    relatedServices: [
      { label: "Website Strategy", href: "/services/website-strategy" },
      { label: "Website Design", href: "/services/website-design" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
  },
  {
    slug: "cabin-rentals",
    name: "Cabin Rentals",
    description:
      "Scenic cabin and lodge sites focused on atmosphere, listings and enquiries.",
    icon: "hotel",
    group: "proven",
    featured: true,
    projectSlugs: ["overlook-cabin-rentals"],
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Website Development", href: "/services/website-development" },
      { label: "SEO", href: "/seo" },
    ],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    description:
      "Property websites designed to showcase listings, build trust and generate enquiries.",
    icon: "building",
    group: "proven",
    featured: true,
    projectSlugs: ["nashville-home-viewer", "kaerek-homes"],
    relatedServices: [
      { label: "Website Strategy", href: "/services/website-strategy" },
      { label: "Local SEO", href: "/seo/local-seo" },
      { label: "Website Development", href: "/services/website-development" },
    ],
  },
  {
    slug: "property-management",
    name: "Property Management",
    description:
      "Professional sites for managers who need clarity, trust and lead capture.",
    icon: "key",
    group: "proven",
    featured: true,
    projectSlugs: ["gemini-corporate-relocations"],
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Website Development", href: "/services/website-development" },
      { label: "SEO", href: "/seo" },
    ],
  },

  // —— Other businesses we support ——
  {
    slug: "professional-services",
    name: "Professional Services",
    description:
      "Clear, credible websites for consultants, agencies and specialist B2B firms.",
    icon: "briefcase",
    group: "supported",
    relatedServices: [
      { label: "Website Strategy", href: "/services/website-strategy" },
      { label: "Website Design", href: "/services/website-design" },
      { label: "SEO Copywriting", href: "/services/seo-copywriting" },
      { label: "Local SEO", href: "/seo/local-seo" },
    ],
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    description:
      "Online stores focused on product discovery, trust and smoother purchasing.",
    icon: "shopping-bag",
    group: "supported",
    relatedServices: [
      {
        label: "E-commerce Development",
        href: "/services/ecommerce-development",
      },
      { label: "Shopify", href: "/platforms/shopify" },
      { label: "WooCommerce", href: "/platforms/woocommerce" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
  },
  {
    slug: "local-businesses",
    name: "Local Businesses",
    description:
      "Location-focused websites and SEO that help nearby customers find you.",
    icon: "map-pin",
    group: "supported",
    relatedServices: [
      { label: "Local SEO", href: "/seo/local-seo" },
      { label: "Website Design", href: "/services/website-design" },
    ],
  },
  {
    slug: "travel-tourism",
    name: "Travel & Tourism",
    description:
      "Websites for tour operators, travel brands and destination businesses focused on discovery, enquiries and bookings.",
    icon: "plane",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "SEO", href: "/seo" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
  },
  {
    slug: "restaurants-food",
    name: "Restaurants & Food Businesses",
    description:
      "Mobile-friendly websites for restaurants, cafés and food brands with clear menus, locations, reservations and ordering paths.",
    icon: "utensils",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Local SEO", href: "/seo/local-seo" },
      { label: "Landing Pages", href: "/services/landing-page-design" },
    ],
  },
  {
    slug: "construction-home-services",
    name: "Construction & Home Services",
    description:
      "Lead-focused websites for contractors, builders and home-service businesses that need stronger local visibility and enquiries.",
    icon: "hard-hat",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Local SEO", href: "/seo/local-seo" },
      { label: "Website Development", href: "/services/website-development" },
    ],
  },
  {
    slug: "legal-advisory",
    name: "Legal & Advisory Firms",
    description:
      "Credible, search-friendly websites for law firms and advisory practices built around expertise, trust and consultation enquiries.",
    icon: "scale",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "SEO", href: "/seo" },
      { label: "Local SEO", href: "/seo/local-seo" },
    ],
  },
  {
    slug: "healthcare-wellness",
    name: "Healthcare & Wellness",
    description:
      "Clear, accessible websites for clinics, wellness brands and health providers focused on services, trust and appointment journeys.",
    icon: "heart",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Local SEO", href: "/seo/local-seo" },
      { label: "Website Development", href: "/services/website-development" },
    ],
  },
  {
    slug: "education-training",
    name: "Education & Training",
    description:
      "Websites for schools, training providers and learning businesses that make programmes, admissions and enquiries easier to navigate.",
    icon: "graduation-cap",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Website Development", href: "/services/website-development" },
      { label: "SEO", href: "/seo" },
    ],
  },
  {
    slug: "technology-saas",
    name: "Technology & SaaS",
    description:
      "Clear product and marketing websites for technology companies that need to explain their offer, build credibility and generate qualified leads.",
    icon: "monitor",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Landing Pages", href: "/services/landing-page-design" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
  },
  {
    slug: "beauty-personal-care",
    name: "Beauty & Personal Care",
    description:
      "Conversion-focused websites for salons, spas and personal-care brands with services, booking and local discovery in mind.",
    icon: "sparkles",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Local SEO", href: "/seo/local-seo" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
  },
  {
    slug: "automotive",
    name: "Automotive",
    description:
      "Websites for dealerships and automotive service providers focused on inventory, service information and lead generation.",
    icon: "car",
    group: "supported",
    relatedServices: [
      { label: "Website Development", href: "/services/website-development" },
      { label: "Local SEO", href: "/seo/local-seo" },
      { label: "Website Design", href: "/services/website-design" },
    ],
  },
  {
    slug: "events-entertainment",
    name: "Events & Entertainment",
    description:
      "Websites and landing pages for venues and entertainment brands focused on discovery, ticketing and audience conversion.",
    icon: "ticket",
    group: "supported",
    relatedServices: [
      { label: "Landing Pages", href: "/services/landing-page-design" },
      { label: "Website Development", href: "/services/website-development" },
      { label: "Digital Marketing", href: "/services/digital-marketing" },
    ],
  },
  {
    slug: "nonprofits-community",
    name: "Nonprofits & Community Organizations",
    description:
      "Accessible websites that communicate a mission clearly and make it easier to donate, participate or get involved.",
    icon: "users",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Website Development", href: "/services/website-development" },
    ],
  },
  {
    slug: "finance-business-services",
    name: "Finance & Business Services",
    description:
      "Professional websites for financial and business-service companies that need clear positioning, trust and qualified enquiries.",
    icon: "line-chart",
    group: "supported",
    relatedServices: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "SEO", href: "/seo" },
      { label: "Landing Pages", href: "/services/landing-page-design" },
    ],
  },
];

/** Homepage preview — original eight industries (proven + core supported). */
const homepageSlugs = new Set([
  "short-term-rentals",
  "hospitality",
  "cabin-rentals",
  "real-estate",
  "property-management",
  "professional-services",
  "ecommerce",
  "local-businesses",
]);

export const industries = industriesCatalog.filter((industry) =>
  homepageSlugs.has(industry.slug),
);

export const provenIndustries = industriesCatalog.filter(
  (industry) => industry.group === "proven",
);

export const supportedIndustries = industriesCatalog.filter(
  (industry) => industry.group === "supported",
);

/** @deprecated Prefer supportedIndustries — kept for existing imports */
export type SupportingIndustry = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  services?: IndustryServiceLink[];
};

/** Verified experience statement — tied to migrated portfolio work */
export const industriesExperienceStatement =
  "Our portfolio includes hands-on work across hospitality, short-term rentals, property management and real estate, alongside website and growth work for service businesses.";

/**
 * Featured groups with real project proof.
 * Project slugs must match published portfolio entries.
 */
export const featuredIndustryGroups: FeaturedIndustryGroup[] = [
  {
    id: "hospitality-short-term-rentals",
    title: "Hospitality & Short-Term Rentals",
    layout: "feature",
    summary:
      "Guests need to understand the stay, location and next step quickly — whether that is a booking, enquiry or property shortlist. Sites in this space have to present accommodation clearly, build trust fast and work well on mobile.",
    needs: [
      "Property discovery and clear accommodation presentation",
      "Direct booking or enquiry paths that are easy to follow",
      "Mobile-first guest browsing",
      "Trust signals that reduce hesitation",
      "SEO foundations around destination and stay intent",
      "Conversion-focused journeys from interest to action",
    ],
    projectSlugs: ["the-coast", "katerinas-place", "banyan-vacations"],
    services: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Website Development", href: "/services/website-development" },
      { label: "SEO", href: "/seo" },
      {
        label: "Conversion Optimization",
        href: "/services/conversion-rate-optimization",
      },
    ],
  },
  {
    id: "real-estate-property",
    title: "Real Estate & Property",
    layout: "half",
    summary:
      "Property websites need clear listing information, useful detail and an obvious route to enquiry. Buyers and renters should be able to compare options, understand the offer and contact the right person without friction.",
    needs: [
      "Listing presentation that is easy to scan",
      "Buyer and renter discovery paths",
      "Local search visibility",
      "Trust and credibility signals",
      "Clear enquiry routes on every key page",
      "Responsive experience across devices",
    ],
    projectSlugs: [
      "nashville-home-viewer",
      "kaerek-homes",
      "gemini-corporate-relocations",
    ],
    services: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Website Development", href: "/services/website-development" },
      { label: "Local SEO", href: "/seo/local-seo" },
    ],
  },
  {
    id: "cabin-vacation-rentals",
    title: "Cabin & Vacation Rentals",
    layout: "half",
    summary:
      "Cabin and vacation rental sites succeed when the atmosphere comes through clearly — alongside practical details guests need before they enquire or book. Destination context, mobile browsing and direct contact paths matter as much as visuals.",
    needs: [
      "Visual property presentation that feels true to the stay",
      "Clear accommodation details and amenities",
      "Direct enquiry or booking paths",
      "Comfortable mobile browsing",
      "Destination and location content",
      "SEO foundations for property and destination search",
    ],
    projectSlugs: ["overlook-cabin-rentals"],
    services: [
      { label: "Website Design", href: "/services/website-design" },
      { label: "Website Development", href: "/services/website-development" },
      { label: "SEO", href: "/seo" },
    ],
  },
];

/** Why website journeys differ by business type */
export const industryJourneys: IndustryJourney[] = [
  {
    label: "Hospitality",
    description:
      "Guests need to understand the stay, location and booking path quickly.",
  },
  {
    label: "Real Estate",
    description:
      "Users need clear listing information and easy ways to enquire.",
  },
  {
    label: "Local Services",
    description:
      "Search visibility, trust and contact friction matter heavily.",
  },
  {
    label: "E-commerce",
    description:
      "Product discovery, mobile shopping and checkout become central.",
  },
];

/** Selected work spanning different verified industries */
export const industriesSelectedWorkSlugs = [
  "gemini-corporate-relocations",
  "the-coast",
  "overlook-cabin-rentals",
] as const;

export const industryFundamentals: IndustryFundamental[] = [
  {
    title: "Clarity",
    description: "Visitors understand the offer without guessing.",
  },
  {
    title: "Discoverability",
    description: "Structure and SEO support how people actually search.",
  },
  {
    title: "Trust",
    description: "Credibility shows up in the experience, not just claims.",
  },
  {
    title: "Performance",
    description: "Pages load quickly and stay usable on mobile.",
  },
  {
    title: "Conversion",
    description: "The next step is obvious at the right moment.",
  },
  {
    title: "Maintainability",
    description: "The site can keep working after launch.",
  },
];
