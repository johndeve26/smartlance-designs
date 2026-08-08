/**
 * Deterministic scenario assertions for the Website Project Planner.
 * No test framework required — call assertProjectPlannerScenarios() or
 * runScenarioAssertions() from a Node script.
 */

import {
  evaluateProjectPlan,
  type PlannerAnswers,
  type ProjectPlannerResult,
} from "@/lib/project-planner";

export type ProjectPlannerScenario = {
  name: string;
  answers: PlannerAnswers;
  assert: (result: ProjectPlannerResult) => string | null;
};

function hasSolution(result: ProjectPlannerResult, slug: string): boolean {
  return result.relevantSolutions.some((item) => item.slug === slug);
}

function hasServiceHref(result: ProjectPlannerResult, href: string): boolean {
  return result.relevantServices.some((item) => item.href === href);
}

function hasResourceHref(result: ProjectPlannerResult, href: string): boolean {
  if (result.primaryResource?.href === href) return true;
  return result.secondaryResources.some((item) => item.href === href);
}

function pathIsOneOf(
  result: ProjectPlannerResult,
  allowed: ProjectPlannerResult["primaryPath"][],
): boolean {
  return allowed.includes(result.primaryPath);
}

export const projectPlannerScenarios: ProjectPlannerScenario[] = [
  {
    name: "new-business",
    answers: {
      "starting-point": "no-website",
      "main-goal": "launch-new",
      "main-problem": "not-sure",
      "change-scope": "everything-fresh",
      "content-fit": "no-existing",
      functionality: "standard-pages",
      "platform-change": "unknown-which",
      "project-stage": "rough-idea",
    },
    assert: (result) => {
      if (result.primaryPath !== "build") {
        return `Expected BUILD; got ${result.pathTitle}`;
      }
      if (!hasSolution(result, "new-business-website")) {
        return "Expected new-business-website solution";
      }
      if (!hasResourceHref(result, "/templates/website-project-brief-template")) {
        return "Expected Project Brief Template resource";
      }
      if (!hasResourceHref(result, "/tools/website-platform-selector")) {
        return "Expected Platform Selector resource";
      }
      if (result.primaryCta.href === "/free-website-review") {
        return "Free Website Review must not be primary CTA for new business";
      }
      return null;
    },
  },
  {
    name: "outdated-site",
    answers: {
      "starting-point": "feels-outdated",
      "main-goal": "credibility",
      "main-problem": "outdated-look",
      "change-scope": "most-website",
      "content-fit": "business-changed",
      functionality: "standard-pages",
      "platform-change": "no",
      "project-stage": "rough-idea",
    },
    assert: (result) => {
      if (result.primaryPath !== "redesign") {
        return `Expected REDESIGN; got ${result.pathTitle}`;
      }
      if (!hasSolution(result, "outdated-website")) {
        return "Expected outdated-website solution";
      }
      if (!hasResourceHref(result, "/guides/website-redesign-guide")) {
        return "Expected Redesign Guide resource";
      }
      if (!hasServiceHref(result, "/services/website-redesign")) {
        return "Expected Website Redesign service";
      }
      return null;
    },
  },
  {
    name: "performance-only",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "load-better",
      "main-problem": "slow-technical",
      "change-scope": "few-improvements",
      "content-fit": "mostly-works",
      functionality: "standard-pages",
      "platform-change": "no",
      "project-stage": "know-main-goal",
    },
    assert: (result) => {
      if (result.primaryPath !== "improve") {
        return `Expected IMPROVE; got ${result.pathTitle}`;
      }
      if (!hasSolution(result, "slow-website")) {
        return "Expected slow-website solution";
      }
      if (
        !hasServiceHref(result, "/services/website-performance-optimization")
      ) {
        return "Expected Website Performance Optimization service";
      }
      return null;
    },
  },
  {
    name: "seo-only",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "search-visibility",
      "main-problem": "poor-visibility",
      "change-scope": "few-improvements",
      "content-fit": "mostly-works",
      functionality: "standard-pages",
      "platform-change": "no",
      "project-stage": "know-main-goal",
    },
    assert: (result) => {
      if (!pathIsOneOf(result, ["improve", "grow"])) {
        return `Expected IMPROVE or GROW; got ${result.pathTitle}`;
      }
      if (!hasSolution(result, "website-not-ranking")) {
        return "Expected website-not-ranking solution";
      }
      const seoLink =
        hasServiceHref(result, "/seo") ||
        hasServiceHref(result, "/seo/technical-seo") ||
        hasServiceHref(result, "/seo/seo-audit");
      if (!seoLink) {
        return "Expected SEO-related service links";
      }
      return null;
    },
  },
  {
    name: "lead-generation",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "more-enquiries",
      "main-problem": "no-action",
      "change-scope": "several-pages",
      "content-fit": "some-improvement",
      functionality: "standard-pages",
      "platform-change": "no",
      "project-stage": "know-main-goal",
    },
    assert: (result) => {
      if (!pathIsOneOf(result, ["improve", "grow"])) {
        return `Expected IMPROVE or GROW; got ${result.pathTitle}`;
      }
      if (!hasSolution(result, "website-not-generating-leads")) {
        return "Expected website-not-generating-leads solution";
      }
      return null;
    },
  },
  {
    name: "major-migration",
    answers: {
      "starting-point": "planning-migration",
      "main-goal": "move-platform",
      "main-problem": "platform-limits",
      "change-scope": "most-website",
      "content-fit": "major-restructure",
      functionality: "few-features",
      "platform-change": "yes-definitely",
      "project-stage": "detailed-requirements",
    },
    assert: (result) => {
      if (result.primaryPath !== "redesign") {
        return `Expected REDESIGN primary; got ${result.pathTitle}`;
      }
      if (!result.secondaryPaths.includes("migrate")) {
        return "Expected migrate in secondaryPaths";
      }
      if (!hasSolution(result, "website-migration")) {
        return "Expected website-migration solution";
      }
      if (!hasServiceHref(result, "/services/website-migration")) {
        return "Expected Website Migration service";
      }
      return null;
    },
  },
  {
    name: "ecommerce-growth",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "sell-online",
      "main-problem": "store-not-growing",
      "change-scope": "several-pages",
      "content-fit": "mostly-works",
      functionality: "ecommerce-booking",
      "platform-change": "no",
      "project-stage": "know-main-goal",
    },
    assert: (result) => {
      if (!pathIsOneOf(result, ["grow", "improve"])) {
        return `Expected GROW or IMPROVE; got ${result.pathTitle}`;
      }
      if (!hasSolution(result, "ecommerce-growth")) {
        return "Expected ecommerce-growth solution";
      }
      if (result.primaryPath === "build") {
        return "Should not automatically build a new store";
      }
      return null;
    },
  },
  {
    name: "local",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "local-customers",
      "main-problem": "local-discovery",
      "change-scope": "few-improvements",
      "content-fit": "mostly-works",
      functionality: "standard-pages",
      "platform-change": "no",
      "project-stage": "know-main-goal",
    },
    assert: (result) => {
      if (!pathIsOneOf(result, ["grow", "improve"])) {
        return `Expected GROW or IMPROVE; got ${result.pathTitle}`;
      }
      if (!hasSolution(result, "local-business-visibility")) {
        return "Expected local-business-visibility solution";
      }
      if (!hasServiceHref(result, "/seo/local-seo")) {
        return "Expected Local SEO service link";
      }
      return null;
    },
  },
  {
    name: "uncertain-all-not-sure",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "not-sure",
      "main-problem": "not-sure",
      "change-scope": "not-sure",
      "content-fit": "not-sure",
      functionality: "not-sure",
      "platform-change": "maybe",
      "project-stage": "only-know-problem",
    },
    assert: (result) => {
      if (result.primaryPath !== "diagnose") {
        return `Expected DIAGNOSE; got ${result.pathTitle}`;
      }
      if (!result.lowConfidence) {
        return "lowConfidence should be true";
      }
      if (result.primaryCta.href !== "/free-website-review") {
        return "Expected Free Website Review as primary CTA for uncertain existing site";
      }
      return null;
    },
  },
  {
    name: "complex-functionality",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "support-growth",
      "main-problem": "platform-limits",
      "change-scope": "several-pages",
      "content-fit": "some-improvement",
      functionality: "major-custom",
      "platform-change": "maybe",
      "project-stage": "only-know-problem",
    },
    assert: (result) => {
      const hasCaution = result.cautions.some((text) =>
        text.toLowerCase().includes("technical discovery"),
      );
      if (!hasCaution) {
        return "Expected technical discovery caution";
      }
      if (!hasServiceHref(result, "/services/website-strategy")) {
        return "Expected Website Strategy service";
      }
      if (!hasServiceHref(result, "/services/website-development")) {
        return "Expected Website Development service";
      }
      return null;
    },
  },
  {
    name: "small-fixes",
    answers: {
      "starting-point": "works-ok",
      "main-goal": "credibility",
      "main-problem": "outdated-look",
      "change-scope": "few-improvements",
      "content-fit": "mostly-works",
      functionality: "standard-pages",
      "platform-change": "no",
      "project-stage": "know-main-goal",
    },
    assert: (result) => {
      if (result.primaryPath !== "improve") {
        return `Expected IMPROVE (no upsell); got ${result.pathTitle}`;
      }
      return null;
    },
  },
];

export function assertProjectPlannerScenarios(): {
  name: string;
  ok: boolean;
  detail: string;
}[] {
  return projectPlannerScenarios.map((scenario) => {
    try {
      const result = evaluateProjectPlan(scenario.answers);
      const detail = scenario.assert(result);
      if (detail) {
        return { name: scenario.name, ok: false, detail };
      }
      return { name: scenario.name, ok: true, detail: "passed" };
    } catch (error) {
      return {
        name: scenario.name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

export function runScenarioAssertions(): void {
  const results = assertProjectPlannerScenarios();
  const failures = results.filter((item) => !item.ok);
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} project planner scenario(s) failed: ${failures
        .map((item) => `${item.name} (${item.detail})`)
        .join("; ")}`,
    );
  }
}
