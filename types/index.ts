export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
};

export type ServiceCategory = "design" | "development" | "seo" | "growth" | "maintenance";

/** Hub / navigation grouping for website + conversion services */
export type ServiceGroupId =
  | "websites"
  | "seo-growth"
  | "conversion-measurement"
  | "support";

export type ServiceCapability = {
  title: string;
  description: string;
  icon: string;
};

export type ServiceVisualVariant =
  | "design"
  | "development"
  | "redesign"
  | "ecommerce"
  | "landing"
  | "cro"
  | "maintenance"
  | "marketing"
  | "strategy"
  | "performance"
  | "audit"
  | "copywriting"
  | "analytics"
  | "migration"
  | "branding"
  | "uiux";

export type Service = {
  slug: string;
  title: string;
  shortTitle?: string;
  href: string;
  category: ServiceCategory;
  /** Services hub + nav grouping */
  group: ServiceGroupId;
  /** Show in curated Services dropdown */
  navigationFeatured?: boolean;
  summary: string;
  description: string;
  /** Hero subhead under the H1 */
  tagline?: string;
  /** Dark capability strip items (expertise layout) */
  capabilities?: ServiceCapability[];
  /** Narrative section heading */
  narrativeTitle?: string;
  /** Longer body under the narrative heading */
  narrative?: string;
  /** SEO connection statement for this service */
  seoConnection?: string;
  /** Ideal-fit scenarios */
  idealFor?: string[];
  /** Service-page final CTA title */
  ctaTitle?: string;
  /** Service-page final CTA description */
  ctaDescription?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  /** Hero visual concept */
  visualVariant?: ServiceVisualVariant;
  /** Preferred related project slugs (verified only) */
  relatedProjectSlugs?: string[];
  /** Optional redesign evaluation checklist */
  evaluationItems?: string[];
  /** Optional audience line under hero */
  audience?: string;
  /** Optional platforms note under narrative */
  platformsNote?: string;
  icon: string;
  featured?: boolean;
  problems?: string[];
  deliverables?: string[];
  process?: { title: string; description: string }[];
  faqs?: FaqItem[];
  relatedServiceSlugs?: string[];
  relatedSeoSlugs?: string[];
  relatedPlatformSlugs?: string[];
  metaTitle: string;
  metaDescription: string;
  noIndex?: boolean;
  canonicalOverride?: string | null;
  ogImagePath?: string | null;
};

export type SeoTopicGroup = {
  title: string;
  description: string;
  items: string[];
};

export type SeoService = {
  slug: string;
  title: string;
  href: string;
  summary: string;
  description: string;
  /** Outcome-focused hero subhead */
  tagline?: string;
  icon: string;
  /** Legacy flat topic list (still useful for schema/fallback) */
  topics: string[];
  /** Grouped capability areas for premium layout */
  topicGroups?: SeoTopicGroup[];
  /** Why this SEO service matters */
  whyTitle?: string;
  whyBody?: string;
  whyPoints?: string[];
  /** Differentiator section */
  differentiatorTitle?: string;
  differentiatorBody?: string;
  differentiatorLinks?: { label: string; href: string }[];
  /** Ideal-fit scenarios */
  idealFor?: string[];
  deliverables?: string[];
  process?: { title: string; description: string }[];
  /** Visual concept for hero */
  visualVariant?: "technical" | "local" | "onpage" | "audit";
  /** Preferred related project slugs */
  relatedProjectSlugs?: string[];
  /** Proof section label — careful factual language */
  proofTitle?: string;
  relatedSeoSlugs?: string[];
  ctaTitle?: string;
  ctaDescription?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  faqs?: FaqItem[];
  relatedServiceSlugs?: string[];
  metaTitle: string;
  metaDescription: string;
};

export type ProjectCategory =
  | "Website Design"
  | "Website Development"
  | "SEO"
  | "E-commerce"
  | "Branding"
  | "Product Design"
  | "Web Application Development"
  | "Platform Architecture"
  | "Automation"
  | "SaaS Development"
  | "AI Integration";

export type ProductFeatureSection = {
  title: string;
  heading: string;
  body: string;
  image?: ProjectGalleryItem;
};

export type ProjectEngineeringStack = {
  category: string;
  items: string[];
};

