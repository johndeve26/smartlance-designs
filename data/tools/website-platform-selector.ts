/**
 * Website Platform Selector — tool metadata and question definitions.
 */

import type { ToolContent } from "@/data/resource-content-types";
import type { PlatformSelectorSlug } from "@/data/tools/platform-selector-candidates";

export type PlatformSelectorSignal = {
  platform: PlatformSelectorSlug;
  weight: -2 | -1 | 0 | 1 | 2 | 3;
  reason?: string;
};

export type PlatformSelectorOption = {
  id: string;
  label: string;
  description?: string;
  signals: PlatformSelectorSignal[];
};

export type PlatformSelectorQuestion = {
  id: string;
  title: string;
  description?: string;
  type: "single";
  options: PlatformSelectorOption[];
  /** If set, only show when answers[field] is in values */
  showWhen?: { questionId: string; values: string[] };
};

export const platformSelectorQuestions: PlatformSelectorQuestion[] = [
  {
    id: "website-type",
    title: "What are you primarily building?",
    description:
      "Choose the closest fit. This sets broad intent — it does not pick a winner on its own.",
    type: "single",
    options: [
      {
        id: "service-business",
        label: "Service business website",
        description: "Services, enquiries, credibility and clear next steps.",
        signals: [
          { platform: "wordpress", weight: 2, reason: "service-content-fit" },
          { platform: "webflow", weight: 2, reason: "service-marketing-fit" },
          { platform: "wix-studio", weight: 1, reason: "managed-service-site" },
          { platform: "squarespace", weight: 1, reason: "straightforward-service-site" },
          { platform: "shopify", weight: -1, reason: "not-store-led" },
          { platform: "bigcommerce", weight: -1, reason: "not-store-led" },
        ],
      },
      {
        id: "marketing-company",
        label: "Marketing / company website",
        description: "Brand, messaging, landing pages and marketing content.",
        signals: [
          { platform: "webflow", weight: 3, reason: "marketing-site-strength" },
          { platform: "framer", weight: 2, reason: "marketing-visual-strength" },
          { platform: "wix-studio", weight: 2, reason: "marketing-managed-fit" },
          { platform: "wordpress", weight: 1, reason: "flexible-marketing-cms" },
          { platform: "hubspot-cms", weight: 1, reason: "marketing-crm-alignment" },
          { platform: "squarespace", weight: 1, reason: "clean-company-site" },
        ],
      },
      {
        id: "content-heavy",
        label: "Content-heavy website",
        description: "Resources, articles, structured pages and ongoing publishing.",
        signals: [
          { platform: "wordpress", weight: 3, reason: "content-library-strength" },
          { platform: "webflow", weight: 2, reason: "structured-cms-collections" },
          { platform: "hubspot-cms", weight: 1, reason: "content-marketing-cms" },
          { platform: "framer", weight: -1, reason: "large-content-caution" },
        ],
      },
      {
        id: "online-store",
        label: "Online store",
        description: "Products, catalogue and checkout are central.",
        signals: [
          { platform: "shopify", weight: 3, reason: "commerce-first-fit" },
          { platform: "woocommerce", weight: 2, reason: "wordpress-commerce-fit" },
          { platform: "bigcommerce", weight: 2, reason: "dedicated-commerce-fit" },
          { platform: "wordpress", weight: 1, reason: "content-plus-commerce-path" },
          { platform: "framer", weight: -1, reason: "not-commerce-primary" },
          { platform: "squarespace", weight: -1, reason: "limited-commerce-depth" },
        ],
      },
      {
        id: "portfolio-creative",
        label: "Portfolio / creative website",
        description: "Visual presentation, work samples and brand expression.",
        signals: [
          { platform: "framer", weight: 3, reason: "visual-portfolio-strength" },
          { platform: "webflow", weight: 2, reason: "design-led-portfolio" },
          { platform: "squarespace", weight: 2, reason: "creative-portfolio-fit" },
          { platform: "wix-studio", weight: 1, reason: "visual-creative-site" },
          { platform: "wordpress", weight: 1, reason: "custom-portfolio-flexibility" },
        ],
      },
      {
        id: "local-business",
        label: "Local business website",
        description: "Local presence, services, contact and trust signals.",
        signals: [
          { platform: "squarespace", weight: 2, reason: "local-managed-fit" },
          { platform: "wix-studio", weight: 2, reason: "local-business-editing" },
          { platform: "wordpress", weight: 2, reason: "local-flexible-cms" },
          { platform: "webflow", weight: 1, reason: "local-marketing-site" },
          { platform: "shopify", weight: -1, reason: "not-store-led" },
        ],
      },
      {
        id: "landing-page-led",
        label: "Landing-page-led marketing site",
        description: "Campaign pages, conversion paths and focused offers.",
        signals: [
          { platform: "webflow", weight: 3, reason: "landing-page-strength" },
          { platform: "framer", weight: 2, reason: "campaign-page-visuals" },
          { platform: "hubspot-cms", weight: 2, reason: "campaign-crm-alignment" },
          { platform: "wix-studio", weight: 1, reason: "managed-landing-pages" },
          { platform: "wordpress", weight: 1, reason: "flexible-landing-pages" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure yet",
        signals: [],
      },
    ],
  },
  {
    id: "project-context",
    title: "Are you replacing or migrating an existing website?",
    description:
      "This mainly helps surface related planning resources. It does not heavily change platform scores.",
    type: "single",
    options: [
      {
        id: "no",
        label: "No — this is a new website",
        signals: [],
      },
      {
        id: "redesigning-existing",
        label: "Redesigning an existing site",
        signals: [],
      },
      {
        id: "changing-platform",
        label: "Changing platform",
        signals: [],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "commerce",
    title: "How important is e-commerce?",
    type: "single",
    options: [
      {
        id: "none",
        label: "No e-commerce",
        signals: [
          { platform: "shopify", weight: -2, reason: "no-commerce-needed" },
          { platform: "woocommerce", weight: -2, reason: "no-commerce-needed" },
          { platform: "bigcommerce", weight: -2, reason: "no-commerce-needed" },
        ],
      },
      {
        id: "simple-store",
        label: "Simple / small store",
        signals: [
          { platform: "shopify", weight: 2, reason: "simple-store-fit" },
          { platform: "woocommerce", weight: 1, reason: "small-store-wordpress" },
          { platform: "squarespace", weight: 1, reason: "light-commerce-option" },
          { platform: "wix-studio", weight: 1, reason: "light-commerce-option" },
        ],
      },
      {
        id: "major-commerce",
        label: "Commerce is a major part of the business",
        signals: [
          { platform: "shopify", weight: 3, reason: "major-commerce-strength" },
          { platform: "woocommerce", weight: 2, reason: "major-commerce-wordpress" },
          { platform: "bigcommerce", weight: 2, reason: "major-commerce-dedicated" },
          { platform: "framer", weight: -1, reason: "commerce-not-primary-strength" },
        ],
      },
      {
        id: "complex-catalogue",
        label: "Large or complex catalogue",
        signals: [
          { platform: "bigcommerce", weight: 3, reason: "complex-catalogue-fit" },
          { platform: "shopify", weight: 2, reason: "catalogue-commerce-strength" },
          { platform: "woocommerce", weight: 2, reason: "flexible-catalogue-commerce" },
          { platform: "wordpress", weight: 1, reason: "content-plus-catalogue" },
          { platform: "framer", weight: -2, reason: "not-catalogue-platform" },
          { platform: "squarespace", weight: -1, reason: "catalogue-depth-caution" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "content",
    title: "How complex will the website's content be?",
    type: "single",
    options: [
      {
        id: "few-static",
        label: "A few mostly static pages",
        signals: [
          { platform: "squarespace", weight: 2, reason: "simple-content-fit" },
          { platform: "framer", weight: 2, reason: "simple-marketing-content" },
          { platform: "wix-studio", weight: 1, reason: "simple-managed-content" },
          { platform: "webflow", weight: 1, reason: "focused-page-set" },
        ],
      },
      {
        id: "pages-blog",
        label: "Regular pages + blog/resources",
        signals: [
          { platform: "wordpress", weight: 2, reason: "pages-and-publishing" },
          { platform: "webflow", weight: 2, reason: "cms-publishing" },
          { platform: "hubspot-cms", weight: 1, reason: "marketing-content-publishing" },
          { platform: "squarespace", weight: 1, reason: "pages-and-blog" },
        ],
      },
      {
        id: "structured-types",
        label: "Several structured content types",
        signals: [
          { platform: "wordpress", weight: 3, reason: "structured-content-strength" },
          { platform: "webflow", weight: 2, reason: "cms-collections-strength" },
          { platform: "hubspot-cms", weight: 2, reason: "structured-marketing-content" },
          { platform: "framer", weight: -1, reason: "structured-content-caution" },
        ],
      },
      {
        id: "large-complex",
        label: "Large or complex content library",
        signals: [
          { platform: "wordpress", weight: 3, reason: "large-content-library" },
          { platform: "webflow", weight: 1, reason: "growing-cms-needs" },
          { platform: "hubspot-cms", weight: 2, reason: "content-scale-marketing" },
          { platform: "framer", weight: -2, reason: "large-content-caution" },
          { platform: "squarespace", weight: -1, reason: "content-scale-caution" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "design-workflow",
    title: "How important is direct visual design control?",
    type: "single",
    options: [
      {
        id: "basic-ok",
        label: "Basic flexibility is enough",
        signals: [
          { platform: "squarespace", weight: 2, reason: "basic-design-enough" },
          { platform: "wix-studio", weight: 1, reason: "practical-visual-editing" },
          { platform: "wordpress", weight: 1, reason: "template-plus-custom" },
          { platform: "shopify", weight: 1, reason: "theme-based-storefront" },
        ],
      },
      {
        id: "custom-design-matters",
        label: "Strong custom design matters",
        signals: [
          { platform: "webflow", weight: 3, reason: "custom-visual-control" },
          { platform: "framer", weight: 2, reason: "design-led-build" },
          { platform: "wix-studio", weight: 2, reason: "visual-studio-control" },
          { platform: "wordpress", weight: 2, reason: "custom-design-supported" },
        ],
      },
      {
        id: "marketing-frequent-layouts",
        label: "Marketing/design team will frequently create or adjust layouts",
        signals: [
          { platform: "webflow", weight: 3, reason: "frequent-layout-changes" },
          { platform: "framer", weight: 2, reason: "designer-led-updates" },
          { platform: "wix-studio", weight: 2, reason: "team-visual-editing" },
          { platform: "hubspot-cms", weight: 1, reason: "marketing-layout-workflow" },
          { platform: "wordpress", weight: 1, reason: "editor-flexibility" },
        ],
      },
      {
        id: "developer-handles",
        label: "Most layout changes will be handled by a developer",
        signals: [
          { platform: "wordpress", weight: 2, reason: "developer-led-builds" },
          { platform: "webflow", weight: 1, reason: "dev-capable-visual-platform" },
          { platform: "shopify", weight: 1, reason: "theme-dev-workflow" },
          { platform: "woocommerce", weight: 1, reason: "developer-storefront" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "custom-functionality",
    title: "How much custom functionality do you expect?",
    type: "single",
    options: [
      {
        id: "standard",
        label: "Mostly standard website features",
        signals: [
          { platform: "squarespace", weight: 2, reason: "standard-features-fit" },
          { platform: "wix-studio", weight: 2, reason: "standard-business-features" },
          { platform: "framer", weight: 1, reason: "standard-marketing-features" },
          { platform: "webflow", weight: 1, reason: "standard-marketing-build" },
          { platform: "shopify", weight: 1, reason: "standard-store-features" },
        ],
      },
      {
        id: "few-integrations",
        label: "A few integrations / special features",
        signals: [
          { platform: "wordpress", weight: 2, reason: "integration-friendly" },
          { platform: "webflow", weight: 1, reason: "common-integrations" },
          { platform: "shopify", weight: 1, reason: "app-ecosystem" },
          { platform: "hubspot-cms", weight: 1, reason: "marketing-integrations" },
          { platform: "wix-studio", weight: 1, reason: "business-integrations" },
        ],
      },
      {
        id: "significant-custom",
        label: "Significant custom functionality",
        signals: [
          { platform: "wordpress", weight: 3, reason: "custom-functionality-strength" },
          { platform: "woocommerce", weight: 2, reason: "custom-commerce-extensibility" },
          { platform: "webflow", weight: 1, reason: "custom-with-external-systems" },
          { platform: "framer", weight: -1, reason: "custom-depth-caution" },
          { platform: "squarespace", weight: -1, reason: "custom-depth-caution" },
        ],
      },
      {
        id: "complex-backend",
        label: "Complex backend or custom workflows",
        signals: [
          { platform: "wordpress", weight: 2, reason: "extensible-but-evaluate-scope" },
          { platform: "woocommerce", weight: 1, reason: "commerce-plus-custom-workflows" },
          { platform: "framer", weight: -2, reason: "not-for-complex-backends" },
          { platform: "squarespace", weight: -2, reason: "not-for-complex-backends" },
          { platform: "wix-studio", weight: -2, reason: "not-for-complex-backends" },
          { platform: "webflow", weight: -1, reason: "complex-backend-caution" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "integrations",
    title: "How dependent is the website on other business systems?",
    description:
      "Examples: CRM, booking, email marketing, payments, inventory, automation, membership.",
    type: "single",
    options: [
      {
        id: "very-little",
        label: "Very little",
        signals: [
          { platform: "squarespace", weight: 2, reason: "low-integration-fit" },
          { platform: "framer", weight: 1, reason: "low-integration-marketing" },
          { platform: "wix-studio", weight: 1, reason: "self-contained-site" },
          { platform: "webflow", weight: 1, reason: "focused-site-integrations" },
        ],
      },
      {
        id: "standard",
        label: "Standard integrations",
        signals: [
          { platform: "wordpress", weight: 1, reason: "standard-integration-ecosystem" },
          { platform: "webflow", weight: 1, reason: "standard-marketing-integrations" },
          { platform: "shopify", weight: 1, reason: "standard-commerce-apps" },
          { platform: "wix-studio", weight: 1, reason: "standard-business-integrations" },
          { platform: "hubspot-cms", weight: 1, reason: "marketing-stack-integrations" },
        ],
      },
      {
        id: "several-important",
        label: "Several important systems",
        signals: [
          { platform: "wordpress", weight: 2, reason: "multi-system-integrations" },
          { platform: "hubspot-cms", weight: 1, reason: "crm-marketing-stack" },
          { platform: "shopify", weight: 1, reason: "commerce-system-connections" },
          { platform: "woocommerce", weight: 1, reason: "flexible-system-connections" },
          { platform: "bigcommerce", weight: 1, reason: "commerce-integration-depth" },
          { platform: "framer", weight: -1, reason: "integration-depth-caution" },
        ],
      },
      {
        id: "deep-specialized",
        label: "Deep / specialized integrations",
        signals: [
          { platform: "wordpress", weight: 3, reason: "deep-integration-flexibility" },
          { platform: "woocommerce", weight: 2, reason: "specialized-commerce-integrations" },
          { platform: "bigcommerce", weight: 2, reason: "specialized-commerce-integrations" },
          { platform: "hubspot-cms", weight: 1, reason: "hub-centered-integrations" },
          { platform: "framer", weight: -2, reason: "not-for-deep-integrations" },
          { platform: "squarespace", weight: -1, reason: "integration-depth-caution" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "hubspot-usage",
    title: "Is your business already heavily using HubSpot?",
    description:
      "Only asked when integrations are a major factor. HubSpot CMS is strongest when HubSpot is already central.",
    type: "single",
    showWhen: {
      questionId: "integrations",
      values: ["several-important", "deep-specialized"],
    },
    options: [
      {
        id: "yes",
        label: "Yes",
        signals: [
          { platform: "hubspot-cms", weight: 3, reason: "existing-hubspot-stack" },
          { platform: "webflow", weight: -1, reason: "hubspot-native-preference" },
          { platform: "wordpress", weight: -1, reason: "hubspot-native-preference" },
        ],
      },
      {
        id: "no",
        label: "No",
        signals: [
          { platform: "hubspot-cms", weight: -2, reason: "hubspot-not-central" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "team-workflow",
    title: "Who will update the website after launch?",
    type: "single",
    options: [
      {
        id: "owner",
        label: "Business owner",
        signals: [
          { platform: "squarespace", weight: 2, reason: "owner-friendly-editing" },
          { platform: "wix-studio", weight: 2, reason: "owner-friendly-editing" },
          { platform: "shopify", weight: 1, reason: "owner-store-management" },
          { platform: "wordpress", weight: 1, reason: "owner-content-updates" },
        ],
      },
      {
        id: "marketing-content",
        label: "Marketing/content team",
        signals: [
          { platform: "webflow", weight: 2, reason: "marketing-team-editing" },
          { platform: "wordpress", weight: 2, reason: "content-team-publishing" },
          { platform: "hubspot-cms", weight: 2, reason: "marketing-team-hub" },
          { platform: "wix-studio", weight: 1, reason: "marketing-team-editing" },
        ],
      },
      {
        id: "designer",
        label: "Designer",
        signals: [
          { platform: "webflow", weight: 3, reason: "designer-led-workflow" },
          { platform: "framer", weight: 3, reason: "designer-led-workflow" },
          { platform: "wix-studio", weight: 2, reason: "designer-visual-editing" },
        ],
      },
      {
        id: "developer",
        label: "Developer/technical team",
        signals: [
          { platform: "wordpress", weight: 3, reason: "developer-owned-stack" },
          { platform: "woocommerce", weight: 2, reason: "developer-owned-commerce" },
          { platform: "webflow", weight: 1, reason: "technical-webflow-builds" },
          { platform: "shopify", weight: 1, reason: "theme-and-app-development" },
        ],
      },
      {
        id: "multiple-teams",
        label: "Multiple teams",
        signals: [
          { platform: "wordpress", weight: 2, reason: "multi-role-publishing" },
          { platform: "webflow", weight: 1, reason: "shared-marketing-cms" },
          { platform: "hubspot-cms", weight: 2, reason: "multi-team-marketing-ops" },
          { platform: "wix-studio", weight: 1, reason: "shared-editing-roles" },
        ],
      },
      {
        id: "agency",
        label: "Agency/freelancer",
        signals: [
          { platform: "webflow", weight: 2, reason: "agency-visual-delivery" },
          { platform: "wordpress", weight: 2, reason: "agency-custom-delivery" },
          { platform: "framer", weight: 1, reason: "agency-design-delivery" },
          { platform: "shopify", weight: 1, reason: "agency-store-builds" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "maintenance",
    title: "How much platform maintenance do you want your team to manage?",
    type: "single",
    options: [
      {
        id: "platform-handles",
        label: "Prefer the platform to handle most infrastructure",
        signals: [
          { platform: "webflow", weight: 2, reason: "hosted-low-maintenance" },
          { platform: "shopify", weight: 2, reason: "hosted-commerce-maintenance" },
          { platform: "wix-studio", weight: 2, reason: "hosted-low-maintenance" },
          { platform: "squarespace", weight: 2, reason: "hosted-low-maintenance" },
          { platform: "framer", weight: 2, reason: "hosted-low-maintenance" },
          { platform: "hubspot-cms", weight: 2, reason: "hosted-marketing-cms" },
          { platform: "bigcommerce", weight: 1, reason: "hosted-commerce-maintenance" },
          { platform: "wordpress", weight: -1, reason: "maintenance-tradeoff" },
          { platform: "woocommerce", weight: -1, reason: "maintenance-tradeoff" },
        ],
      },
      {
        id: "managed-flexible",
        label: "Comfortable with a managed setup but some flexibility",
        signals: [
          { platform: "wordpress", weight: 1, reason: "managed-wordpress-path" },
          { platform: "webflow", weight: 1, reason: "managed-with-flexibility" },
          { platform: "shopify", weight: 1, reason: "managed-commerce-flexibility" },
          { platform: "wix-studio", weight: 1, reason: "managed-with-flexibility" },
          { platform: "hubspot-cms", weight: 1, reason: "managed-marketing-cms" },
        ],
      },
      {
        id: "manage-with-support",
        label: "Comfortable managing hosting/plugins/dependencies with support",
        signals: [
          { platform: "wordpress", weight: 2, reason: "supported-self-managed" },
          { platform: "woocommerce", weight: 2, reason: "supported-self-managed-commerce" },
        ],
      },
      {
        id: "max-control",
        label: "Maximum technical control matters",
        signals: [
          { platform: "wordpress", weight: 3, reason: "maximum-infrastructure-control" },
          { platform: "woocommerce", weight: 2, reason: "control-plus-commerce" },
          { platform: "webflow", weight: -1, reason: "hosted-platform-limits" },
          { platform: "squarespace", weight: -1, reason: "hosted-platform-limits" },
          { platform: "wix-studio", weight: -1, reason: "hosted-platform-limits" },
          { platform: "framer", weight: -1, reason: "hosted-platform-limits" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
  {
    id: "hosting-control",
    title: "How important is control over hosting and technical infrastructure?",
    type: "single",
    options: [
      {
        id: "not-important",
        label: "Not important",
        signals: [
          { platform: "webflow", weight: 2, reason: "hosted-is-fine" },
          { platform: "shopify", weight: 2, reason: "hosted-is-fine" },
          { platform: "squarespace", weight: 2, reason: "hosted-is-fine" },
          { platform: "wix-studio", weight: 2, reason: "hosted-is-fine" },
          { platform: "framer", weight: 2, reason: "hosted-is-fine" },
          { platform: "hubspot-cms", weight: 2, reason: "hosted-is-fine" },
          { platform: "bigcommerce", weight: 1, reason: "hosted-is-fine" },
        ],
      },
      {
        id: "some-flexibility",
        label: "Some flexibility is useful",
        signals: [
          { platform: "wordpress", weight: 1, reason: "hosting-flexibility" },
          { platform: "webflow", weight: 1, reason: "managed-with-options" },
          { platform: "woocommerce", weight: 1, reason: "hosting-flexibility" },
        ],
      },
      {
        id: "very-important",
        label: "Very important",
        signals: [
          { platform: "wordpress", weight: 3, reason: "hosting-control-matters" },
          { platform: "woocommerce", weight: 2, reason: "hosting-control-commerce" },
          { platform: "webflow", weight: -1, reason: "limited-hosting-control" },
          { platform: "squarespace", weight: -1, reason: "limited-hosting-control" },
          { platform: "wix-studio", weight: -1, reason: "limited-hosting-control" },
          { platform: "framer", weight: -1, reason: "limited-hosting-control" },
          { platform: "shopify", weight: -1, reason: "limited-hosting-control" },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [],
      },
    ],
  },
];

export const PLATFORM_SELECTOR_BASE_QUESTION_COUNT =
  platformSelectorQuestions.filter((question) => !question.showWhen).length;

export const PLATFORM_SELECTOR_CONDITIONAL_QUESTION_COUNT =
  platformSelectorQuestions.filter((question) => question.showWhen).length;

export function isPlatformSelectorQuestionVisible(
  question: PlatformSelectorQuestion,
  answers: Record<string, string>,
): boolean {
  if (!question.showWhen) return true;
  const value = answers[question.showWhen.questionId];
  if (!value) return false;
  return question.showWhen.values.includes(value);
}

export function getVisiblePlatformSelectorQuestions(
  answers: Record<string, string>,
): PlatformSelectorQuestion[] {
  return platformSelectorQuestions.filter((question) =>
    isPlatformSelectorQuestionVisible(question, answers),
  );
}

export const websitePlatformSelectorTool: ToolContent = {
  type: "tool",
  slug: "website-platform-selector",
  title: "Website Platform Selector",
  subtitle:
    "Answer a few questions about the project to see which platforms may deserve a closer look.",
  description:
    "Narrow which website platforms deserve a closer look based on content, design, commerce, integrations, editing and technical requirements.",
  intro:
    "Your answers stay in this browser. Nothing is submitted to Smartlance.",
  featured: true,
  published: true,
  publishedAt: "2026-08-07",
  topicIds: [
    "platforms",
    "website-development",
    "website-design",
    "ecommerce",
  ],
  relatedServiceHrefs: [
    "/services/website-strategy",
    "/services/website-design",
    "/services/website-development",
    "/services/website-migration",
  ],
  relatedSolutionSlugs: [
    "new-business-website",
    "outdated-website",
    "website-migration",
    "ecommerce-growth",
  ],
  relatedGuideSlugs: ["website-redesign-guide"],
  relatedComparisonSlugs: ["wordpress-vs-webflow"],
  relatedTemplateSlugs: ["website-project-brief-template"],
  relatedChecklistSlugs: ["website-redesign-checklist"],
  seoTitle: "Website Platform Selector | Smartlance Designs",
  seoDescription:
    "Use this website platform selector to compare which platforms may fit your project based on content, design, commerce, integrations, editing and technical requirements.",
  questionCount: PLATFORM_SELECTOR_BASE_QUESTION_COUNT,
};
