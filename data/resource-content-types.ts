/**
 * Resource body models for Guides, Comparisons, Checklists,
 * Glossary entries, Templates and Tools.
 */

import type { ResourceTopicId } from "@/data/resources";

export type ResourceCallout = {
  title?: string;
  body: string;
  tone?: "note" | "warning" | "tip";
};

export type ResourceSection = {
  id: string;
  title: string;
  body: string;
  callouts?: ResourceCallout[];
  image?: string;
  imageAlt?: string;
  /** Optional editorial diagram keyed in the Guide renderer */
  visual?:
    | "redesign-lifecycle"
    | "sitemap"
    | "content-decision"
    | "refresh-redesign-rebuild"
    | "seo-risks"
    | "launch-phases";
  wideVisual?: boolean;
};

export type ResourceFaq = {
  question: string;
  answer: string;
};

export type GuideContent = {
  type: "guide";
  slug: string;
  title: string;
  description: string;
  /** Short deck under the H1 — may differ from SEO description */
  deck?: string;
  heroImage?: string;
  heroImageAlt?: string;
  intro: string;
  tableOfContents?: { id: string; title: string }[];
  sections: ResourceSection[];
  callouts?: ResourceCallout[];
  relatedServiceHrefs?: string[];
  relatedSolutionSlugs?: string[];
  relatedInsightSlugs?: string[];
  relatedResourceIds?: string[];
  faqs?: ResourceFaq[];
  published: boolean;
  featured?: boolean;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  readingTime: string;
  topicIds: ResourceTopicId[];
  seoTitle?: string;
  seoDescription?: string;
};

export type ComparisonCriterion = {
  id: string;
  label: string;
  optionA: string;
  optionB: string;
};

export type ComparisonMatrixRow = {
  id: string;
  label: string;
  optionA: string;
  optionB: string;
  note: string;
};

export type ComparisonSection = {
  id: string;
  title: string;
  body: string;
};

export type ComparisonContent = {
  type: "comparison";
  slug: string;
  title: string;
  description: string;
  /** Short deck under the H1 */
  deck?: string;
  optionA: string;
  optionB: string;
  summary: string;
  /** Archive card decision categories */
  keyCategories?: string[];
  quickFitA: string[];
  quickFitB: string[];
  comparisonCriteria: ComparisonCriterion[];
  decisionMatrix: ComparisonMatrixRow[];
  sections: ComparisonSection[];
  bestForA: string[];
  bestForB: string[];
  avoidStartingWith?: string[];
  decisionQuestions: string[];
  tradeoffs: string[];
  decisionGuidance: string;
  relatedPlatformSlugs?: string[];
  relatedServiceHrefs?: string[];
  relatedSolutionSlugs?: string[];
  relatedGuideSlugs?: string[];
  relatedInsightSlugs?: string[];
  faqs?: ResourceFaq[];
  published: boolean;
  featured?: boolean;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  readingTime: string;
  topicIds: ResourceTopicId[];
  seoTitle?: string;
  seoDescription?: string;
};

export type ChecklistItem = {
  id: string;
  /** Visible checklist label */
  text: string;
  description?: string;
  priority?: "critical" | "recommended" | "contextual";
  /** Shown when the item applies only in certain contexts */
  appliesWhen?: string;
  relatedHref?: string;
  relatedLabel?: string;
};

export type ChecklistSubgroup = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

export type ChecklistSection = {
  id: string;
  title: string;
  description?: string;
  callout?: {
    tone: "important" | "tip" | "avoid";
    body: string;
    href?: string;
    linkLabel?: string;
  };
  items: ChecklistItem[];
  subgroups?: ChecklistSubgroup[];
};

export type ChecklistContent = {
  type: "checklist";
  slug: string;
  title: string;
  description: string;
  subtitle?: string;
  intro?: string;
  sections: ChecklistSection[];
  relatedServiceHrefs?: string[];
  relatedSolutionSlugs?: string[];
  relatedGuideSlugs?: string[];
  relatedComparisonSlugs?: string[];
  relatedInsightSlugs?: string[];
  published: boolean;
  featured?: boolean;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  topicIds: ResourceTopicId[];
  seoTitle?: string;
  seoDescription?: string;
};