export type ProjectServiceLink = {
  label: string;
  href?: string;
  description: string;
};

export type ProjectCaseStudyHeadings = {
  intro?: string;
  challenge?: string;
  approach?: string;
  solution?: string;
  outcome?: string;
  engineering?: string;
  platform?: string;
  principles?: string;
  saasInfrastructure?: string;
};

export type ProjectCaseStudyCta = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
};

export type ProjectGalleryItem = {
  src: string;
  alt: string;
  caption?: string;
  layout?: "full" | "half" | "mobile";
};

export type ProjectCaseStudyPoint = {
  title: string;
  description: string;
};

export type Project = {
  slug: string;
  /** Display title */
  name: string;
  title?: string;
  industry: string;
  services: ProjectCategory[];
  challenge: string;
  solution: string;
  /** Only published projects appear on the live site / sitemap */
  published: boolean;
  client?: string;
  projectType?: string;
  shortDescription?: string;
  objective?: string;
  overview?: string;
  approach?: string;
  goals?: string[];
  strategy?: string;
  designNotes?: string;
  developmentNotes?: string;
  seoNotes?: string;
  /** Factual outcomes — never invent percentages */
  results?: string[];
  resultSummary?: string;
  measurableResults?: string[];
  technologies?: string[];
  platform?: string;
  platforms?: string[];
  websiteUrl?: string;
  /** Legacy WordPress case-study URL */
  oldUrl?: string;
  year?: number;
  testimonialId?: string;
  clientFeedback?: {
    quote: string;
    name: string;
    role?: string;
    isPlaceholder?: boolean;
  };
  /** Cover image for cards */
  image?: string;
  imageAlt?: string;
  heroImage?: string;
  heroImageAlt?: string;
  gallery?: ProjectGalleryItem[];
  screenshotPlaceholder?: string;
  featured?: boolean;
  /** Lower numbers appear first on /work */
  displayOrder?: number;
  /** product = richer platform case study layout */
  caseStudyKind?: "website" | "product";
  relatedSlugs?: string[];
  relatedServiceHrefs?: string[];
  /** Overrides default service link cards on product case studies */
  serviceLinks?: ProjectServiceLink[];
  engineeringIntro?: string;
  engineeringStacks?: ProjectEngineeringStack[];
  sectionHeadings?: ProjectCaseStudyHeadings;
  caseStudyCta?: ProjectCaseStudyCta;
  externalLinkLabel?: string;
  heroEyebrow?: string;
  heroSupportingCopy?: string;
  productPrinciples?: ProjectCaseStudyPoint[];
  productFeatures?: ProductFeatureSection[];
  saasInfrastructure?: ProjectEngineeringStack[];
  showArchitectureDiagram?: boolean;
  solutionIntro?: string;
  /** True when structured case study content is stored in the database. */
  usesDbCaseStudyContent?: boolean;
  metaTitle: string;
  metaDescription: string;
  noIndex?: boolean;
  canonicalOverride?: string | null;
  ogImagePath?: string | null;
  /** Optional case-study presentation fields */
  heroStatement?: string;
  challenges?: ProjectCaseStudyPoint[];
  approachSteps?: ProjectCaseStudyPoint[];
  solutionPoints?: ProjectCaseStudyPoint[];
  highlights?: string[];
  platformContext?: string;
  outcomeHeading?: string;
};

export type Testimonial = {
  id: string;
  name: string;
  company: string;
  role?: string;
  service: string;
  quote: string;
  avatar?: string;
  source?: string;
  sourceUrl?: string;
  projectSlug?: string;
  /** Only published testimonials render */
  published: boolean;
  /** @deprecated use published:false instead */
  isPlaceholder?: boolean;
};

export type IndustryGroup = "proven" | "supported";

export type IndustryServiceLink = {
  label: string;
  href: string;
};

export type Industry = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  /** proven = portfolio-backed; supported = can help without claiming case-study depth */
  group: IndustryGroup;
  featured?: boolean;
  projectSlugs?: string[];
  relatedServices?: IndustryServiceLink[];
};

export type IndustryPublicDetail = Industry & {
  seoTitle?: string | null;
  seoDescription?: string | null;
  noIndex?: boolean;
  canonicalOverride?: string | null;
  ogImagePath?: string | null;
  hasVerifiedProjectExperience: boolean;
  relatedSolutionSlugs: string[];
};

