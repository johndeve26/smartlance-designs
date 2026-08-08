/**
 * Website Project Planner — question definitions, signals and metadata.
 */

export type PlannerPath =
  | "improve"
  | "redesign"
  | "build"
  | "migrate"
  | "grow"
  | "diagnose";

export type PlannerPriorityId =
  | "lead-generation"
  | "conversion"
  | "seo"
  | "local-visibility"
  | "performance"
  | "content"
  | "design"
  | "platform"
  | "commerce"
  | "analytics"
  | "maintenance"
  | "functionality"
  | "strategy"
  | "seo-protection";

export type PlannerSignal = {
  path?: PlannerPath;
  weight?: number;
  priority?: PlannerPriorityId;
  priorityWeight?: number;
};

export type ProjectPlannerOption = {
  id: string;
  label: string;
  description?: string;
  signals: PlannerSignal[];
};

export type ProjectPlannerQuestion = {
  id: string;
  title: string;
  description?: string;
  type: "single" | "multiple";
  options: ProjectPlannerOption[];
  /** Show when condition matches */
  showWhen?: { questionId: string; values: string[] };
};

export type PlannerSolutionSlug =
  | "website-not-generating-leads"
  | "website-not-ranking"
  | "slow-website"
  | "outdated-website"
  | "low-website-conversions"
  | "website-migration"
  | "new-business-website"
  | "ecommerce-growth"
  | "local-business-visibility";

export const PLANNER_PATHS: PlannerPath[] = [
  "improve",
  "redesign",
  "build",
  "migrate",
  "grow",
  "diagnose",
];

export const PLANNER_PATH_META: Record<
  PlannerPath,
  { title: string; explanation: string }
> = {
  improve: {
    title: "IMPROVE",
    explanation:
      "Your answers suggest the current website is fundamentally usable, and targeted improvements may be enough without a full redesign.",
  },
  redesign: {
    title: "REDESIGN",
    explanation:
      "Your answers suggest the website's existing foundation still has value, but the structure, content and experience need broader change than a few isolated fixes.",
  },
  build: {
    title: "BUILD",
    explanation:
      "Your answers suggest planning should start more like a new website build — either because there is no site yet, or the current foundation is not a useful starting point.",
  },
  migrate: {
    title: "MIGRATE",
    explanation:
      "Changing platform, CMS or technical foundation is a central part of this project and needs deliberate migration planning.",
  },
  grow: {
    title: "GROW",
    explanation:
      "Your answers suggest the website is already functioning, and the main need is growth through SEO, conversion, commerce, local visibility or ongoing improvement.",
  },
  diagnose: {
    title: "DIAGNOSE FIRST",
    explanation:
      "The answers do not point clearly to a redesign, rebuild or targeted improvement yet. The useful next step is understanding what is actually limiting the site.",
  },
};

export const PLANNER_PRIORITY_LABELS: Record<PlannerPriorityId, string> = {
  "lead-generation": "Lead generation",
  conversion: "Conversion",
  seo: "Search visibility",
  "local-visibility": "Local visibility",
  performance: "Performance",
  content: "Content structure",
  design: "Design and brand experience",
  platform: "Platform evaluation",
  commerce: "E-commerce growth",
  analytics: "Analytics and measurement",
  maintenance: "Easier ongoing updates",
  functionality: "Functionality and integrations",
  strategy: "Website strategy",
  "seo-protection": "SEO protection",
};

export const PLANNER_PRIORITY_REASONS: Record<PlannerPriorityId, string> = {
  "lead-generation": "You want the site to produce more enquiries and meaningful next steps.",
  conversion: "Visitors need a clearer path to complete important actions.",
  seo: "Search visibility is a stated priority for the project.",
  "local-visibility": "Nearby customers need to find and contact the business more easily.",
  performance: "Speed and technical responsiveness are limiting the experience.",
  content: "Content and structure need to match how the business works today.",
  design: "Presentation and credibility need to catch up with the business.",
  platform: "Platform capability or change is part of the decision.",
  commerce: "Selling online and store performance need focused attention.",
  analytics: "Measurement should clarify what is and is not working.",
  maintenance: "The team needs a site that is practical to update.",
  functionality: "New features or workflows may expand the technical scope.",
  strategy: "Scope and direction should be clarified before major build decisions.",
  "seo-protection": "Useful URLs, content and rankings should be protected during change.",
};

export const PLANNER_SOLUTION_META: Record<
  PlannerSolutionSlug,
  { title: string; href: string }
