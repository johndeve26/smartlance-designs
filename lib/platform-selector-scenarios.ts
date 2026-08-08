/**
 * Deterministic scenario assertions for the Website Platform Selector.
 * No test framework required — call assertPlatformSelectorScenarios() or
 * runScenarioAssertions() from a Node script.
 */

import { evaluatePlatformSelector } from "@/lib/platform-selector";
import type { PlatformSelectorSlug } from "@/data/tools/platform-selector-candidates";

export type PlatformSelectorScenario = {
  name: string;
  answers: Record<string, string>;
  assert: (result: ReturnType<typeof evaluatePlatformSelector>) => string | null;
};

function primarySlugs(
  result: ReturnType<typeof evaluatePlatformSelector>,
): PlatformSelectorSlug[] {
  return result.recommendations
    .filter((item) => item.tier === "primary")
    .map((item) => item.slug);
}

function allSlugs(
  result: ReturnType<typeof evaluatePlatformSelector>,
): PlatformSelectorSlug[] {
  return result.recommendations.map((item) => item.slug);
}

function topIncludesOneOf(
  result: ReturnType<typeof evaluatePlatformSelector>,
  allowed: PlatformSelectorSlug[],
): boolean {
  return allSlugs(result).some((slug) => allowed.includes(slug));
}