export type GlossaryTopicGroup =
  | "website-foundations"
  | "search-technical-seo"
  | "performance";

export type GlossarySection = {
  id: string;
  title: string;
  body: string;
};

export type GlossaryContent = {
  type: "glossary";
  slug: string;
  term: string;
  /** Shown when the term is primarily an acronym */
  acronym?: string;
  /** Expansion shown under the term (e.g. Search Engine Optimization) */
  expansion?: string;
  aliases?: string[];
  shortDefinition: string;
  fullExplanation: string;
  whyItMatters?: string;
  example?: string;
  commonMisconceptions?: string[];
  sections?: GlossarySection[];
  relatedTermSlugs?: string[];
  relatedServiceHrefs?: string[];
  relatedSolutionSlugs?: string[];
  relatedGuideSlugs?: string[];
  relatedSeoHrefs?: string[];
  glossaryTopicGroup: GlossaryTopicGroup;
  topicIds: ResourceTopicId[];
  featured?: boolean;
  published: boolean;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  seoTitle?: string;
  seoDescription?: string;
  visual?:
    | "cls-shift"
    | "canonical-vs-redirect"
    | "cwv-relationship"
    | "cta-hierarchy"
    | "sitemap-relationship";
};

export type TemplateFieldOption = {
  value: string;
  label: string;
};

export type TemplateFieldCondition = {
  fieldId: string;
  /** Match when the field value (string) or any selected checkbox value is in this list */
  values: string[];
};

export type TemplateFieldBase = {
  id: string;
  label: string;
  help?: string;
  helpLinks?: { label: string; href: string }[];
  placeholder?: string;
  maxLength?: number;
  /** Counts toward “section started” when filled */
  core?: boolean;
  /** Show when ANY listed condition matches */
  showWhenAny?: TemplateFieldCondition[];
};

export type TemplateField =
  | (TemplateFieldBase & {
      kind: "text" | "url" | "date";
    })
  | (TemplateFieldBase & {
      kind: "textarea";
      rows?: number;
    })
  | (TemplateFieldBase & {
      kind: "select";
      options: TemplateFieldOption[];
    })
  | (TemplateFieldBase & {
      kind: "radio";
      options: TemplateFieldOption[];
    })
  | (TemplateFieldBase & {
      kind: "checkboxGroup";
      options: TemplateFieldOption[];
    });

export type TemplateSection = {
  id: string;
  title: string;
  description?: string;
  fields: TemplateField[];
};

export type TemplateContent = {
  type: "template";
  slug: string;
  title: string;
  description: string;
  /** Hero subtitle under the H1 */
  subtitle?: string;
  intro?: string;
  sections: TemplateSection[];
  featured?: boolean;
  published: boolean;
  publishedAt: string;
  updatedAt?: string;
  topicIds: ResourceTopicId[];
  relatedServiceHrefs?: string[];
  relatedSolutionSlugs?: string[];
  relatedGuideSlugs?: string[];
  relatedComparisonSlugs?: string[];
  relatedChecklistSlugs?: string[];
  relatedInsightSlugs?: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export type ToolContent = {
  type: "tool";
  slug: string;
  title: string;
  description: string;
  subtitle?: string;
  intro?: string;
  featured?: boolean;
  published: boolean;
  publishedAt: string;
  updatedAt?: string;
  topicIds: ResourceTopicId[];
  relatedServiceHrefs?: string[];
  relatedSolutionSlugs?: string[];
  relatedGuideSlugs?: string[];
  relatedComparisonSlugs?: string[];
  relatedTemplateSlugs?: string[];
  relatedChecklistSlugs?: string[];
  relatedInsightSlugs?: string[];
  seoTitle?: string;
  seoDescription?: string;
  /** Approximate interactive steps for archive display; optional */
  questionCount?: number;
};

export type FutureResourceContent =
  | GuideContent
  | ComparisonContent
  | ChecklistContent
  | GlossaryContent
  | TemplateContent
  | ToolContent;

/** Published Tools live in `data/tools.ts`. */
