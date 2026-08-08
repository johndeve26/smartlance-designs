import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { NavDraftItem } from "@/lib/repositories/navigationRepository";
import { findActiveRedirect } from "@/lib/repositories/redirectsRepository";
import { normalizeInternalPath } from "@/lib/ops/url-safety";
import type {
  LinkHealthIssueType,
  LinkHealthSeverity,
  Prisma,
} from "@prisma/client";

type CollectedIssue = {
  type: LinkHealthIssueType;
  severity: LinkHealthSeverity;
  sourceType: string;
  sourceLabel: string;
  sourcePath?: string | null;
  targetPath?: string | null;
  message: string;
  fixHint?: string | null;
};

function flattenNav(items: NavDraftItem[]): NavDraftItem[] {
  const out: NavDraftItem[] = [];
  for (const item of items) {
    out.push(item);
    if (item.children?.length) out.push(...flattenNav(item.children));
  }
  return out;
}

async function pathExistsPublished(path: string): Promise<"ok" | "unpublished" | "missing"> {
  if (
    [
      "/",
      "/services",
      "/solutions",
      "/platforms",
      "/seo",
      "/work",
      "/about",
      "/pricing",
      "/contact",
      "/free-website-review",
      "/project-planner",
      "/industries",
      "/resources",
      "/blog",
      "/guides",
      "/compare",
      "/checklists",
      "/glossary",
      "/templates",
      "/tools",
      "/legal/terms-and-condition",
      "/legal/privacy-statement",
      "/legal/accessibility-statement",
    ].includes(path)
  ) {
    return "ok";
  }
  if (path.startsWith("/services/")) {
    const row = await prisma.service.findUnique({
      where: { slug: path.replace("/services/", "") },
    });
    if (!row) return "missing";
    return row.status === "PUBLISHED" ? "ok" : "unpublished";
  }
  if (path.startsWith("/solutions/")) {
    const row = await prisma.solution.findUnique({
      where: { slug: path.replace("/solutions/", "") },
    });
    if (!row) return "missing";
    return row.status === "PUBLISHED" ? "ok" : "unpublished";
  }
  if (path.startsWith("/platforms/")) {
    const row = await prisma.platform.findUnique({
      where: { slug: path.replace("/platforms/", "") },
    });
    if (!row) return "missing";
    return row.status === "PUBLISHED" ? "ok" : "unpublished";
  }
  if (path.startsWith("/work/")) {
    const row = await prisma.workProject.findUnique({
      where: { slug: path.replace("/work/", "") },
    });
    if (!row) return "missing";
    return row.status === "PUBLISHED" ? "ok" : "unpublished";
  }
  if (path.startsWith("/blog/")) {
    const row = await prisma.insight.findUnique({
      where: { slug: path.replace("/blog/", "") },
    });
    if (!row) return "missing";
    return row.status === "PUBLISHED" ? "ok" : "unpublished";
  }
  return "ok";
}

