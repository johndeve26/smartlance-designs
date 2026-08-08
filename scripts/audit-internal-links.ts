/**
 * Development-time internal link / orphan audit.
 * Run: npx tsx scripts/audit-internal-links.ts
 *
 * Counts contextual body relationships from the registry + known data fields.
 * Header/footer/sitemap alone do not count as healthy inbound.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  industryToSolutions,
  serviceToSolutions,
  solutionJourney,
  SITE_ROUTES,
  platformConnections,
} from "../data/site-relationships";
import { getPublishedSolutions } from "../data/solutions";
import { services } from "../data/services";
import { platforms } from "../data/platforms";
import { getVisibleProjects } from "../data/portfolio";
import { getPublishedGuides } from "../data/guides";
import { getPublishedChecklists } from "../data/checklists";
import { getPublishedComparisons } from "../data/comparisons";
import { getPublishedGlossaryEntries } from "../data/glossary";
import { getPublishedTemplates } from "../data/templates";
import { getPublishedTools } from "../data/tools";
import { seoServices } from "../data/seo";

type RouteRecord = {
  route: string;
  family: string;
  inbound: string[];
  outbound: string[];
};

const routes = new Map<string, RouteRecord>();

function ensure(route: string, family: string) {
  if (!routes.has(route)) {
    routes.set(route, { route, family, inbound: [], outbound: [] });
  }
  return routes.get(route)!;
}

function link(from: string, to: string, fromFamily: string, toFamily: string) {
  const a = ensure(from, fromFamily);
  const b = ensure(to, toFamily);
  if (!a.outbound.includes(to)) a.outbound.push(to);
  if (!b.inbound.includes(from)) b.inbound.push(from);
}

// Seed major hubs
for (const [route, family] of Object.entries({
  "/": "home",
  [SITE_ROUTES.services]: "services",
  [SITE_ROUTES.solutions]: "solutions",
  [SITE_ROUTES.platforms]: "platforms",
  [SITE_ROUTES.industries]: "industries",
  [SITE_ROUTES.work]: "work",
  [SITE_ROUTES.resources]: "resources",
  [SITE_ROUTES.pricing]: "pricing",
  [SITE_ROUTES.planner]: "planner",
  [SITE_ROUTES.freeReview]: "review",
  [SITE_ROUTES.contact]: "contact",
  [SITE_ROUTES.about]: "about",
  [SITE_ROUTES.seo]: "seo",
  [SITE_ROUTES.projectBrief]: "template",
  [SITE_ROUTES.platformSelector]: "tool",
  [SITE_ROUTES.redesignGuide]: "guide",
  [SITE_ROUTES.redesignChecklist]: "checklist",
  [SITE_ROUTES.wordpressVsWebflow]: "comparison",
})) {
  ensure(route, family);
}

// Homepage → major systems
for (const to of [
  SITE_ROUTES.services,
  SITE_ROUTES.solutions,
  SITE_ROUTES.work,
  SITE_ROUTES.industries,
  SITE_ROUTES.resources,
  SITE_ROUTES.contact,
  SITE_ROUTES.planner,
  SITE_ROUTES.freeReview,
  SITE_ROUTES.seo,
  SITE_ROUTES.platforms,
  SITE_ROUTES.about,
]) {
  link("/", to, "home", ensure(to, "hub").family);
}

for (const solution of getPublishedSolutions()) {
  const href = `/solutions/${solution.slug}`;
  ensure(href, "solution");
  link(SITE_ROUTES.solutions, href, "solutions", "solution");
  const journey = solutionJourney[solution.slug];
  if (journey) {
    for (const s of journey.services) {
      link(href, s.href, "solution", s.href.startsWith("/seo") ? "seo" : "service");
    }
    for (const r of journey.resources ?? []) {
      link(href, r.href, "solution", "resource");
    }
    if (journey.existingSiteAction) {
      link(href, SITE_ROUTES.freeReview, "solution", "review");
    }
    if (journey.planningAction) {
      link(href, SITE_ROUTES.planner, "solution", "planner");
    }
  }
  link(href, SITE_ROUTES.contact, "solution", "contact");
}

for (const [serviceHref, sols] of Object.entries(serviceToSolutions)) {
  ensure(serviceHref, serviceHref.startsWith("/seo") ? "seo" : "service");
  for (const sol of sols) {
    link(serviceHref, sol.href, "service", "solution");
  }
}

for (const service of services) {
  ensure(service.href, "service");
  link(SITE_ROUTES.services, service.href, "services", "service");
  link(service.href, SITE_ROUTES.contact, "service", "contact");
}

for (const seo of seoServices) {
  ensure(seo.href, "seo");
  link(SITE_ROUTES.seo, seo.href, "seo", "seo");
}

for (const platform of platforms) {
  ensure(platform.href, "platform");
  link(SITE_ROUTES.platforms, platform.href, "platforms", "platform");
  const conn = platformConnections[platform.slug];
  if (conn?.showSelector !== false) {
    link(platform.href, SITE_ROUTES.platformSelector, "platform", "tool");
  }
  if (conn?.comparisonHref) {
    link(platform.href, conn.comparisonHref, "platform", "comparison");
  }
  for (const href of platform.relatedServiceHrefs.slice(0, 4)) {
    link(platform.href, href, "platform", "service");
  }
  link(platform.href, SITE_ROUTES.contact, "platform", "contact");
}

for (const [slug, sols] of Object.entries(industryToSolutions)) {
  for (const sol of sols) {
    link(SITE_ROUTES.industries, sol.href, "industries", "solution");
  }
  void slug;
}

for (const project of getVisibleProjects()) {
  const href = `/work/${project.slug}`;
  ensure(href, "work");
  link(SITE_ROUTES.work, href, "work", "work");
  for (const s of (project.relatedServiceHrefs ?? []).slice(0, 4)) {
    link(href, s, "work", "service");
  }
  link(href, SITE_ROUTES.contact, "work", "contact");
}

for (const guide of getPublishedGuides()) {
  const href = `/guides/${guide.slug}`;
  ensure(href, "guide");
  for (const s of (guide.relatedSolutionSlugs ?? []).slice(0, 3)) {
    link(href, `/solutions/${s}`, "guide", "solution");
  }
  for (const s of (guide.relatedServiceHrefs ?? []).slice(0, 4)) {
    link(href, s, "guide", "service");
  }
}

for (const checklist of getPublishedChecklists()) {
  const href = `/checklists/${checklist.slug}`;
  ensure(href, "checklist");
  for (const s of (checklist.relatedSolutionSlugs ?? []).slice(0, 3)) {
    link(href, `/solutions/${s}`, "checklist", "solution");
  }
}

for (const comparison of getPublishedComparisons()) {
  const href = `/compare/${comparison.slug}`;
  ensure(href, "comparison");
  link(href, SITE_ROUTES.platformSelector, "comparison", "tool");
  for (const s of (comparison.relatedPlatformSlugs ?? []).slice(0, 3)) {
    link(href, `/platforms/${s}`, "comparison", "platform");
  }
}

for (const entry of getPublishedGlossaryEntries()) {
  const href = `/glossary/${entry.slug}`;
  ensure(href, "glossary");
  for (const s of (entry.relatedSolutionSlugs ?? []).slice(0, 2)) {
    link(href, `/solutions/${s}`, "glossary", "solution");
  }
  for (const s of (entry.relatedSeoHrefs ?? []).slice(0, 2)) {
    link(href, s, "glossary", "seo");
  }
  for (const s of (entry.relatedServiceHrefs ?? []).slice(0, 2)) {
    link(href, s, "glossary", "service");
  }
}

for (const template of getPublishedTemplates()) {
  ensure(`/templates/${template.slug}`, "template");
  link(
    `/templates/${template.slug}`,
    SITE_ROUTES.planner,
    "template",
    "planner",
  );
  link(
    `/templates/${template.slug}`,
    SITE_ROUTES.platformSelector,
    "template",
    "tool",
  );
  link(`/templates/${template.slug}`, SITE_ROUTES.pricing, "template", "pricing");
  link(`/templates/${template.slug}`, SITE_ROUTES.contact, "template", "contact");
}

for (const tool of getPublishedTools()) {
  ensure(`/tools/${tool.slug}`, "tool");
  link(SITE_ROUTES.platforms, `/tools/${tool.slug}`, "platforms", "tool");
}

// Pricing bridges
link(SITE_ROUTES.pricing, SITE_ROUTES.planner, "pricing", "planner");
link(SITE_ROUTES.pricing, SITE_ROUTES.projectBrief, "pricing", "template");
link(SITE_ROUTES.pricing, SITE_ROUTES.platformSelector, "pricing", "tool");
link(SITE_ROUTES.pricing, SITE_ROUTES.freeReview, "pricing", "review");
link(SITE_ROUTES.pricing, SITE_ROUTES.contact, "pricing", "contact");

const all = [...routes.values()].sort((a, b) => a.route.localeCompare(b.route));
const zero = all.filter((r) => r.inbound.length === 0);
const one = all.filter((r) => r.inbound.length === 1);
const healthy = all.filter((r) => r.inbound.length >= 2);

const report = `# Internal Link Audit

Generated: ${new Date().toISOString().slice(0, 10)}

Contextual inbound only (registry + entity related fields + hub seeds).
Header / footer / sitemap are **not** counted.

## Summary

| Bucket | Count |
| --- | ---: |
| 0 contextual inbound | ${zero.length} |
| 1 contextual inbound | ${one.length} |
| 2+ contextual inbound | ${healthy.length} |
| Routes tracked | ${all.length} |

## Zero contextual inbound

${zero.length === 0 ? "_None in this pass._" : zero.map((r) => `- \`${r.route}\` (${r.family})`).join("\n")}

## Single contextual inbound

${one.map((r) => `- \`${r.route}\` ← ${r.inbound.map((x) => `\`${x}\``).join(", ")}`).join("\n") || "_None._"}

## Notes

- Glossary terms are expected to have fewer homepage-level inbound links; educational reverse links from Guides/SEO matter more.
- Specialist platforms (Salesforce, Clixlo) intentionally stay lightly linked from Selector flows.
- This report is guidance for connection quality — not a minimum-link quota.

## Source

\`scripts/audit-internal-links.ts\` · \`data/site-relationships.ts\`
`;

const out = join(process.cwd(), "INTERNAL_LINK_AUDIT.md");
writeFileSync(out, report, "utf8");
console.log(report);
console.log(`\nWrote ${out}`);
