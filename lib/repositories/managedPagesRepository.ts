import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { PublishStatus } from "@prisma/client";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { createContentRevision } from "@/lib/admin/publishing";
import type { Prisma } from "@prisma/client";

export const KNOWN_MANAGED_PAGES: Array<{
  key: string;
  route: string;
  displayName: string;
  seoTitle?: string;
  seoDescription?: string;
}> = [
  {
    key: "about",
    route: "/about",
    displayName: "About",
    seoTitle: "About Smartlance Designs",
    seoDescription:
      "Learn how Smartlance Designs builds websites and SEO strategies that help businesses get found and convert.",
  },
  {
    key: "contact",
    route: "/contact",
    displayName: "Contact",
    seoTitle: "Contact Smartlance Designs",
    seoDescription:
      "Tell us about your website project. We respond with clear next steps for design, development and SEO.",
  },
  {
    key: "pricing",
    route: "/pricing",
    displayName: "Pricing",
    seoTitle: "Website Project Pricing",
    seoDescription:
      "How Smartlance Designs scopes website and SEO projects — transparent process without vanity price lists.",
  },
  {
    key: "project-planner",
    route: "/project-planner",
    displayName: "Project Planner",
    seoTitle: "Website Project Planner",
    seoDescription:
      "Clarify your website goals, scope and priorities before you enquire.",
  },
  {
    key: "free-website-review",
    route: "/free-website-review",
    displayName: "Free Website Review",
    seoTitle: "Free Website Review",
    seoDescription:
      "Request a free website review focused on clarity, conversion and search visibility.",
  },
  {
    key: "resources",
    route: "/resources",
    displayName: "Resources",
    seoTitle: "Website Resources",
    seoDescription:
      "Guides, checklists, comparisons, templates and tools for clearer website decisions.",
  },
  {
    key: "legal-terms",
    route: "/legal/terms-and-condition",
    displayName: "Terms",
  },
  {
    key: "legal-privacy",
    route: "/legal/privacy-statement",
    displayName: "Privacy",
  },
  {
    key: "legal-accessibility",
    route: "/legal/accessibility-statement",
    displayName: "Accessibility",
  },
];

export async function listManagedPages() {
  if (!hasDatabaseUrl()) return [];
  return prisma.managedPage.findMany({ orderBy: { route: "asc" } });
}

export async function getManagedPageByKey(key: string) {
  if (!hasDatabaseUrl()) return null;
  return prisma.managedPage.findUnique({ where: { key } });
}

export async function seedKnownManagedPages(force = false) {
  let created = 0;
  for (const page of KNOWN_MANAGED_PAGES) {
    const existing = await prisma.managedPage.findUnique({
      where: { key: page.key },
    });
    if (existing && !force) continue;
    await prisma.managedPage.upsert({
      where: { key: page.key },
      create: {
        key: page.key,
        route: page.route,
        displayName: page.displayName,
        seoTitle: page.seoTitle ?? null,
        seoDescription: page.seoDescription ?? null,
        status: "PUBLISHED",
      },
      update: force
        ? {
            route: page.route,
            displayName: page.displayName,
            seoTitle: page.seoTitle ?? null,
            seoDescription: page.seoDescription ?? null,
          }
        : {},
    });
    created += 1;
  }
  return created;
}

export async function updateManagedPage(input: {
  key: string;
  data: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImagePath?: string | null;
    noIndex?: boolean;
    canonicalOverride?: string | null;
    heroEyebrow?: string | null;
    heroHeadline?: string | null;
    heroSupporting?: string | null;
    status?: PublishStatus;
  };
  actorId: string;
}) {
  const existing = await prisma.managedPage.findUnique({
    where: { key: input.key },
  });
  if (!existing) throw new Error("Managed page not found.");
  const updated = await prisma.managedPage.update({
    where: { key: input.key },
    data: { ...input.data, updatedById: input.actorId },
  });
  await createContentRevision({
    entityType: "ManagedPage",
    entityId: updated.id,
    snapshot: updated as unknown as Prisma.InputJsonValue,
    createdById: input.actorId,
  });
  if (
    input.data.noIndex !== undefined &&
    input.data.noIndex !== existing.noIndex
  ) {
    await writeAuditLog({
      actorId: input.actorId,
      action: "seo_indexability_change",
      entityType: "ManagedPage",
      entityId: updated.id,
      metadata: { key: input.key, noIndex: updated.noIndex },
    });
  } else {
    await writeAuditLog({
      actorId: input.actorId,
      action: "managed_page_update",
      entityType: "ManagedPage",
      entityId: updated.id,
      metadata: { key: input.key },
    });
  }
  return updated;
}