> = {
  "website-not-generating-leads": {
    title: "Website Not Generating Leads",
    href: "/solutions/website-not-generating-leads",
  },
  "website-not-ranking": {
    title: "Website Not Ranking",
    href: "/solutions/website-not-ranking",
  },
  "slow-website": {
    title: "Slow Website",
    href: "/solutions/slow-website",
  },
  "outdated-website": {
    title: "Outdated Website",
    href: "/solutions/outdated-website",
  },
  "low-website-conversions": {
    title: "Low Website Conversions",
    href: "/solutions/low-website-conversions",
  },
  "website-migration": {
    title: "Website Migration",
    href: "/solutions/website-migration",
  },
  "new-business-website": {
    title: "New Business Website",
    href: "/solutions/new-business-website",
  },
  "ecommerce-growth": {
    title: "E-commerce Growth",
    href: "/solutions/ecommerce-growth",
  },
  "local-business-visibility": {
    title: "Local Business Visibility",
    href: "/solutions/local-business-visibility",
  },
};

const PROBLEM_OPTIONS: ProjectPlannerOption[] = [
  {
    id: "outdated-look",
    label: "The website looks or feels outdated",
    signals: [
      { path: "redesign", weight: 3 },
      { priority: "design", priorityWeight: 3 },
    ],
  },
  {
    id: "no-action",
    label: "Visitors do not take action",
    signals: [
      { path: "improve", weight: 2 },
      { path: "grow", weight: 2 },
      { priority: "conversion", priorityWeight: 3 },
      { priority: "lead-generation", priorityWeight: 2 },
    ],
  },
  {
    id: "poor-visibility",
    label: "We are not getting enough search visibility",
    signals: [
      { path: "improve", weight: 2 },
      { path: "grow", weight: 2 },
      { priority: "seo", priorityWeight: 3 },
    ],
  },
  {
    id: "slow-technical",
    label: "The site is slow or technically poor",
    signals: [
      { path: "improve", weight: 3 },
      { priority: "performance", priorityWeight: 3 },
    ],
  },
  {
    id: "content-mismatch",
    label: "The content/structure no longer matches the business",
    signals: [
      { path: "redesign", weight: 3 },
      { priority: "content", priorityWeight: 3 },
    ],
  },
  {
    id: "hard-to-manage",
    label: "The website is difficult for our team to manage",
    signals: [
      { path: "improve", weight: 1 },
      { path: "redesign", weight: 1 },
      { priority: "maintenance", priorityWeight: 3 },
      { priority: "platform", priorityWeight: 1 },
    ],
  },
  {
    id: "platform-limits",
    label: "The platform limits what we need to do",
    signals: [
      { path: "migrate", weight: 2 },
      { path: "redesign", weight: 1 },
      { priority: "platform", priorityWeight: 3 },
      { priority: "functionality", priorityWeight: 1 },
    ],
  },
  {
    id: "store-not-growing",
    label: "Our store is not growing",
    signals: [
      { path: "grow", weight: 3 },
      { path: "improve", weight: 2 },
      { priority: "commerce", priorityWeight: 3 },
      { priority: "conversion", priorityWeight: 2 },
    ],
  },
  {
    id: "local-discovery",
    label: "Nearby customers struggle to find us",
    signals: [
      { path: "grow", weight: 3 },
      { path: "improve", weight: 2 },
      { priority: "local-visibility", priorityWeight: 3 },
      { priority: "seo", priorityWeight: 1 },
    ],
  },
];