export const platformSelectorScenarios: PlatformSelectorScenario[] = [
  {
    name: "service-business-no-commerce",
    answers: {
      "website-type": "service-business",
      "project-context": "no",
      commerce: "none",
      content: "pages-blog",
      "design-workflow": "custom-design-matters",
      "custom-functionality": "standard",
      integrations: "standard",
      "team-workflow": "marketing-content",
      maintenance: "platform-handles",
      "hosting-control": "not-important",
    },
    assert: (result) => {
      const primary = primarySlugs(result);
      if (primary.includes("shopify")) {
        return "Shopify should not be primary for a no-commerce service site";
      }
      if (allSlugs(result).includes("shopify")) {
        return "Shopify should not appear when commerce is none";
      }
      const allowed: PlatformSelectorSlug[] = [
        "webflow",
        "wordpress",
        "wix-studio",
        "squarespace",
      ];
      if (!topIncludesOneOf(result, allowed)) {
        return `Expected one of ${allowed.join(", ")} in recommendations; got ${allSlugs(result).join(", ")}`;
      }
      return null;
    },
  },
  {
    name: "content-heavy-custom-developer-hosting",
    answers: {
      "website-type": "content-heavy",
      "project-context": "redesigning-existing",
      commerce: "none",
      content: "large-complex",
      "design-workflow": "developer-handles",
      "custom-functionality": "significant-custom",
      integrations: "several-important",
      "hubspot-usage": "no",
      "team-workflow": "developer",
      maintenance: "max-control",
      "hosting-control": "very-important",
    },
    assert: (result) => {
      if (!allSlugs(result).includes("wordpress")) {
        return `WordPress should surface strongly; got ${allSlugs(result).join(", ")}`;
      }
      return null;
    },
  },
  {
    name: "commerce-first-managed",
    answers: {
      "website-type": "online-store",
      "project-context": "no",
      commerce: "major-commerce",
      content: "few-static",
      "design-workflow": "basic-ok",
      "custom-functionality": "standard",
      integrations: "standard",
      "team-workflow": "owner",
      maintenance: "platform-handles",
      "hosting-control": "not-important",
    },
    assert: (result) => {
      if (!allSlugs(result).includes("shopify")) {
        return `Shopify should surface strongly; got ${allSlugs(result).join(", ")}`;
      }
      const shopify = result.recommendations.find((item) => item.slug === "shopify");
      if (!shopify || (shopify.tier !== "primary" && shopify.tier !== "also")) {
        return "Shopify should be primary or also-consider";
      }
      return null;
    },
  },
  {
    name: "commerce-plus-content-flexibility",
    answers: {
      "website-type": "online-store",
      "project-context": "changing-platform",
      commerce: "major-commerce",
      content: "large-complex",
      "design-workflow": "developer-handles",
      "custom-functionality": "significant-custom",
      integrations: "several-important",
      "hubspot-usage": "no",
      "team-workflow": "developer",
      maintenance: "manage-with-support",
      "hosting-control": "some-flexibility",
    },
    assert: (result) => {
      if (!allSlugs(result).includes("woocommerce")) {
        return `WooCommerce should surface; got ${allSlugs(result).join(", ")}`;
      }
      return null;
    },
  },
  {
    name: "visual-marketing-site",
    answers: {
      "website-type": "marketing-company",
      "project-context": "no",
      commerce: "none",
      content: "pages-blog",
      "design-workflow": "marketing-frequent-layouts",
      "custom-functionality": "standard",
      integrations: "very-little",
      "team-workflow": "designer",
      maintenance: "platform-handles",
      "hosting-control": "not-important",
    },
    assert: (result) => {
      const visual: PlatformSelectorSlug[] = ["webflow", "framer", "wix-studio"];
      if (!topIncludesOneOf(result, visual)) {
        return `Expected one of ${visual.join(", ")} among top; got ${allSlugs(result).join(", ")}`;
      }
      return null;
    },
  },
  {
    name: "hubspot-deep-usage",
    answers: {
      "website-type": "marketing-company",
      "project-context": "no",
      commerce: "none",
      content: "pages-blog",
      "design-workflow": "basic-ok",
      "custom-functionality": "standard",
      integrations: "several-important",
      "hubspot-usage": "yes",
      "team-workflow": "marketing-content",
      maintenance: "platform-handles",
      "hosting-control": "not-important",
    },
    assert: (result) => {
      if (!allSlugs(result).includes("hubspot-cms")) {
        return `HubSpot CMS should appear in recommendations; got ${allSlugs(result).join(", ")}`;
      }
      return null;
    },
  },
  {
    name: "complex-backend",
    answers: {
      "website-type": "marketing-company",
      "project-context": "no",
      commerce: "none",
      content: "structured-types",
      "design-workflow": "developer-handles",
      "custom-functionality": "complex-backend",
      integrations: "deep-specialized",
      "hubspot-usage": "no",
      "team-workflow": "developer",
      maintenance: "max-control",
      "hosting-control": "very-important",
    },
    assert: (result) => {
      if (!result.needsCustomArchitecture) {
        return "needsCustomArchitecture should be true for complex-backend";
      }
      const lightPrimary = primarySlugs(result).some((slug) =>
        (["framer", "squarespace", "wix-studio"] as PlatformSelectorSlug[]).includes(
          slug,
        ),
      );
      if (lightPrimary) {
        return "Framer/Squarespace/Wix Studio should not be primary for complex backends";
      }
      return null;
    },
  },
  {
    name: "all-not-sure",
    answers: {
      "website-type": "not-sure",
      "project-context": "not-sure",
      commerce: "not-sure",
      content: "not-sure",
      "design-workflow": "not-sure",
      "custom-functionality": "not-sure",
      integrations: "not-sure",
      "team-workflow": "not-sure",
      maintenance: "not-sure",
      "hosting-control": "not-sure",
    },
    assert: (result) => {
      if (!result.lowConfidence) {
        return "lowConfidence should be true when most answers are not-sure";
      }
      if (!result.related.showProjectBrief) {
        return "showProjectBrief should be true for low-confidence results";
      }
      return null;
    },
  },
];

export function assertPlatformSelectorScenarios(): {
  name: string;
  ok: boolean;
  detail: string;
}[] {
  return platformSelectorScenarios.map((scenario) => {
    try {
      const result = evaluatePlatformSelector(scenario.answers);
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
  const results = assertPlatformSelectorScenarios();
  const failures = results.filter((item) => !item.ok);
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} platform selector scenario(s) failed: ${failures
        .map((item) => `${item.name} (${item.detail})`)
        .join("; ")}`,
    );
  }
}
