import type { NavigationMenuKey, PublishStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  CACHE_TAGS,
  createContentRevision,
  revalidateNavigation,
} from "@/lib/admin/publishing";
import { isSafePublicUrl, normalizeInternalPath } from "@/lib/ops/url-safety";
import { findActiveRedirect } from "@/lib/repositories/redirectsRepository";
import { unstable_cache } from "next/cache";
import {
  footerNavigation,
  mainNavigation,
  primaryCta,
} from "@/data/navigation";

export type NavDraftItem = {
  id?: string;
  label: string;
  href: string;
  description?: string | null;
  displayOrder: number;
  external?: boolean;
  openInNewTab?: boolean;
  children?: NavDraftItem[];
};

export type NavValidationIssue = {
  severity: "error" | "warning";
  label: string;
  href: string;
  message: string;
  canonicalHref?: string;
};

const MENU_LABELS: Record<NavigationMenuKey, string> = {
  HEADER_PRIMARY: "Header primary",
  HEADER_RESOURCES: "Header resources",
  HEADER_SERVICES: "Header services",
  HEADER_SEO: "Header SEO",
  HEADER_PLATFORMS: "Header platforms",
  HEADER_CTA: "Header primary CTA",
  FOOTER_SERVICES: "Footer services",
  FOOTER_SEO: "Footer SEO",
  FOOTER_PLATFORMS: "Footer platforms",
  FOOTER_COMPANY: "Footer company",
  FOOTER_RESOURCES: "Footer resources",
  FOOTER_LEGAL: "Footer legal",
};

export function navigationMenuLabel(key: NavigationMenuKey) {
  return MENU_LABELS[key];
}

function flattenItems(items: NavDraftItem[], out: NavDraftItem[] = []) {
  for (const item of items) {
    out.push(item);
    if (item.children?.length) flattenItems(item.children, out);
  }
  return out;
}

export async function listNavigationMenus() {
  if (!hasDatabaseUrl()) return [];
  return prisma.navigationMenu.findMany({ orderBy: { menuKey: "asc" } });
}

export async function getNavigationMenu(menuKey: NavigationMenuKey) {
  if (!hasDatabaseUrl()) return null;
  return prisma.navigationMenu.findUnique({ where: { menuKey } });
}

export async function saveNavigationDraft(input: {
  menuKey: NavigationMenuKey;
  items: NavDraftItem[];
  actorId: string;
}) {
  for (const item of flattenItems(input.items)) {
    if (!item.label.trim()) throw new Error("Navigation labels are required.");
    if (!isSafePublicUrl(item.href)) {
      throw new Error(`Unsafe navigation URL rejected: ${item.href}`);
    }
  }
  const menu = await prisma.navigationMenu.upsert({
    where: { menuKey: input.menuKey },
    create: {
      menuKey: input.menuKey,
      label: MENU_LABELS[input.menuKey],
      status: "DRAFT",
      draftItems: input.items as unknown as Prisma.InputJsonValue,
      publishedItems: [],
      updatedById: input.actorId,
    },
    update: {
      draftItems: input.items as unknown as Prisma.InputJsonValue,
      status: "DRAFT",
      updatedById: input.actorId,
      version: { increment: 1 },
    },
  });
  await createContentRevision({
    entityType: "NavigationMenu",
    entityId: menu.id,
    snapshot: {
      menuKey: menu.menuKey,
      draftItems: menu.draftItems,
      publishedItems: menu.publishedItems,
      status: menu.status,
      version: menu.version,
    },
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "navigation_change",
    entityType: "NavigationMenu",
    entityId: menu.id,
    metadata: { menuKey: input.menuKey, version: menu.version },
  });
  return menu;
}

export async function validateNavigationItems(
  items: NavDraftItem[],
): Promise<NavValidationIssue[]> {
  const issues: NavValidationIssue[] = [];
  for (const item of flattenItems(items)) {
    if (item.external || /^(https?:|mailto:|tel:)/i.test(item.href)) {
      if (!isSafePublicUrl(item.href)) {
        issues.push({
          severity: "error",
          label: item.label,
          href: item.href,
          message: "Unsafe external URL scheme.",
        });
      }
      continue;
    }
    const path = normalizeInternalPath(item.href);
    if (!path) {
      issues.push({
        severity: "error",
        label: item.label,
        href: item.href,
        message: "Internal path must start with /.",
      });
      continue;
    }
    const redirect = await findActiveRedirect(path);
    if (redirect) {
      issues.push({
        severity: "warning",
        label: item.label,
        href: path,
        message: `Points to a redirect → ${redirect.destination}. Prefer the canonical destination.`,
        canonicalHref: redirect.destination,
      });
    }
    const published = await isPublishedInternalPath(path);
    if (published === "unpublished") {
      issues.push({
        severity: "error",
        label: item.label,
        href: path,
        message: "Destination content is not published.",
      });
    } else if (published === "unknown" && !KNOWN_STATIC_ROUTES.has(path)) {
      issues.push({
        severity: "warning",
        label: item.label,
        href: path,
        message: "Destination is not a known published CMS route.",
      });
    }
  }
  return issues;
}