export type PlatformGroupId = "websites" | "ecommerce" | "connected";

export type PlatformProminence = "high" | "medium" | "low";

export type PlatformSeoSection = {
  title: string;
  intro: string;
  points: string[];
};

export type Platform = {
  slug: string;
  name: string;
  /** Page H1 */
  title: string;
  href: string;
  summary: string;
  description: string;
  tagline?: string;
  icon: string;
  featured?: boolean;
  /** Hub / nav grouping */
  group: PlatformGroupId;
  /** Visual weight on Platforms hub */
  prominence?: PlatformProminence;
  /** Show in curated Platforms dropdown */
  navigationFeatured?: boolean;
  /**
   * True only when published portfolio projects match platformMatch.
   * Used internally — do not surface as “unverified” in UI.
   */
  verifiedExperience?: boolean;
  /** Match against project.platform when verified */
  platformMatch: string;
  audiences: string[];
  /** Decision section — when this platform may fit */
  whenItFits?: string[];
  capabilities: string[];
  challenges?: string[];
  seoSection?: PlatformSeoSection;
  conversionNote?: string;
  migrationNote?: string;
  relatedServiceHrefs: string[];
  relatedSeoHrefs?: string[];
  faqs?: FaqItem[];
  ctaTitle?: string;
  ctaDescription?: string;
  metaTitle: string;
  metaDescription: string;
  noIndex?: boolean;
  canonicalOverride?: string | null;
  ogImagePath?: string | null;
  legacyUrl?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

/** Problem-first Solutions hub taxonomy */
export type SolutionCategoryId =
  | "growth-conversion"
  | "visibility"
  | "website-quality"
  | "change-new";

export type Solution = {
  /** Short taxonomy label */
  name: string;
  /** Natural problem language shown on the hub */
  title: string;
  slug: string;
  shortDescription: string;
  category: SolutionCategoryId;
  featured?: boolean;
  /** When true, hub links to /solutions/[slug]. Unpublished solutions stay catalogue-only. */
  published: boolean;
  icon: string;
  relatedServiceHrefs: string[];
  relatedPlatformSlugs?: string[];
  relatedIndustrySlugs?: string[];
  /** Detail-page fields (populated when a solution page ships) */
  eyebrow?: string;
  heroStatement?: string;
  heroSupporting?: string;
  problemSymptoms?: string[];
  possibleCauses?: { title: string; description: string }[];
  whatWeReview?: string[];
  process?: { title: string; description?: string }[];
  measurementPoints?: string[];
  relatedProjectSlugs?: string[];
  relatedArticleSlugs?: string[];
  relatedServiceReasons?: { href: string; title: string; reason: string }[];
  /** Subtle cross-links to other published solutions */
  relatedSolutions?: { slug: string; prompt: string }[];
  faqs?: FaqItem[];
  ctaTitle?: string;
  ctaDescription?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
  canonicalOverride?: string | null;
  ogImagePath?: string | null;
};

export type BlogCategory =
  | "Website Design"
  | "Website Development"
  | "Development"
  | "SEO"
  | "Local SEO"
  | "E-commerce"
  | "Conversion"
  | "Performance"
  | "Digital Marketing"
  | "Hospitality"
  | "Vacation Rentals"
  | "Business Growth";

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  /** Omit or empty when author cannot be verified */
  author?: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  heroImage?: string;
  heroImageAlt?: string;
  relatedServiceHrefs?: string[];
  featured?: boolean;
  published?: boolean;
  legacyUrl?: string;
  canonicalUrl?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
};

export type TrustStat = {
  id: string;
  value: string;
  label: string;
  /** Hidden until verified — set isPlaceholder false with a real value */
  isPlaceholder: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  published: boolean;
};

export type ProcessStep = {
  step: number;
  title: string;
  description: string;
};

export type ValueProp = {
  title: string;
  description: string;
  icon: string;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: "linkedin" | "instagram" | "x" | "facebook" | "youtube" | "behance" | "dribbble";
  isPlaceholder?: boolean;
};

export type CompanyDetails = {
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  socialLinks: SocialLink[];
};