export async function runLinkHealthCheck(input?: { actorId?: string | null }) {
  if (!hasDatabaseUrl()) {
    throw new Error("Database not configured.");
  }

  const run = await prisma.linkHealthRun.create({
    data: {
      triggeredById: input?.actorId ?? null,
      summary: {},
    },
  });

  const issues: CollectedIssue[] = [];
  const linkedPaths = new Set<string>();

  const menus = await prisma.navigationMenu.findMany({
    where: { status: "PUBLISHED" },
  });
  for (const menu of menus) {
    const items = flattenNav((menu.publishedItems as NavDraftItem[]) || []);
    for (const item of items) {
      if (/^(https?:|mailto:|tel:)/i.test(item.href)) continue;
      const path = normalizeInternalPath(item.href);
      if (!path) {
        issues.push({
          type: "BROKEN",
          severity: "ERROR",
          sourceType: "navigation",
          sourceLabel: `${menu.menuKey}: ${item.label}`,
          sourcePath: item.href,
          message: "Invalid internal navigation href.",
          fixHint: "Open Navigation editor",
        });
        continue;
      }
      linkedPaths.add(path);
      const redirect = await findActiveRedirect(path);
      if (redirect) {
        issues.push({
          type: "REDIRECTING",
          severity: "WARNING",
          sourceType: "navigation",
          sourceLabel: `${menu.menuKey}: ${item.label}`,
          sourcePath: path,
          targetPath: redirect.destination,
          message: `Navigation points through redirect to ${redirect.destination}.`,
          fixHint: "Update destination to canonical path",
        });
      }
      const state = await pathExistsPublished(path);
      if (state === "missing") {
        issues.push({
          type: "BROKEN",
          severity: "ERROR",
          sourceType: "navigation",
          sourceLabel: `${menu.menuKey}: ${item.label}`,
          sourcePath: path,
          message: "Internal navigation destination not found.",
          fixHint: "Open Navigation editor",
        });
      } else if (state === "unpublished") {
        issues.push({
          type: "UNPUBLISHED_DESTINATION",
          severity: "ERROR",
          sourceType: "navigation",
          sourceLabel: `${menu.menuKey}: ${item.label}`,
          sourcePath: path,
          message: "Navigation points to unpublished content.",
          fixHint: "Publish destination or change link",
        });
      }
    }
  }

  // Industry → work relations
  const industryLinks = await prisma.industryWork.findMany({
    include: {
      industry: { select: { name: true, slug: true, status: true } },
      work: { select: { name: true, slug: true, status: true } },
    },
  });
  for (const link of industryLinks) {
    if (link.industry.status === "PUBLISHED" && link.work.status !== "PUBLISHED") {
      issues.push({
        type: "INVALID_RELATION",
        severity: "WARNING",
        sourceType: "industry-work",
        sourceLabel: link.industry.name,
        sourcePath: `/industries/${link.industry.slug}`,
        targetPath: `/work/${link.work.slug}`,
        message: `Industry links to ${link.work.status.toLowerCase()} work “${link.work.name}”.`,
        fixHint: "View Relations / Work editor",
      });
    }
  }

  // Orphan warnings for strategically important routes only (not every service/glossary)
  const importantRoutes: Array<{ path: string; label: string; type: string }> = [
    { path: "/pricing", label: "Pricing", type: "pricing" },
    { path: "/project-planner", label: "Project Planner", type: "project-planner" },
    { path: "/free-website-review", label: "Free Website Review", type: "free-review" },
    { path: "/contact", label: "Contact", type: "contact" },
    { path: "/work", label: "Work", type: "work" },
    { path: "/resources", label: "Resources", type: "resources" },
  ];
  for (const route of importantRoutes) {
    if (!linkedPaths.has(route.path)) {
      issues.push({
        type: "ORPHAN",
        severity: "WARNING",
        sourceType: route.type,
        sourceLabel: route.label,
        sourcePath: route.path,
        message: `Important page “${route.label}” has no inbound link from published navigation/footer.`,
        fixHint: "Add to header or footer navigation",
      });
    }
  }

  const featuredWork = await prisma.workProject.findMany({
    where: { status: "PUBLISHED", OR: [{ featured: true }, { featuredHomepage: true }] },
    select: { name: true, slug: true },
  });
  for (const s of featuredWork) {
    const route = `/work/${s.slug}`;
    if (!linkedPaths.has(route) && !linkedPaths.has("/work")) {
      issues.push({
        type: "ORPHAN",
        severity: "INFO",
        sourceType: "work",
        sourceLabel: s.name,
        sourcePath: route,
        message: "Featured work is not linked from navigation (Work hub may still surface it).",
      });
    }
  }

  const summary = {
    broken: issues.filter((i) => i.type === "BROKEN").length,
    redirecting: issues.filter((i) => i.type === "REDIRECTING").length,
    unpublished: issues.filter((i) => i.type === "UNPUBLISHED_DESTINATION").length,
    orphan: issues.filter((i) => i.type === "ORPHAN").length,
    invalidRelation: issues.filter((i) => i.type === "INVALID_RELATION").length,
    total: issues.length,
  };

  if (issues.length) {
    await prisma.linkHealthIssue.createMany({
      data: issues.map((i) => ({
        runId: run.id,
        type: i.type,
        severity: i.severity,
        sourceType: i.sourceType,
        sourceLabel: i.sourceLabel,
        sourcePath: i.sourcePath ?? null,
        targetPath: i.targetPath ?? null,
        message: i.message,
        fixHint: i.fixHint ?? null,
      })),
    });
  }

  const completed = await prisma.linkHealthRun.update({
    where: { id: run.id },
    data: {
      completedAt: new Date(),
      summary: summary as unknown as Prisma.InputJsonValue,
    },
    include: { issues: true },
  });

  return completed;
}

export async function getLatestLinkHealthRun() {
  if (!hasDatabaseUrl()) return null;
  return prisma.linkHealthRun.findFirst({
    orderBy: { startedAt: "desc" },
    include: {
      issues: { orderBy: [{ severity: "asc" }, { createdAt: "asc" }] },
    },
  });
}