const KNOWN_STATIC_ROUTES = new Set([
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
  "/sitemap.xml",
]);

async function isPublishedInternalPath(
  path: string,
): Promise<"published" | "unpublished" | "unknown" | "static"> {
  if (KNOWN_STATIC_ROUTES.has(path)) return "static";
  if (path.startsWith("/services/")) {
    const slug = path.replace("/services/", "");
    const row = await prisma.service.findUnique({ where: { slug } });
    if (!row) return "unknown";
    return row.status === "PUBLISHED" ? "published" : "unpublished";
  }
  if (path.startsWith("/solutions/")) {
    const slug = path.replace("/solutions/", "");
    const row = await prisma.solution.findUnique({ where: { slug } });
    if (!row) return "unknown";
    return row.status === "PUBLISHED" ? "published" : "unpublished";
  }
  if (path.startsWith("/platforms/")) {
    const slug = path.replace("/platforms/", "");
    const row = await prisma.platform.findUnique({ where: { slug } });
    if (!row) return "unknown";
    return row.status === "PUBLISHED" ? "published" : "unpublished";
  }
  if (path.startsWith("/work/")) {
    const slug = path.replace("/work/", "");
    const row = await prisma.workProject.findUnique({ where: { slug } });
    if (!row) return "unknown";
    return row.status === "PUBLISHED" ? "published" : "unpublished";
  }
  if (path.startsWith("/industries/")) {
    const slug = path.replace("/industries/", "");
    const row = await prisma.industry.findUnique({ where: { slug } });
    if (!row) return "unknown";
    return row.status === "PUBLISHED" ? "published" : "unpublished";
  }
  if (path.startsWith("/blog/")) {
    const slug = path.replace("/blog/", "");
    const row = await prisma.insight.findUnique({ where: { slug } });
    if (!row) return "unknown";
    return row.status === "PUBLISHED" ? "published" : "unpublished";
  }
  if (path.startsWith("/seo/")) {
    const slug = path.replace("/seo/", "");
    const row = await prisma.service.findFirst({
      where: { OR: [{ slug }, { href: path }] },
    });
    if (!row) return "unknown";
    return row.status === "PUBLISHED" ? "published" : "unpublished";
  }
  return "unknown";
}

export async function publishNavigationMenu(input: {
  menuKey: NavigationMenuKey;
  actorId: string;
  allowWarnings?: boolean;
}) {
  const menu = await prisma.navigationMenu.findUnique({
    where: { menuKey: input.menuKey },
  });
  if (!menu) throw new Error("Navigation menu not found.");
  const draft = (menu.draftItems as NavDraftItem[]) || [];
  const issues = await validateNavigationItems(draft);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length) {
    throw new Error(
      `Cannot publish: ${errors.length} invalid navigation link(s). ${errors[0].message}`,
    );
  }
  const updated = await prisma.navigationMenu.update({
    where: { id: menu.id },
    data: {
      publishedItems: menu.draftItems as Prisma.InputJsonValue,
      status: "PUBLISHED" satisfies PublishStatus,
      publishedAt: new Date(),
      updatedById: input.actorId,
      version: { increment: 1 },
    },
  });
  await createContentRevision({
    entityType: "NavigationMenu",
    entityId: menu.id,
    snapshot: {
      menuKey: updated.menuKey,
      publishedItems: updated.publishedItems,
      status: updated.status,
      version: updated.version,
    },
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "navigation_publish",
    entityType: "NavigationMenu",
    entityId: menu.id,
    metadata: {
      menuKey: input.menuKey,
      warnings: issues.filter((i) => i.severity === "warning").length,
    },
  });
  revalidateNavigation();
  return { menu: updated, issues };
}

export type PublicNavigationBundle = {
  mainNavigation: typeof mainNavigation;
  footerNavigation: typeof footerNavigation;
  primaryCta: { label: string; href: string };
  fromDb: boolean;
};

function itemsToNavTree(items: NavDraftItem[]): typeof mainNavigation {
  return items.map((item) => ({
    label: item.label,
    href: item.href,
    description: item.description || undefined,
    children: item.children?.length
      ? item.children.map((c) => ({
          label: c.label,
          href: c.href,
          description: c.description || undefined,
        }))
      : undefined,
  })) as typeof mainNavigation;
}

