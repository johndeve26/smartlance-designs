/**
 * Deterministic Website Project Planner evaluation engine.
 * Same answers always produce the same result. No randomness, no scores in output.
 */

import {
  getPlannerOption,
  PLANNER_DISCLAIMER,
  PLANNER_PATH_META,
  PLANNER_PATHS,
  PLANNER_PRIORITY_LABELS,
  PLANNER_PRIORITY_REASONS,
  PLANNER_SOLUTION_META,
  projectPlannerQuestions,
  type PlannerPath,
  type PlannerPriorityId,
  type PlannerSolutionSlug,
  type ProjectPlannerQuestion,
} from "@/data/project-planner";

export type ProjectPlannerResult = {
  primaryPath: PlannerPath;
  secondaryPaths: PlannerPath[];
  pathTitle: string;
  pathExplanation: string;
  why: string[];
  priorities: { id: PlannerPriorityId; label: string; reason: string }[];
  relevantSolutions: { slug: string; title: string; href: string }[];
  relevantServices: { label: string; href: string }[];
  primaryResource: { label: string; href: string; reason: string } | null;
  secondaryResources: { label: string; href: string }[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  cautions: string[];
  answerSummary: { label: string; value: string }[];
  lowConfidence: boolean;
  showPricingLink: boolean;
  disclaimer: string;
};

export type PlannerAnswers = Record<string, string | string[]>;

export {
  PLANNER_BASE_QUESTION_COUNT,
  PLANNER_CONDITIONAL_QUESTION_COUNT,
  PLANNER_PATHS,
  projectPlannerQuestions,
} from "@/data/project-planner";

function singleAnswer(answers: PlannerAnswers, id: string): string | undefined {
  const value = answers[id];
  if (Array.isArray(value)) return value[0];
  return value;
}

function multiAnswer(answers: PlannerAnswers, id: string): string[] {
  const value = answers[id];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function isPlannerQuestionVisible(
  question: ProjectPlannerQuestion,
  answers: PlannerAnswers,
): boolean {
  if (!question.showWhen) return true;
  const value = singleAnswer(answers, question.showWhen.questionId);
  if (!value) return false;
  return question.showWhen.values.includes(value);
}

export function getVisiblePlannerQuestions(
  answers: PlannerAnswers,
): ProjectPlannerQuestion[] {
  return projectPlannerQuestions.filter((question) =>
    isPlannerQuestionVisible(question, answers),
  );
}

function hasNoExistingSite(answers: PlannerAnswers): boolean {
  return (
    singleAnswer(answers, "starting-point") === "no-website" ||
    singleAnswer(answers, "content-fit") === "no-existing" ||
    singleAnswer(answers, "platform-change") === "no-existing-site"
  );
}

function countNotSure(answers: PlannerAnswers): {
  notSureCount: number;
  answeredCount: number;
} {
  const visible = getVisiblePlannerQuestions(answers);
  let notSureCount = 0;
  let answeredCount = 0;

  for (const question of visible) {
    if (question.type === "multiple") {
      const values = multiAnswer(answers, question.id);
      if (values.length === 0) continue;
      answeredCount += 1;
      continue;
    }
    const value = singleAnswer(answers, question.id);
    if (!value) continue;
    answeredCount += 1;
    if (value === "not-sure") notSureCount += 1;
  }

  return { notSureCount, answeredCount };
}

function emptyPathScores(): Record<PlannerPath, number> {
  return {
    improve: 0,
    redesign: 0,
    build: 0,
    migrate: 0,
    grow: 0,
    diagnose: 0,
  };
}

function emptyPriorityScores(): Record<PlannerPriorityId, number> {
  return {
    "lead-generation": 0,
    conversion: 0,
    seo: 0,
    "local-visibility": 0,
    performance: 0,
    content: 0,
    design: 0,
    platform: 0,
    commerce: 0,
    analytics: 0,
    maintenance: 0,
    functionality: 0,
    strategy: 0,
    "seo-protection": 0,
  };
}

function applySignals(
  pathScores: Record<PlannerPath, number>,
  priorityScores: Record<PlannerPriorityId, number>,
  questionId: string,
  optionId: string,
) {
  const option = getPlannerOption(questionId, optionId);
  if (!option) return;
  for (const signal of option.signals) {
    if (signal.path && typeof signal.weight === "number") {
      pathScores[signal.path] += signal.weight;
    }
    if (signal.priority && typeof signal.priorityWeight === "number") {
      priorityScores[signal.priority] += signal.priorityWeight;
    }
  }
}

function collectScores(answers: PlannerAnswers): {
  pathScores: Record<PlannerPath, number>;
  priorityScores: Record<PlannerPriorityId, number>;
} {
  const pathScores = emptyPathScores();
  const priorityScores = emptyPriorityScores();
  const visible = getVisiblePlannerQuestions(answers);

  for (const question of visible) {
    if (question.type === "multiple") {
      for (const optionId of multiAnswer(answers, question.id)) {
        applySignals(pathScores, priorityScores, question.id, optionId);
      }
      continue;
    }
    const optionId = singleAnswer(answers, question.id);
    if (!optionId) continue;
    applySignals(pathScores, priorityScores, question.id, optionId);
  }

  return { pathScores, priorityScores };
}

function activeProblemIds(answers: PlannerAnswers): string[] {
  const problem = singleAnswer(answers, "main-problem");
  if (!problem) return [];
  if (problem === "several") {
    return multiAnswer(answers, "problems-multi");
  }
  return [problem];
}

function commerceIntent(answers: PlannerAnswers): boolean {
  const goal = singleAnswer(answers, "main-goal");
  const problems = activeProblemIds(answers);
  const functionality = singleAnswer(answers, "functionality");

  if (goal === "sell-online") return true;
  if (problems.includes("store-not-growing")) return true;
  if (functionality === "ecommerce-booking") return true;
  return false;
}

function hasScopeConflict(answers: PlannerAnswers): boolean {
  const scope = singleAnswer(answers, "change-scope");
  if (scope !== "few-improvements") return false;

  const content = singleAnswer(answers, "content-fit");
  const problems = activeProblemIds(answers);

  if (content === "major-restructure" || content === "business-changed") {
    return true;
  }
  if (problems.includes("platform-limits")) {
    return true;
  }
  return false;
}

function pickPrimaryPath(
  pathScores: Record<PlannerPath, number>,
  answers: PlannerAnswers,
  lowConfidence: boolean,
  noSite: boolean,
): { primary: PlannerPath; secondary: PlannerPath[] } {
  const secondary: PlannerPath[] = [];
  const platform = singleAnswer(answers, "platform-change");
  const scopeConflict = hasScopeConflict(answers);

  if (lowConfidence) {
    return { primary: "diagnose", secondary };
  }

  if (noSite) {
    pathScores.improve = Math.min(pathScores.improve, 0);
    pathScores.grow = Math.min(pathScores.grow, 0);
    // Favor build strongly for no-site cases
    pathScores.build += 5;
  }

  if (scopeConflict) {
    pathScores.improve -= 4;
    pathScores.redesign += 2;
    pathScores.diagnose += 2;
  }

  // Rank excluding diagnose unless it wins naturally (low confidence handled above)
  const ranked = PLANNER_PATHS.filter((path) => path !== "diagnose")
    .map((path) => ({ path, score: pathScores[path] }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.path.localeCompare(b.path);
    });

  let primary: PlannerPath = ranked[0]?.path ?? "diagnose";

  // Guardrail: no existing site cannot primary IMPROVE (or GROW as "improve existing")
  if (noSite && (primary === "improve" || primary === "grow")) {
    primary = "build";
  }

  // Platform change definitely → migrate as secondary (or primary if dominant)
  if (platform === "yes-definitely") {
    const migrateScore = pathScores.migrate;
    const primaryScore = pathScores[primary];
    if (migrateScore >= primaryScore && migrateScore >= pathScores.redesign) {
      // Migration is dominant — still prefer redesign/build as primary when broad change
      const scope = singleAnswer(answers, "change-scope");
      const start = singleAnswer(answers, "starting-point");
      if (
        scope === "most-website" ||
        scope === "everything-fresh" ||
        start === "feels-outdated" ||
        start === "planning-migration"
      ) {
        if (scope === "everything-fresh" && noSite) {
          primary = "build";
        } else if (pathScores.redesign >= pathScores.build) {
          primary = "redesign";
        } else if (pathScores.build > pathScores.redesign) {
          primary = "build";
        } else {
          primary = "redesign";
        }
        if (!secondary.includes("migrate")) secondary.push("migrate");
      } else if (migrateScore > primaryScore + 1) {
        primary = "migrate";
      } else {
        if (!secondary.includes("migrate")) secondary.push("migrate");
      }
    } else {
      if (!secondary.includes("migrate")) secondary.push("migrate");
    }
  }

  // Prefer grow over improve when growth goals dominate and site works
  if (
    !noSite &&
    primary === "improve" &&
    pathScores.grow >= pathScores.improve &&
    pathScores.grow > 0
  ) {
    const goal = singleAnswer(answers, "main-goal");
    const growthGoals = [
      "sell-online",
      "local-customers",
      "search-visibility",
      "more-enquiries",
      "support-growth",
    ];
    if (goal && growthGoals.includes(goal) && singleAnswer(answers, "starting-point") === "works-ok") {
      const scope = singleAnswer(answers, "change-scope");
      if (scope === "few-improvements" || scope === "several-pages") {
        // Keep improve for performance-only; allow grow when commerce/local/seo-led
        if (goal !== "load-better" && singleAnswer(answers, "main-problem") !== "slow-technical") {
          if (
            goal === "sell-online" ||
            goal === "local-customers" ||
            goal === "support-growth"
          ) {
            primary = "grow";
          }
        }
      }
    }
  }

  // Scope conflict: don't blindly improve
  if (scopeConflict && primary === "improve") {
    primary = pathScores.redesign >= pathScores.diagnose ? "redesign" : "diagnose";
  }

  // Attach grow as secondary when improve wins but grow is close
  if (
    primary === "improve" &&
    pathScores.grow >= pathScores.improve - 1 &&
    pathScores.grow > 2 &&
    !secondary.includes("grow")
  ) {
    // leave secondary empty for simple improve — avoid noise
  }

  // Deduplicate and exclude primary
  const cleanedSecondary = secondary.filter((path) => path !== primary);

  return { primary, secondary: cleanedSecondary };
}

function buildWhy(
  answers: PlannerAnswers,
  primary: PlannerPath,
  secondary: PlannerPath[],
  noSite: boolean,
  lowConfidence: boolean,
  scopeConflict: boolean,
): string[] {
  const why: string[] = [];
  const start = singleAnswer(answers, "starting-point");
  const goal = singleAnswer(answers, "main-goal");
  const problems = activeProblemIds(answers);
  const scope = singleAnswer(answers, "change-scope");
  const content = singleAnswer(answers, "content-fit");
  const functionality = singleAnswer(answers, "functionality");
  const platform = singleAnswer(answers, "platform-change");
  const stage = singleAnswer(answers, "project-stage");

  if (lowConfidence) {
    why.push("several answers are still uncertain");
    why.push("the type of change is not clear enough for a confident project path");
    if (!noSite) {
      why.push("an existing site review is a safer next step than assuming the scope");
    } else {
      why.push("defining the brief is more useful than guessing a build plan");
    }
    return why.slice(0, 5);
  }

  if (noSite || start === "no-website" || content === "no-existing") {
    why.push("there is no existing website foundation to improve");
  }
  if (start === "feels-outdated") {
    why.push("the current website already feels outdated");
  }
  if (start === "works-ok") {
    why.push("the current website is fundamentally usable");
  }
  if (start === "planning-migration") {
    why.push("a platform or site migration is already part of the plan");
  }
  if (goal === "launch-new") {
    why.push("the main goal is launching a new website");
  }
  if (goal === "more-enquiries") {
    why.push("generating more enquiries is the primary goal");
  }
  if (goal === "search-visibility") {
    why.push("search visibility is the primary goal");
  }
  if (goal === "sell-online") {
    why.push("selling more online is the primary goal");
  }
  if (goal === "local-customers") {
    why.push("reaching more local customers is the primary goal");
  }
  if (goal === "load-better") {
    why.push("performance and technical responsiveness are the main goal");
  }
  if (goal === "credibility" || goal === "explain-services") {
    why.push("presentation and clarity need to better reflect the business");
  }
  if (goal === "move-platform") {
    why.push("moving to a better platform is a stated goal");
  }

  if (problems.includes("outdated-look")) {
    why.push("the look and feel no longer support the business");
  }
  if (problems.includes("no-action")) {
    why.push("visitors are not taking action");
  }
  if (problems.includes("poor-visibility")) {
    why.push("search visibility is the biggest current problem");
  }
  if (problems.includes("slow-technical")) {
    why.push("speed and technical issues are the biggest current problem");
  }
  if (problems.includes("content-mismatch")) {
    why.push("content and structure no longer match the business");
  }
  if (problems.includes("store-not-growing")) {
    why.push("the store is not growing as needed");
  }
  if (problems.includes("local-discovery")) {
    why.push("nearby customers struggle to find the business");
  }
  if (problems.includes("platform-limits")) {
    why.push("the current platform is limiting what the business needs");
  }

  if (scope === "few-improvements") {
    why.push("only a few targeted improvements are expected");
  }
  if (scope === "most-website") {
    why.push("most of the website is expected to change");
  }
  if (scope === "everything-fresh") {
    why.push("the project is expected to start fresh");
  }
  if (content === "mostly-works") {
    why.push("content and structure mostly still fit");
  }
  if (content === "major-restructure") {
    why.push("major content restructuring is needed");
  }
  if (content === "business-changed") {
    why.push("the business and services have changed significantly");
  }
  if (platform === "yes-definitely") {
    why.push("changing platform is a confirmed requirement");
  }
  if (platform === "no") {
    why.push("platform change is not part of the plan");
  }
  if (platform === "unknown-which") {
    why.push("the right platform is still unclear");
  }
  if (functionality === "major-custom") {
    why.push("major custom functionality may expand the technical scope");
  }
  if (functionality === "standard-pages") {
    why.push("functionality needs look relatively standard");
  }
  if (secondary.includes("migrate")) {
    why.push("platform migration remains an additional project requirement");
  }
  if (scopeConflict) {
    why.push("answers point to a broader decision than a small improvement");
  }
  if (stage === "only-know-problem") {
    why.push("the project is still early and mainly problem-led");
  }
  if (stage === "ready-implementation") {
    why.push("the project is ready to discuss implementation");
  }

  // Path-specific fallbacks
  if (why.length < 3) {
    if (primary === "improve") {
      why.push("a full redesign may not be necessary based on these answers");
    }
    if (primary === "redesign") {
      why.push("broader structural and experience change is supported by the answers");
    }
    if (primary === "build") {
      why.push("planning should begin more like a new website project");
    }
    if (primary === "grow") {
      why.push("growth work is a better fit than rebuilding the whole site");
    }
  }

  return [...new Set(why)].slice(0, 5);
}

function buildPriorities(
  priorityScores: Record<PlannerPriorityId, number>,
  answers: PlannerAnswers,
  primary: PlannerPath,
): { id: PlannerPriorityId; label: string; reason: string }[] {
  const ranked = (Object.keys(priorityScores) as PlannerPriorityId[])
    .map((id) => ({ id, score: priorityScores[id] }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

  const selected: PlannerPriorityId[] = ranked.slice(0, 5).map((item) => item.id);

  // Ensure path-relevant defaults if thin
  if (selected.length < 3) {
    const defaults: PlannerPriorityId[] =
      primary === "build"
        ? ["strategy", "content", "design", "platform"]
        : primary === "redesign"
          ? ["content", "design", "conversion", "seo-protection"]
          : primary === "grow"
            ? ["seo", "conversion", "analytics"]
            : primary === "diagnose"
              ? ["strategy", "analytics", "conversion"]
              : ["conversion", "content", "analytics"];

    for (const id of defaults) {
      if (selected.length >= 3) break;
      if (!selected.includes(id)) selected.push(id);
    }
  }

  // Guardrail: no commerce goal → don't prioritize commerce hard
  if (!commerceIntent(answers)) {
    const idx = selected.indexOf("commerce");
    if (idx >= 0) selected.splice(idx, 1);
  }

  // Migration / platform change → seo-protection often relevant
  if (
    singleAnswer(answers, "platform-change") === "yes-definitely" &&
    !selected.includes("seo-protection") &&
    selected.length < 5
  ) {
    selected.push("seo-protection");
  }

  return selected.slice(0, 5).map((id) => ({
    id,
    label: PLANNER_PRIORITY_LABELS[id],
    reason: PLANNER_PRIORITY_REASONS[id],
  }));
}

function pushSolution(
  list: PlannerSolutionSlug[],
  slug: PlannerSolutionSlug,
) {
  if (!list.includes(slug)) list.push(slug);
}

function buildSolutions(
  answers: PlannerAnswers,
  primary: PlannerPath,
  secondary: PlannerPath[],
  noSite: boolean,
  priorityScores: Record<PlannerPriorityId, number>,
): { slug: string; title: string; href: string }[] {
  const slugs: PlannerSolutionSlug[] = [];
  const goal = singleAnswer(answers, "main-goal");
  const problems = new Set(activeProblemIds(answers));

  if (noSite || primary === "build" || goal === "launch-new") {
    pushSolution(slugs, "new-business-website");
  }

  if (primary === "redesign" || problems.has("outdated-look") || problems.has("content-mismatch")) {
    pushSolution(slugs, "outdated-website");
  }

  if (
    secondary.includes("migrate") ||
    primary === "migrate" ||
    singleAnswer(answers, "platform-change") === "yes-definitely" ||
    goal === "move-platform" ||
    singleAnswer(answers, "starting-point") === "planning-migration"
  ) {
    pushSolution(slugs, "website-migration");
  }

  if (
    goal === "more-enquiries" ||
    problems.has("no-action") ||
    priorityScores["lead-generation"] >= 3
  ) {
    if (goal === "more-enquiries" || problems.has("no-action")) {
      pushSolution(slugs, "website-not-generating-leads");
    }
  }

  if (goal === "search-visibility" || problems.has("poor-visibility")) {
    pushSolution(slugs, "website-not-ranking");
  }

  if (goal === "load-better" || problems.has("slow-technical")) {
    pushSolution(slugs, "slow-website");
  }

  if (goal === "sell-online" || problems.has("store-not-growing")) {
    pushSolution(slugs, "ecommerce-growth");
  }

  if (goal === "local-customers" || problems.has("local-discovery")) {
    pushSolution(slugs, "local-business-visibility");
  }

  if (problems.has("no-action") && goal !== "more-enquiries" && slugs.length < 2) {
    pushSolution(slugs, "low-website-conversions");
  }

  // Path-based fallbacks
  if (slugs.length === 0) {
    if (primary === "improve" || primary === "grow") {
      pushSolution(slugs, "website-not-generating-leads");
    } else if (primary === "redesign") {
      pushSolution(slugs, "outdated-website");
    } else if (primary === "build") {
      pushSolution(slugs, "new-business-website");
    } else if (primary === "migrate") {
      pushSolution(slugs, "website-migration");
    }
  }

  // Prefer migration solution when it's a major migration scenario
  if (
    secondary.includes("migrate") &&
    slugs.includes("website-migration") &&
    slugs[0] !== "website-migration"
  ) {
    // Keep redesign first, migration second — max 2
  }

  return slugs.slice(0, 2).map((slug) => ({
    slug,
    title: PLANNER_SOLUTION_META[slug].title,
    href: PLANNER_SOLUTION_META[slug].href,
  }));
}

function buildServices(
  answers: PlannerAnswers,
  primary: PlannerPath,
  secondary: PlannerPath[],
  noSite: boolean,
  priorities: { id: PlannerPriorityId }[],
): { label: string; href: string }[] {
  const services: { label: string; href: string }[] = [];
  const priorityIds = new Set(priorities.map((item) => item.id));
  const goal = singleAnswer(answers, "main-goal");
  const problems = activeProblemIds(answers);
  const functionality = singleAnswer(answers, "functionality");

  const add = (label: string, href: string) => {
    if (services.some((item) => item.href === href)) return;
    if (services.length >= 4) return;
    services.push({ label, href });
  };

  // Goal/problem-led services first so the 4-slot budget stays on-intent
  if (functionality === "major-custom") {
    add("Website Strategy", "/services/website-strategy");
    add("Website Development", "/services/website-development");
  }

  if (goal === "load-better" || problems.includes("slow-technical")) {
    add(
      "Website Performance Optimization",
      "/services/website-performance-optimization",
    );
  }

  if (
    goal === "local-customers" ||
    problems.includes("local-discovery") ||
    priorityIds.has("local-visibility")
  ) {
    add("Local SEO", "/seo/local-seo");
    add("SEO", "/seo");
  }

  if (goal === "search-visibility" || problems.includes("poor-visibility")) {
    add("SEO", "/seo");
    add("Technical SEO", "/seo/technical-seo");
    add("SEO Audit", "/seo/seo-audit");
  }

  if (goal === "more-enquiries" || problems.includes("no-action")) {
    add("Conversion Rate Optimization", "/services/conversion-rate-optimization");
    add(
      "Analytics & Conversion Tracking",
      "/services/analytics-conversion-tracking",
    );
  }

  if (commerceIntent(answers)) {
    add("E-commerce Development", "/services/ecommerce-development");
    add("Conversion Rate Optimization", "/services/conversion-rate-optimization");
    add(
      "Analytics & Conversion Tracking",
      "/services/analytics-conversion-tracking",
    );
  }

  if (primary === "redesign") {
    add("Website Redesign", "/services/website-redesign");
    add("Website Strategy", "/services/website-strategy");
    add("Website Design", "/services/website-design");
  }

  if (primary === "build" || noSite) {
    add("Website Strategy", "/services/website-strategy");
    add("Website Design", "/services/website-design");
    add("Website Development", "/services/website-development");
  }

  if (primary === "migrate" || secondary.includes("migrate")) {
    add("Website Migration", "/services/website-migration");
  }

  if (primary === "diagnose") {
    add("Website Audit", "/services/website-audit");
  }

  if (priorityIds.has("performance") && goal !== "local-customers") {
    add(
      "Website Performance Optimization",
      "/services/website-performance-optimization",
    );
  }

  if (
    (priorityIds.has("conversion") || priorityIds.has("lead-generation")) &&
    goal !== "local-customers" &&
    goal !== "search-visibility" &&
    goal !== "load-better"
  ) {
    add("Conversion Rate Optimization", "/services/conversion-rate-optimization");
    add(
      "Analytics & Conversion Tracking",
      "/services/analytics-conversion-tracking",
    );
  }

  if (priorityIds.has("seo") && goal !== "local-customers") {
    add("SEO", "/seo");
    add("Technical SEO", "/seo/technical-seo");
  }

  if (priorityIds.has("content")) {
    add("SEO Copywriting", "/services/seo-copywriting");
  }

  if (services.length === 0) {
    add("Website Strategy", "/services/website-strategy");
    add("Website Design", "/services/website-design");
  }

  // Guardrail: strip ecommerce-development without commerce intent
  if (!commerceIntent(answers)) {
    return services
      .filter((item) => item.href !== "/services/ecommerce-development")
      .slice(0, 4);
  }

  return services.slice(0, 4);
}

function buildResources(
  answers: PlannerAnswers,
  primary: PlannerPath,
  secondary: PlannerPath[],
  noSite: boolean,
  lowConfidence: boolean,
): {
  primaryResource: ProjectPlannerResult["primaryResource"];
  secondaryResources: ProjectPlannerResult["secondaryResources"];
} {
  const platform = singleAnswer(answers, "platform-change");
  const stage = singleAnswer(answers, "project-stage");
  const secondaryResources: { label: string; href: string }[] = [];

  const addSecondary = (label: string, href: string) => {
    if (secondaryResources.some((item) => item.href === href)) return;
    secondaryResources.push({ label, href });
  };

  if (lowConfidence) {
    if (noSite) {
      return {
        primaryResource: {
          label: "Website Project Brief Template",
          href: "/templates/website-project-brief-template",
          reason: "Define the project before assuming a build path.",
        },
        secondaryResources: [
          {
            label: "Website Platform Selector",
            href: "/tools/website-platform-selector",
          },
        ],
      };
    }
    return {
      primaryResource: {
        label: "Free Website Review",
        href: "/free-website-review",
        reason: "Clarify what is actually limiting the current website.",
      },
      secondaryResources: [
        { label: "Website Audit", href: "/services/website-audit" },
        {
          label: "Website Project Brief Template",
          href: "/templates/website-project-brief-template",
        },
      ],
    };
  }

  if (platform === "unknown-which") {
    const primaryResource = noSite
      ? {
          label: "Website Project Brief Template",
          href: "/templates/website-project-brief-template",
          reason: "Capture goals and requirements before platform decisions harden.",
        }
      : {
          label: "Website Platform Selector",
          href: "/tools/website-platform-selector",
          reason: "Compare platforms that may fit the project requirements.",
        };

    if (noSite) {
      addSecondary(
        "Website Platform Selector",
        "/tools/website-platform-selector",
      );
    } else {
      addSecondary(
        "Website Project Brief Template",
        "/templates/website-project-brief-template",
      );
      addSecondary("WordPress vs Webflow", "/compare/wordpress-vs-webflow");
    }

    return { primaryResource, secondaryResources };
  }

  if (primary === "build" || noSite) {
    addSecondary(
      "Website Platform Selector",
      "/tools/website-platform-selector",
    );
    return {
      primaryResource: {
        label: "Website Project Brief Template",
        href: "/templates/website-project-brief-template",
        reason: "Turn goals into a clearer brief before implementation talks.",
      },
      secondaryResources,
    };
  }

  if (primary === "redesign" || secondary.includes("migrate")) {
    if (stage === "detailed-requirements" || stage === "ready-implementation") {
      addSecondary(
        "Website Redesign Guide",
        "/guides/website-redesign-guide",
      );
      if (secondary.includes("migrate")) {
        addSecondary("Website Migration", "/solutions/website-migration");
      }
      return {
        primaryResource: {
          label: "Website Redesign Checklist",
          href: "/checklists/website-redesign-checklist",
          reason: "Use a practical checklist as execution gets closer.",
        },
        secondaryResources,
      };
    }

    addSecondary(
      "Website Redesign Checklist",
      "/checklists/website-redesign-checklist",
    );
    if (secondary.includes("migrate")) {
      addSecondary("Website Migration", "/solutions/website-migration");
    }
    return {
      primaryResource: {
        label: "Website Redesign Guide",
        href: "/guides/website-redesign-guide",
        reason: "Understand what a redesign should clarify before build work starts.",
      },
      secondaryResources,
    };
  }

  if (primary === "improve" || primary === "grow") {
    return {
      primaryResource: noSite
        ? {
            label: "Website Project Brief Template",
            href: "/templates/website-project-brief-template",
            reason: "Define the project before choosing improvements.",
          }
        : {
            label: "Free Website Review",
            href: "/free-website-review",
            reason: "Review the current site before committing to larger change.",
          },
      secondaryResources: noSite
        ? []
        : [{ label: "Website Audit", href: "/services/website-audit" }],
    };
  }

  if (primary === "migrate") {
    return {
      primaryResource: {
        label: "Website Redesign Guide",
        href: "/guides/website-redesign-guide",
        reason: "Migration planning often overlaps with redesign decisions.",
      },
      secondaryResources: [
        { label: "Website Migration", href: "/solutions/website-migration" },
      ],
    };
  }

  return {
    primaryResource: {
      label: "Website Project Brief Template",
      href: "/templates/website-project-brief-template",
      reason: "Capture what is known before the next planning conversation.",
    },
    secondaryResources,
  };
}

function buildCtas(
  answers: PlannerAnswers,
  primary: PlannerPath,
  noSite: boolean,
  lowConfidence: boolean,
  primaryResource: ProjectPlannerResult["primaryResource"],
): {
  primaryCta: ProjectPlannerResult["primaryCta"];
  secondaryCta?: ProjectPlannerResult["secondaryCta"];
} {
  const platform = singleAnswer(answers, "platform-change");
  const stage = singleAnswer(answers, "project-stage");

  if (lowConfidence && !noSite) {
    return {
      primaryCta: {
        label: "Get a Free Website Review",
        href: "/free-website-review",
      },
      secondaryCta: {
        label: "Website Audit",
        href: "/services/website-audit",
      },
    };
  }

  if (noSite || primary === "build") {
    return {
      primaryCta: {
        label: "Use the Project Brief Template",
        href: "/templates/website-project-brief-template",
      },
      secondaryCta:
        platform === "unknown-which"
          ? {
              label: "Use the Platform Selector",
              href: "/tools/website-platform-selector",
            }
          : {
              label: "Tell Us About Your Project",
              href: "/contact",
            },
    };
  }

  if (platform === "unknown-which") {
    return {
      primaryCta: {
        label: "Use the Platform Selector",
        href: "/tools/website-platform-selector",
      },
      secondaryCta: {
        label: "Tell Us About Your Project",
        href: "/contact",
      },
    };
  }

  if (primary === "redesign") {
    return {
      primaryCta: {
        label: "Read the Redesign Guide",
        href: "/guides/website-redesign-guide",
      },
      secondaryCta: {
        label: "Tell Us About Your Project",
        href: "/contact",
      },
    };
  }

  if (stage === "ready-implementation" || stage === "detailed-requirements") {
    return {
      primaryCta: {
        label: "Tell Us About Your Project",
        href: "/contact",
      },
      secondaryCta: primaryResource
        ? { label: primaryResource.label, href: primaryResource.href }
        : {
            label: "Use the Project Brief Template",
            href: "/templates/website-project-brief-template",
          },
    };
  }

  if (primary === "improve" || primary === "grow") {
    return {
      primaryCta: {
        label: "Get a Free Website Review",
        href: "/free-website-review",
      },
      secondaryCta: {
        label: "Tell Us About Your Project",
        href: "/contact",
      },
    };
  }

  return {
    primaryCta: {
      label: "Tell Us About Your Project",
      href: "/contact",
    },
    secondaryCta: primaryResource
      ? { label: primaryResource.label, href: primaryResource.href }
      : undefined,
  };
}

function buildCautions(
  answers: PlannerAnswers,
  primary: PlannerPath,
  scopeConflict: boolean,
  noSite: boolean,
): string[] {
  const cautions: string[] = [];
  const functionality = singleAnswer(answers, "functionality");
  const scope = singleAnswer(answers, "change-scope");
  const content = singleAnswer(answers, "content-fit");

  if (functionality === "major-custom") {
    cautions.push(
      "Your project may need technical discovery before a standard website scope is finalized.",
    );
  }

  if (scopeConflict) {
    cautions.push(
      "Your answers point to a broader decision than a small improvement.",
    );
  }

  if (
    (primary === "build" || scope === "everything-fresh") &&
    !noSite &&
    content !== "no-existing"
  ) {
    cautions.push(
      "Starting fresh does not mean discarding useful URLs or content without review.",
    );
  }

  if (singleAnswer(answers, "platform-change") === "yes-definitely") {
    cautions.push(
      "Platform migration should include URL, content and redirect planning.",
    );
  }

  return cautions;
}

function buildAnswerSummary(
  answers: PlannerAnswers,
): { label: string; value: string }[] {
  const summary: { label: string; value: string }[] = [];
  const visible = getVisiblePlannerQuestions(answers);

  for (const question of visible) {
    if (question.type === "multiple") {
      const values = multiAnswer(answers, question.id);
      if (values.length === 0) continue;
      const labels = values
        .map((id) => getPlannerOption(question.id, id)?.label)
        .filter((label): label is string => Boolean(label));
      if (labels.length === 0) continue;
      summary.push({
        label: question.title.replace(/\?$/, ""),
        value: labels.join("; "),
      });
      continue;
    }

    const optionId = singleAnswer(answers, question.id);
    if (!optionId) continue;
    const option = getPlannerOption(question.id, optionId);
    if (!option) continue;
    summary.push({
      label: question.title.replace(/\?$/, ""),
      value: option.label,
    });
  }

  return summary;
}

export function evaluateProjectPlan(answers: PlannerAnswers): ProjectPlannerResult {
  const visibleAnswers: PlannerAnswers = {};
  for (const question of getVisiblePlannerQuestions(answers)) {
    const value = answers[question.id];
    if (value === undefined) continue;
    visibleAnswers[question.id] = value;
  }

  const { pathScores, priorityScores } = collectScores(visibleAnswers);
  const { notSureCount, answeredCount } = countNotSure(visibleAnswers);
  const lowConfidence =
    notSureCount >= 4 ||
    (answeredCount > 0 && notSureCount / answeredCount >= 0.5);

  const noSite = hasNoExistingSite(visibleAnswers);
  const scopeConflict = hasScopeConflict(visibleAnswers);

  const { primary, secondary } = pickPrimaryPath(
    pathScores,
    visibleAnswers,
    lowConfidence,
    noSite,
  );

  const meta = PLANNER_PATH_META[primary];
  const priorities = buildPriorities(priorityScores, visibleAnswers, primary);
  const relevantSolutions = buildSolutions(
    visibleAnswers,
    primary,
    secondary,
    noSite,
    priorityScores,
  );
  const relevantServices = buildServices(
    visibleAnswers,
    primary,
    secondary,
    noSite,
    priorities,
  );
  const { primaryResource, secondaryResources } = buildResources(
    visibleAnswers,
    primary,
    secondary,
    noSite,
    lowConfidence,
  );
  const { primaryCta, secondaryCta } = buildCtas(
    visibleAnswers,
    primary,
    noSite,
    lowConfidence,
    primaryResource,
  );

  // Hard guardrail: never Free Website Review as primary CTA for no-site
  let safePrimaryCta = primaryCta;
  let safeSecondaryCta = secondaryCta;
  if (noSite && safePrimaryCta.href === "/free-website-review") {
    safePrimaryCta = {
      label: "Use the Project Brief Template",
      href: "/templates/website-project-brief-template",
    };
    safeSecondaryCta = {
      label: "Tell Us About Your Project",
      href: "/contact",
    };
  }

  let safePrimaryResource = primaryResource;
  if (noSite && safePrimaryResource?.href === "/free-website-review") {
    safePrimaryResource = {
      label: "Website Project Brief Template",
      href: "/templates/website-project-brief-template",
      reason: "Define the project before assuming a build path.",
    };
  }

  return {
    primaryPath: primary,
    secondaryPaths: secondary,
    pathTitle: meta.title,
    pathExplanation: meta.explanation,
    why: buildWhy(
      visibleAnswers,
      primary,
      secondary,
      noSite,
      lowConfidence,
      scopeConflict,
    ),
    priorities,
    relevantSolutions,
    relevantServices,
    primaryResource: safePrimaryResource,
    secondaryResources,
    primaryCta: safePrimaryCta,
    secondaryCta: safeSecondaryCta,
    cautions: buildCautions(visibleAnswers, primary, scopeConflict, noSite),
    answerSummary: buildAnswerSummary(visibleAnswers),
    lowConfidence,
    showPricingLink: true,
    disclaimer: PLANNER_DISCLAIMER,
  };
}

export function buildProjectPlanPlainText(result: ProjectPlannerResult): string {
  const lines: string[] = [];
  lines.push("Website Project Planner Results");
  lines.push("Smartlance Designs");
  lines.push("");

  lines.push("Your Project Context");
  for (const item of result.answerSummary) {
    lines.push(`- ${item.label}: ${item.value}`);
  }
  lines.push("");

  lines.push("Your Likely Project Path");
  lines.push(result.pathTitle);
  lines.push(result.pathExplanation);
  if (result.secondaryPaths.length > 0) {
    lines.push("");
    lines.push("Also Part of the Project");
    for (const path of result.secondaryPaths) {
      lines.push(`- ${PLANNER_PATH_META[path].title}`);
    }
  }
  lines.push("");

  if (result.why.length > 0) {
    lines.push("Why this path fits your answers");
    for (const reason of result.why) {
      lines.push(`- ${reason}`);
    }
    lines.push("");
  }

  if (result.priorities.length > 0) {
    lines.push("What deserves attention first");
    for (const priority of result.priorities) {
      lines.push(`- ${priority.label}: ${priority.reason}`);
    }
    lines.push("");
  }

  if (result.relevantSolutions.length > 0) {
    lines.push("Relevant Solution");
    for (const solution of result.relevantSolutions) {
      lines.push(`- ${solution.title}: ${solution.href}`);
    }
    lines.push("");
  }

  if (result.relevantServices.length > 0) {
    lines.push("Services that may help");
    for (const service of result.relevantServices) {
      lines.push(`- ${service.label}: ${service.href}`);
    }
    lines.push("");
  }

  if (result.primaryResource) {
    lines.push("Best next resource");
    lines.push(
      `- ${result.primaryResource.label}: ${result.primaryResource.href}`,
    );
    lines.push(`  ${result.primaryResource.reason}`);
    lines.push("");
  }

  if (result.secondaryResources.length > 0) {
    lines.push("Also useful");
    for (const resource of result.secondaryResources) {
      lines.push(`- ${resource.label}: ${resource.href}`);
    }
    lines.push("");
  }

  if (result.cautions.length > 0) {
    lines.push("Things to keep in mind");
    for (const caution of result.cautions) {
      lines.push(`- ${caution}`);
    }
    lines.push("");
  }

  if (result.showPricingLink) {
    lines.push("Want to understand what may affect the scope?");
    lines.push("- Pricing & Project Scope: /pricing");
    lines.push("");
  }

  lines.push("Next step");
  lines.push(`- ${result.primaryCta.label}: ${result.primaryCta.href}`);
  if (result.secondaryCta) {
    lines.push(`- ${result.secondaryCta.label}: ${result.secondaryCta.href}`);
  }
  lines.push("");
  lines.push(result.disclaimer);

  return lines.join("\n");
}
