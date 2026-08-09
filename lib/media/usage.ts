import { hasDatabaseUrl, prisma } from "@/lib/db";
import { mediaReferencesMatch } from "@/lib/media/reference";
import {
  extractHomepageMediaReferences,
  extractWorkMediaReferences,
} from "@/lib/media/content-references";

export type MediaUsage = {
  entityType: string;
  entityId: string;
  label: string;
  href?: string;
  published: boolean;
  field: string;
};

function pushUsage(list: MediaUsage[], item: MediaUsage) {
  list.push(item);
}

function matches(url: string, publicUrl: string): boolean {
  return mediaReferencesMatch(url, publicUrl);
}

export async function findMediaUsages(publicUrl: string): Promise<MediaUsage[]> {
  if (!hasDatabaseUrl()) return [];
  const usages: MediaUsage[] = [];

  const homepage = await prisma.homepageContent.findUnique({
    where: { id: "home" },
    select: { ogImagePath: true, sections: true, draftJson: true },
  });
  if (homepage) {
    for (const ref of extractHomepageMediaReferences(homepage)) {
      if (matches(ref.reference, publicUrl)) {
        pushUsage(usages, {
          entityType: ref.entityType,
          entityId: ref.entityId,
          label: ref.label,
          href: ref.href,
          published: ref.published,
          field: ref.field,
        });
      }
    }
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (settings) {
    const fields: Array<[string, string | null | undefined]> = [
      ["defaultOgImagePath", settings.defaultOgImagePath],
      ["primaryLogoPath", settings.primaryLogoPath],
      ["logoOnDarkPath", settings.logoOnDarkPath],
      ["brandMarkPath", settings.brandMarkPath],
      ["faviconPath", settings.faviconPath],
    ];
    for (const [field, value] of fields) {
      if (value && matches(value, publicUrl)) {
        pushUsage(usages, {
          entityType: "SiteSettings",
          entityId: "site",
          label: "Site settings",
          href: "/admin/settings",
          published: true,
          field,
        });
      }
    }
  }

  const workRows = await prisma.workProject.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      coverImagePath: true,
      heroImagePath: true,
      ogImagePath: true,
      gallery: true,
      caseStudyContent: true,
      draftJson: true,
    },
  });
  for (const row of workRows) {
    for (const ref of extractWorkMediaReferences(row)) {
      if (matches(ref.reference, publicUrl)) {
        pushUsage(usages, {
          entityType: ref.entityType,
          entityId: ref.entityId,
          label: ref.label,
          href: ref.href,
          published: ref.published,
          field: ref.field,
        });
      }
    }
  }

  const insights = await prisma.insight.findMany({
    select: {
      id: true,
      title: true,
      heroImagePath: true,
      ogImagePath: true,
      bodyMarkdown: true,
      status: true,
    },
  });
  for (const item of insights) {
    if (item.heroImagePath && matches(item.heroImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "Insight",
        entityId: item.id,
        label: item.title,
        href: `/admin/insights/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "heroImagePath",
      });
    }
    if (item.ogImagePath && matches(item.ogImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "Insight",
        entityId: item.id,
        label: item.title,
        href: `/admin/insights/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "ogImagePath",
      });
    }
    if (matches(item.bodyMarkdown, publicUrl)) {
      pushUsage(usages, {
        entityType: "Insight",
        entityId: item.id,
        label: `${item.title} body`,
        href: `/admin/insights/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "bodyMarkdown",
      });
    }
  }

  const testimonials = await prisma.testimonial.findMany({
    select: { id: true, name: true, avatarPath: true, status: true, verified: true },
  });
  for (const item of testimonials) {
    if (item.avatarPath && matches(item.avatarPath, publicUrl)) {
      pushUsage(usages, {
        entityType: "Testimonial",
        entityId: item.id,
        label: item.name,
        href: `/admin/testimonials/${item.id}`,
        published: item.status === "PUBLISHED" && item.verified,
        field: "avatarPath",
      });
    }
  }

  const managed = await prisma.managedPage.findMany({
    select: { id: true, displayName: true, key: true, ogImagePath: true, status: true },
  });
  for (const item of managed) {
    if (item.ogImagePath && matches(item.ogImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "ManagedPage",
        entityId: item.id,
        label: item.displayName,
        href: `/admin/seo?page=${item.key}`,
        published: item.status === "PUBLISHED",
        field: "ogImagePath",
      });
    }
  }

  const resources = await prisma.cmsResource.findMany({
    select: { id: true, title: true, heroImagePath: true, status: true },
  });
  for (const item of resources) {
    if (item.heroImagePath && matches(item.heroImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "CmsResource",
        entityId: item.id,
        label: item.title,
        href: `/admin/resources/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "heroImagePath",
      });
    }
  }

  const services = await prisma.service.findMany({
    select: { id: true, title: true, ogImagePath: true, status: true },
  });
  for (const item of services) {
    if (item.ogImagePath && matches(item.ogImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "Service",
        entityId: item.id,
        label: item.title,
        href: `/admin/services/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "ogImagePath",
      });
    }
  }

  const solutions = await prisma.solution.findMany({
    select: { id: true, title: true, ogImagePath: true, status: true, pageContent: true },
  });
  for (const item of solutions) {
    if (item.ogImagePath && matches(item.ogImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "Solution",
        entityId: item.id,
        label: item.title,
        href: `/admin/solutions/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "ogImagePath",
      });
    }
    if (item.pageContent && matches(JSON.stringify(item.pageContent), publicUrl)) {
      pushUsage(usages, {
        entityType: "Solution",
        entityId: item.id,
        label: `${item.title} page content`,
        href: `/admin/solutions/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "pageContent",
      });
    }
  }

  const platforms = await prisma.platform.findMany({
    select: { id: true, title: true, ogImagePath: true, status: true },
  });
  for (const item of platforms) {
    if (item.ogImagePath && matches(item.ogImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "Platform",
        entityId: item.id,
        label: item.title,
        href: `/admin/platforms/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "ogImagePath",
      });
    }
  }

  const industries = await prisma.industry.findMany({
    select: { id: true, name: true, ogImagePath: true, status: true },
  });
  for (const item of industries) {
    if (item.ogImagePath && matches(item.ogImagePath, publicUrl)) {
      pushUsage(usages, {
        entityType: "Industry",
        entityId: item.id,
        label: item.name,
        href: `/admin/industries/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "ogImagePath",
      });
    }
  }

  const assetRefs = await prisma.assetReference.findMany({
    select: { id: true, path: true, entityHint: true },
  });
  for (const ref of assetRefs) {
    if (!matches(ref.path, publicUrl)) continue;
    pushUsage(usages, {
      entityType: "AssetReference",
      entityId: ref.id,
      label: ref.entityHint || ref.path,
      published: true,
      field: "path",
    });
  }

  return usages;
}
