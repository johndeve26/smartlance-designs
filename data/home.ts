/** @migration-reference Phase 2 — runtime reads DB repositories; this file remains seed/reference source. */
import type { TrustStat, ProcessStep, ValueProp } from "@/types";
import { getTestimonialById } from "@/data/testimonials";

/**
 * Add verified metrics and set isPlaceholder: false.
 * Placeholder stats never appear on the live site.
 */
export const trustStats: TrustStat[] = [
  {
    id: "projects",
    value: "",
    label: "Projects Completed",
    isPlaceholder: true,
  },
  {
    id: "businesses",
    value: "",
    label: "Businesses Supported",
    isPlaceholder: true,
  },
  {
    id: "years",
    value: "5+",
    label: "Years Experience",
    isPlaceholder: false,
  },
  {
    id: "countries",
    value: "",
    label: "Countries Served",
    isPlaceholder: true,
  },
];

export function getPublishedTrustStats() {
  return trustStats.filter(
    (stat) => !stat.isPlaceholder && stat.value.trim().length > 0,
  );
}

export const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: "Discovery",
    description:
      "We learn how your business wins work today, who you serve, and what your website is failing to do.",
  },
  {
    step: 2,
    title: "Strategy",
    description:
      "We define page structure, messaging priorities, SEO direction and the actions each key page should drive.",
  },
  {
    step: 3,
    title: "Design",
    description:
      "We design clear interfaces that build trust and make the next step obvious.",
  },
  {
    step: 4,
    title: "Development",
    description:
      "We build a fast, maintainable site with the technical foundations SEO needs.",
  },
  {
    step: 5,
    title: "Launch",
    description:
      "We test, refine and launch with analytics, tracking and technical checks in place.",
  },
  {
    step: 6,
    title: "Growth",
    description:
      "We keep improving through SEO, content updates, maintenance and conversion work.",
  },
];

export const valueProps: ValueProp[] = [
  {
    title: "SEO planned into the build",
    description:
      "Search visibility is part of structure and development — not a cleanup job after launch.",
    icon: "search",
  },
  {
    title: "Pages that ask for the right action",
    description:
      "Important pages lead somewhere useful: an enquiry, a booking, a purchase, or a clear next step.",
    icon: "target",
  },
  {
    title: "Mobile that actually works",
    description:
      "Most visitors will judge you on a phone. Layouts, forms and CTAs are designed for that reality.",
    icon: "smartphone",
  },
  {
    title: "Speed as part of the experience",
    description:
      "Slow pages waste traffic. Performance is treated as a design and development requirement.",
    icon: "zap",
  },
  {
    title: "Decisions tied to business goals",
    description:
      "We choose layouts and content based on what your business needs to achieve — not design trends.",
    icon: "briefcase",
  },
  {
    title: "Support after launch",
    description:
      "Websites need care. SEO, maintenance and conversion improvements can continue after go-live.",
    icon: "trending-up",
  },
];

export const proofBarItems = [
  { value: "5+", label: "Years Experience" },
  { value: "8", label: "Published Projects" },
  { value: "Website + SEO", label: "Integrated Expertise" },
];

export const growthSystemSteps = [
  { title: "Strategy", description: "Goals, audience and commercial priorities." },
  { title: "Structure", description: "Page hierarchy that supports search and decisions." },
  { title: "Design", description: "Clear interfaces that build trust." },
  { title: "Development", description: "Fast, maintainable technical foundations." },
  { title: "SEO", description: "Visibility built into the site itself." },
  { title: "Conversion", description: "Enquiries, bookings and measurable next steps." },
];

/**
 * Homepage hero showcase.
 * Curated separately from Selected Work so the two never share an image.
 */
export const homepageHeroProjectSlug = "overlook-cabin-rentals";

/** Homepage testimonials — strongest, scannable quotes */
export const homepageTestimonialIds = [
  "gemini-anderson",
  "banyan-vacations",
  "the-coast-abdullah",
] as const;

