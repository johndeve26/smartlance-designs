import type { ProcessStep, ValueProp } from "@/types";

/** Compact company facts — verified only */
export const aboutSnapshot = [
  { label: "Experience", value: "5+ years" },
  { label: "Published work", value: "8 case studies" },
  { label: "Focus", value: "Website + SEO + Conversion" },
  { label: "Platform experience", value: "WordPress-led builds" },
] as const;

export const aboutCapabilities = [
  "Website Design",
  "Website Development",
  "SEO",
  "Conversion",
  "Digital Marketing",
] as const;

export const aboutApproachChain = [
  { title: "Strategy", note: "Goals and commercial priorities" },
  { title: "Structure", note: "Pages that support search and decisions" },
  { title: "Design", note: "Clarity, trust and hierarchy" },
  { title: "Development", note: "Fast, maintainable foundations" },
  { title: "SEO", note: "Visibility built into the site" },
  { title: "Conversion", note: "Clear paths to enquiries and bookings" },
  { title: "Growth", note: "Ongoing improvement after launch" },
] as const;

export const aboutValues: ValueProp[] = [
  {
    title: "SEO planned into the build",
    description:
      "Search visibility is part of structure and development — not a cleanup job after launch.",
    icon: "search",
  },
  {
    title: "Pages focused on the right action",
    description:
      "Important pages lead somewhere useful: an enquiry, a booking, a purchase or a clear next step.",
    icon: "target",
  },
  {
    title: "Mobile that actually works",
    description:
      "Most visitors will judge you on a phone. Layouts, forms and CTAs are designed for that reality.",
    icon: "smartphone",
  },
  {
    title: "Performance as part of experience",
    description:
      "Slow pages waste traffic. Speed is treated as a design and development requirement.",
    icon: "zap",
  },
  {
    title: "Decisions tied to business goals",
    description:
      "Layouts and content follow what the business needs to achieve — not design trends for their own sake.",
    icon: "briefcase",
  },
  {
    title: "Support after launch",
    description:
      "Websites need care. SEO, maintenance and conversion improvements can continue after go-live.",
    icon: "trending-up",
  },
];

export const aboutIndustries = [
  {
    title: "Hospitality",
    description: "Villas, stays and guest-facing booking journeys.",
  },
  {
    title: "Short-term rentals",
    description: "Direct-booking sites that support property presentation.",
  },
  {
    title: "Cabin rentals",
    description: "Clear cabin discovery and enquiry paths.",
  },
  {
    title: "Property management",
    description: "Service clarity for corporate housing and relocation.",
  },
  {
    title: "Real estate",
    description: "Listing presentation and buyer-facing information.",
  },
  {
    title: "Service businesses",
    description: "Clear offers, trust signals and conversion paths.",
  },
] as const;

export const aboutWorkingWith = [
  {
    title: "Clear communication",
    description:
      "You understand what is being built, why it matters and what happens next.",
  },
  {
    title: "Defined scope",
    description:
      "Priorities are agreed early so design and development stay focused on useful outcomes.",
  },
  {
    title: "Shared project direction",
    description:
      "Structure, messaging and conversion goals are aligned before visual polish.",
  },
  {
    title: "Progress you can follow",
    description:
      "Work moves through discovery, design, development and launch with practical check-ins.",
  },
  {
    title: "Practical recommendations",
    description:
      "Advice stays grounded in what will help visitors find, understand and act on your offer.",
  },
  {
    title: "Support after launch",
    description:
      "Training, maintenance and ongoing SEO or conversion work can continue when useful.",
  },
] as const;

export const aboutDontOptimizeFor = [
  {
    title: "Design trends without purpose",
    description: "Visual novelty that does not help visitors understand or act.",
  },
  {
    title: "Pages with no clear job",
    description: "Content that looks busy but never asks for a useful next step.",
  },
  {
    title: "SEO as an afterthought",
    description: "Search work bolted on after the site is already hard to structure.",
  },
  {
    title: "Features that add friction",
    description: "Extra interactions that make booking, enquiry or browsing harder.",
  },
] as const;

/** Featured case studies for About proof — verified published projects */
export const aboutFeaturedProjectSlugs = [
  "gemini-corporate-relocations",
  "katerinas-place",
  "the-coast",
] as const;

/** Verified testimonial for About — distinct from homepage cluster where useful */
export const aboutTestimonialId = "the-coast-abdullah" as const;

export const aboutProcessSteps: ProcessStep[] = [
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
