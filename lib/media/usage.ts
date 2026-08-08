import { hasDatabaseUrl, prisma } from "@/lib/db";

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

export async function findMediaUsages(publicUrl: string): Promise<MediaUsage[]> {
  if (!hasDatabaseUrl()) return [];
  const usages: MediaUsage[] = [];
  const url = publicUrl;

  const homepage = await prisma.homepageContent.findUnique({
    where: { id: "home" },
    select: { ogImagePath: true, sections: true },
  });
  if (homepage) {
    if (homepage.ogImagePath === url) {
      pushUsage(usages, {
        entityType: "HomepageContent",
        entityId: "home",
        label: "Homepage",
        href: "/admin/homepage",
        published: true,
        field: "ogImagePath",
      });
    }
    const blob = JSON.stringify(homepage.sections ?? "");
    if (blob.includes(url)) {
      pushUsage(usages, {
        entityType: "HomepageContent",
        entityId: "home",
        label: "Homepage sections",
        href: "/admin/homepage",
        published: true,
        field: "sections",
      });
    }
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "site" },
  });
  if (settings) {
    const fields: Array<[string, string | null | undefined]> = [
      ["defaultOgImagePath", settings.defaultOgImagePath],
      ["primaryLogoPath", settings.primaryLogoPath],
      ["logoOnDarkPath", settings.logoOnDarkPath],
      ["brandMarkPath", settings.brandMarkPath],
      ["faviconPath", settings.faviconPath],
    ];
    for (const [field, value] of fields) {
      if (value === url) {
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

  const work = await prisma.workProject.findMany({
    select: {
      id: true,
      name: true,
      coverImagePath: true,
      heroImagePath: true,
      gallery: true,
      ogImagePath: true,
      status: true,
    },
  });
  for (const item of work) {
    if (
      item.coverImagePath === url ||
      item.heroImagePath === url ||
      item.ogImagePath === url
    ) {
      pushUsage(usages, {
        entityType: "WorkProject",
        entityId: item.id,
        label: item.name,
        href: `/admin/work/${item.id}`,
        published: item.status === "PUBLISHED",
        field:
          item.coverImagePath === url
            ? "coverImagePath"
            : item.heroImagePath === url
              ? "heroImagePath"
              : "ogImagePath",
      });
    }
    const gallery = JSON.stringify(item.gallery ?? "");
    if (gallery.includes(url)) {
      pushUsage(usages, {
        entityType: "WorkProject",
        entityId: item.id,
        label: `${item.name} gallery`,
        href: `/admin/work/${item.id}`,
        published: item.status === "PUBLISHED",
        field: "gallery",
      });
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
    if (item.heroImagePath === url || item.ogImagePath === url) {
      pushUsage(usages, {
        entityType: "Insight",
        entityId: item.id,
        label: item.title,
        href: `/admin/insights/${item.id}`,
        published: item.status === "PUBLISHED",
        field: item.heroImagePath === url ? "heroImagePath" : "ogImagePath",
      });
    }
    if (item.bodyMarkdown.includes(url)) {
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

  const managed = await prisma.managedPage.findMany({
    select: {
      id: true,
      displayName: true,
      key: true,
      ogImagePath: true,
      status: true,
    },
  });
  for (const item of managed) {
    if (item.ogImagePath === url) {
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

  const assetRefs = await prisma.assetReference.findMany({
    where: { path: url },
  });
  for (const ref of assetRefs) {
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