async function loadPublicNavigationUncached(): Promise<PublicNavigationBundle> {
  if (!hasDatabaseUrl()) {
    return {
      mainNavigation,
      footerNavigation,
      primaryCta,
      fromDb: false,
    };
  }
  const menus = await prisma.navigationMenu.findMany({
    where: { status: "PUBLISHED" },
  });
  if (!menus.length) {
    return {
      mainNavigation,
      footerNavigation,
      primaryCta,
      fromDb: false,
    };
  }
  const byKey = Object.fromEntries(menus.map((m) => [m.menuKey, m]));
  const header = byKey.HEADER_PRIMARY
    ? itemsToNavTree((byKey.HEADER_PRIMARY.publishedItems as NavDraftItem[]) || [])
    : mainNavigation;
  const ctaItems = (byKey.HEADER_CTA?.publishedItems as NavDraftItem[]) || [];
  const cta = ctaItems[0]
    ? { label: ctaItems[0].label, href: ctaItems[0].href }
    : primaryCta;

  const footer = {
    services:
      mapFooter(byKey.FOOTER_SERVICES) || footerNavigation.services,
    aiAutomation: footerNavigation.aiAutomation,
    solutions: footerNavigation.solutions,
    work: footerNavigation.work,
    platforms: footerNavigation.platforms,
    company:
      mapFooter(byKey.FOOTER_COMPANY) || footerNavigation.company,
    resources:
      mapFooter(byKey.FOOTER_RESOURCES) || footerNavigation.resources,
    legal: mapFooter(byKey.FOOTER_LEGAL) || footerNavigation.legal,
  };

  return {
    mainNavigation: header,
    footerNavigation: footer,
    primaryCta: cta,
    fromDb: true,
  };
}

function mapFooter(menu?: { publishedItems: Prisma.JsonValue }) {
  if (!menu) return null;
  const items = (menu.publishedItems as NavDraftItem[]) || [];
  if (!items.length) return null;
  return items.map((i) => ({ label: i.label, href: i.href }));
}

export async function getPublicNavigation(): Promise<PublicNavigationBundle> {
  if (!hasDatabaseUrl()) {
    return {
      mainNavigation,
      footerNavigation,
      primaryCta,
      fromDb: false,
    };
  }
  return unstable_cache(loadPublicNavigationUncached, ["public-navigation"], {
    tags: [CACHE_TAGS.navigation],
    revalidate: 300,
  })();
}

export async function seedNavigationFromCode(input?: {
  actorId?: string | null;
  force?: boolean;
}) {
  const existing = await prisma.navigationMenu.count();
  if (existing > 0 && !input?.force) {
    return { imported: 0, skipped: true };
  }

  const specs: Array<{ key: NavigationMenuKey; items: NavDraftItem[] }> = [
    {
      key: "HEADER_PRIMARY",
      items: mainNavigation.map((item, i) => ({
        label: item.label,
        href: item.href,
        displayOrder: i,
        description: undefined,
        children: item.children?.map((c, j) => ({
          label: c.label,
          href: c.href,
          description: c.description,
          displayOrder: j,
        })),
      })),
    },
    {
      key: "HEADER_CTA",
      items: [
        {
          label: primaryCta.label,
          href: primaryCta.href,
          displayOrder: 0,
        },
      ],
    },
    {
      key: "FOOTER_SERVICES",
      items: footerNavigation.services.map((l, i) => ({
        label: l.label,
        href: l.href,
        displayOrder: i,
      })),
    },
    {
      key: "FOOTER_COMPANY",
      items: footerNavigation.company.map((l, i) => ({
        label: l.label,
        href: l.href,
        displayOrder: i,
      })),
    },
    {
      key: "FOOTER_RESOURCES",
      items: footerNavigation.resources.map((l, i) => ({
        label: l.label,
        href: l.href,
        displayOrder: i,
      })),
    },
    {
      key: "FOOTER_LEGAL",
      items: footerNavigation.legal.map((l, i) => ({
        label: l.label,
        href: l.href,
        displayOrder: i,
      })),
    },
  ];

  let imported = 0;
  for (const spec of specs) {
    await prisma.navigationMenu.upsert({
      where: { menuKey: spec.key },
      create: {
        menuKey: spec.key,
        label: MENU_LABELS[spec.key],
        status: "PUBLISHED",
        draftItems: spec.items as unknown as Prisma.InputJsonValue,
        publishedItems: spec.items as unknown as Prisma.InputJsonValue,
        publishedAt: new Date(),
        updatedById: input?.actorId ?? null,
      },
      update: input?.force
        ? {
            draftItems: spec.items as unknown as Prisma.InputJsonValue,
            publishedItems: spec.items as unknown as Prisma.InputJsonValue,
            status: "PUBLISHED",
            publishedAt: new Date(),
            updatedById: input?.actorId ?? null,
          }
        : {},
    });
    imported += 1;
  }
  return { imported, skipped: false };
}