export const projectPlannerQuestions: ProjectPlannerQuestion[] = [
  {
    id: "starting-point",
    title: "Where are you starting from?",
    description:
      "This sets broad context. It does not lock the result on its own.",
    type: "single",
    options: [
      {
        id: "no-website",
        label: "I do not have a website yet",
        signals: [{ path: "build", weight: 4 }],
      },
      {
        id: "works-ok",
        label: "I have a website that basically works",
        signals: [
          { path: "improve", weight: 2 },
          { path: "grow", weight: 1 },
        ],
      },
      {
        id: "feels-outdated",
        label: "I have a website that feels outdated",
        signals: [
          { path: "redesign", weight: 3 },
          { priority: "design", priorityWeight: 2 },
        ],
      },
      {
        id: "serious-problems",
        label: "I have a website with serious problems",
        signals: [
          { path: "redesign", weight: 2 },
          { path: "diagnose", weight: 1 },
          { path: "build", weight: 1 },
        ],
      },
      {
        id: "planning-migration",
        label: "I am already planning a platform/site migration",
        signals: [
          { path: "migrate", weight: 3 },
          { path: "redesign", weight: 1 },
          { priority: "platform", priorityWeight: 2 },
          { priority: "seo-protection", priorityWeight: 1 },
        ],
      },
      {
        id: "not-sure",
        label: "I am not sure",
        signals: [{ path: "diagnose", weight: 1 }],
      },
    ],
  },
  {
    id: "main-goal",
    title: "What do you most want the website to do better?",
    type: "single",
    options: [
      {
        id: "more-enquiries",
        label: "Generate more enquiries",
        signals: [
          { path: "improve", weight: 2 },
          { path: "grow", weight: 2 },
          { priority: "lead-generation", priorityWeight: 3 },
          { priority: "conversion", priorityWeight: 2 },
        ],
      },
      {
        id: "search-visibility",
        label: "Improve search visibility",
        signals: [
          { path: "improve", weight: 2 },
          { path: "grow", weight: 2 },
          { priority: "seo", priorityWeight: 3 },
        ],
      },
      {
        id: "sell-online",
        label: "Sell more online",
        signals: [
          { path: "grow", weight: 3 },
          { path: "improve", weight: 1 },
          { priority: "commerce", priorityWeight: 3 },
          { priority: "conversion", priorityWeight: 1 },
        ],
      },
      {
        id: "local-customers",
        label: "Reach more local customers",
        signals: [
          { path: "grow", weight: 3 },
          { path: "improve", weight: 1 },
          { priority: "local-visibility", priorityWeight: 3 },
        ],
      },
      {
        id: "explain-services",
        label: "Explain the business/services more clearly",
        signals: [
          { path: "redesign", weight: 2 },
          { path: "improve", weight: 1 },
          { priority: "content", priorityWeight: 3 },
        ],
      },
      {
        id: "credibility",
        label: "Improve credibility / presentation",
        signals: [
          { path: "redesign", weight: 2 },
          { path: "improve", weight: 1 },
          { priority: "design", priorityWeight: 3 },
        ],
      },
      {
        id: "load-better",
        label: "Load and work better",
        signals: [
          { path: "improve", weight: 3 },
          { priority: "performance", priorityWeight: 3 },
        ],
      },
      {
        id: "support-growth",
        label: "Support new services or business growth",
        signals: [
          { path: "grow", weight: 2 },
          { path: "redesign", weight: 1 },
          { priority: "strategy", priorityWeight: 2 },
          { priority: "content", priorityWeight: 1 },
        ],
      },
      {
        id: "launch-new",
        label: "Launch a completely new website",
        signals: [{ path: "build", weight: 3 }],
      },
      {
        id: "move-platform",
        label: "Move to a better platform",
        signals: [
          { path: "migrate", weight: 3 },
          { priority: "platform", priorityWeight: 3 },
          { priority: "seo-protection", priorityWeight: 1 },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure yet",
        signals: [{ path: "diagnose", weight: 1 }],
      },
    ],
  },
  {
    id: "main-problem",
    title: "What seems to be the biggest problem today?",
    type: "single",
    options: [
      ...PROBLEM_OPTIONS,
      {
        id: "several",
        label: "Several of these",
        signals: [{ path: "diagnose", weight: 1 }, { path: "redesign", weight: 1 }],
      },
      {
        id: "not-sure",
        label: "I am not sure",
        signals: [{ path: "diagnose", weight: 1 }],
      },
    ],
  },
  {
    id: "problems-multi",
    title: "Which problems apply?",
    description: "Select all that apply.",
    type: "multiple",
    showWhen: { questionId: "main-problem", values: ["several"] },
    options: PROBLEM_OPTIONS,
  },
  {
    id: "change-scope",
    title: "How much do you expect to change?",
    type: "single",
    options: [
      {
        id: "few-improvements",
        label: "A few targeted improvements",
        signals: [{ path: "improve", weight: 3 }, { path: "grow", weight: 1 }],
      },
      {
        id: "several-pages",
        label: "Several important pages/features",
        signals: [
          { path: "improve", weight: 2 },
          { path: "redesign", weight: 1 },
          { path: "grow", weight: 1 },
        ],
      },
      {
        id: "most-website",
        label: "Most of the website",
        signals: [{ path: "redesign", weight: 3 }],
      },
      {
        id: "everything-fresh",
        label: "Everything / starting fresh",
        signals: [{ path: "build", weight: 3 }, { path: "redesign", weight: 1 }],
      },
      {
        id: "not-sure",
        label: "I do not know yet",
        signals: [{ path: "diagnose", weight: 1 }],
      },
    ],
  },
  {
    id: "content-fit",
    title:
      "How well does the current content and site structure still fit the business?",
    type: "single",
    options: [
      {
        id: "mostly-works",
        label: "Mostly works",
        signals: [{ path: "improve", weight: 2 }, { path: "grow", weight: 1 }],
      },
      {
        id: "some-improvement",
        label: "Some parts need improvement",
        signals: [
          { path: "improve", weight: 2 },
          { path: "redesign", weight: 1 },
          { priority: "content", priorityWeight: 1 },
        ],
      },
      {
        id: "major-restructure",
        label: "Major restructuring is needed",
        signals: [
          { path: "redesign", weight: 3 },
          { priority: "content", priorityWeight: 3 },
        ],
      },
      {
        id: "business-changed",
        label: "The business/services have changed significantly",
        signals: [
          { path: "redesign", weight: 3 },
          { priority: "content", priorityWeight: 2 },
          { priority: "strategy", priorityWeight: 1 },
        ],
      },
      {
        id: "no-existing",
        label: "There is no existing content/site",
        signals: [{ path: "build", weight: 4 }],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [{ path: "diagnose", weight: 1 }],
      },
    ],
  },
  {
    id: "functionality",
    title: "Does the project need new functionality?",
    type: "single",
    options: [
      {
        id: "standard-pages",
        label: "Mostly standard pages/forms",
        signals: [],
      },
      {
        id: "few-features",
        label: "A few new features or integrations",
        signals: [
          { path: "improve", weight: 1 },
          { priority: "functionality", priorityWeight: 2 },
        ],
      },
      {
        id: "ecommerce-booking",
        label: "E-commerce / booking / transactional functionality",
        signals: [
          { path: "grow", weight: 1 },
          { priority: "commerce", priorityWeight: 2 },
          { priority: "functionality", priorityWeight: 2 },
        ],
      },
      {
        id: "major-custom",
        label: "Major custom functionality or workflows",
        signals: [
          { path: "build", weight: 1 },
          { path: "diagnose", weight: 1 },
          { priority: "functionality", priorityWeight: 3 },
          { priority: "strategy", priorityWeight: 3 },
        ],
      },
      {
        id: "not-sure",
        label: "Not sure",
        signals: [{ path: "diagnose", weight: 1 }],
      },
    ],
  },
  {
    id: "platform-change",
    title: "Is changing website platform part of the plan?",
    type: "single",
    options: [
      {
        id: "no",
        label: "No",
        signals: [],
      },
      {
        id: "yes-definitely",
        label: "Yes, definitely",
        signals: [
          { path: "migrate", weight: 4 },
          { priority: "platform", priorityWeight: 3 },
          { priority: "seo-protection", priorityWeight: 2 },
        ],
      },
      {
        id: "maybe",
        label: "Maybe",
        signals: [
          { path: "migrate", weight: 1 },
          { priority: "platform", priorityWeight: 2 },
        ],
      },
      {
        id: "unknown-which",
        label: "I do not know which platform we should use",
        signals: [
          { path: "migrate", weight: 1 },
          { priority: "platform", priorityWeight: 3 },
          { priority: "strategy", priorityWeight: 1 },
        ],
      },
      {
        id: "no-existing-site",
        label: "No existing website",
        signals: [{ path: "build", weight: 3 }],
      },
    ],
  },
  {
    id: "project-stage",
    title: "How defined is the project today?",
    type: "single",
    options: [
      {
        id: "only-know-problem",
        label: "I only know there is a problem",
        signals: [{ path: "diagnose", weight: 2 }],
      },
      {
        id: "know-main-goal",
        label: "I know the main goal",
        signals: [],
      },
      {
        id: "rough-idea",
        label: "I have a rough idea of pages/features",
        signals: [],
      },
      {
        id: "detailed-requirements",
        label: "I have detailed requirements",
        signals: [],
      },
      {
        id: "ready-implementation",
        label: "We are ready to discuss implementation",
        signals: [],
      },
    ],
  },
];

export const PLANNER_BASE_QUESTION_COUNT = projectPlannerQuestions.filter(
  (question) => !question.showWhen,
).length;

export const PLANNER_CONDITIONAL_QUESTION_COUNT = projectPlannerQuestions.filter(
  (question) => question.showWhen,
).length;

export const PLANNER_DISCLAIMER =
  "This is a planning aid. Final scope may change after the website and requirements are reviewed.";

export function getPlannerQuestionById(
  id: string,
): ProjectPlannerQuestion | undefined {
  return projectPlannerQuestions.find((question) => question.id === id);
}

export function getPlannerOption(
  questionId: string,
  optionId: string,
): ProjectPlannerOption | undefined {
  const question = getPlannerQuestionById(questionId);
  return question?.options.find((option) => option.id === optionId);
}