export const whySmartlanceItems = [
  {
    title: "Strategy Before Design",
    description:
      "We understand the business, audience and user journey before layout decisions are made.",
    icon: "briefcase",
  },
  {
    title: "SEO Built Into the Foundation",
    description:
      "Search visibility is considered during structure, content and development — not after launch.",
    icon: "search",
  },
  {
    title: "Clear Communication",
    description:
      "Clients understand what is being built, why it matters and what happens next.",
    icon: "clipboard-check",
  },
  {
    title: "Built for Growth",
    description:
      "The website can evolve through SEO, content, maintenance and conversion improvements.",
    icon: "trending-up",
  },
];

export const homepageServiceItems = [
  {
    slug: "website-design",
    title: "Website Design",
    description: "Clear UX, brand presentation and conversion-focused layouts.",
    href: "/services/website-design",
    icon: "palette",
    size: "large" as const,
  },
  {
    slug: "website-development",
    title: "Website Development",
    description: "Fast, maintainable builds with SEO-ready foundations.",
    href: "/services/website-development",
    icon: "code",
    size: "large" as const,
  },
  {
    slug: "seo",
    title: "SEO",
    description: "Technical, on-page and local visibility that supports the site.",
    href: "/seo",
    icon: "search",
    size: "medium" as const,
  },
  {
    slug: "website-redesign",
    title: "Website Redesign",
    description: "Fix outdated, slow or underperforming websites.",
    href: "/services/website-redesign",
    icon: "refresh-cw",
    size: "medium" as const,
  },
  {
    slug: "ecommerce-development",
    title: "E-commerce",
    description: "Stores designed for product discovery and checkout clarity.",
    href: "/services/ecommerce-development",
    icon: "shopping-bag",
    size: "medium" as const,
  },
  {
    slug: "conversion-rate-optimization",
    title: "Conversion Optimization",
    description: "Improve how effectively traffic becomes enquiries and sales.",
    href: "/services/conversion-rate-optimization",
    icon: "target",
    size: "medium" as const,
  },
];

export const growthSystemFlow = growthSystemSteps.map((step) => step.title);

export const problemPoints = [
  {
    title: "Hard to find on Google",
    description: "The right customers search — but land on competitors instead.",
  },
  {
    title: "Visitors leave without enquiring",
    description: "Traffic arrives, but pages do not guide people to act.",
  },
  {
    title: "Slow mobile experience",
    description: "Key pages feel awkward or sluggish on a phone.",
  },
  {
    title: "Outdated design",
    description: "The site no longer reflects the quality of the business.",
  },
  {
    title: "Weak messaging",
    description: "New visitors cannot quickly tell what you do or who you help.",
  },
  {
    title: "Difficult to update",
    description: "Simple content changes require developer help every time.",
  },
];

export const growthSystemItems = [
  {
    title: "Structure",
    description: "Page hierarchy that matches how people search and decide.",
  },
  {
    title: "Performance",
    description: "Fast loading that protects both experience and rankings.",
  },
  {
    title: "Experience",
    description: "Clear journeys that make your offer easy to understand.",
  },
  {
    title: "Content",
    description: "Copy that answers real questions and supports search intent.",
  },
  {
    title: "Conversion",
    description: "CTAs, forms and page flow designed to create enquiries.",
  },
  {
    title: "Measurement",
    description: "Analytics so you can see what works and improve it.",
  },
];

export const reviewChecklist = [
  { label: "SEO", detail: "Visibility and indexability" },
  { label: "Speed", detail: "Performance bottlenecks" },
  { label: "Mobile UX", detail: "Phone usability" },
  { label: "Conversion", detail: "CTAs and enquiry paths" },
  { label: "Site structure", detail: "Clarity and hierarchy" },
];

export function getHomepageTestimonials() {
  return homepageTestimonialIds
    .map((id) => getTestimonialById(id))
    .filter((item): item is NonNullable<ReturnType<typeof getTestimonialById>> =>
      Boolean(item),
    );
}

export const seoHighlights = [
  "Technical SEO",
  "On-page SEO",
  "Local SEO",
  "Site architecture",
  "Performance",
  "Measurement",
];
