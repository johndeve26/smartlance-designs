import fs from "node:fs";
import path from "node:path";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import {
  classifyMediaReference,
  mediaReferencesMatch,
  normalizePublicMediaPath,
  type MediaReferenceClassification,
} from "@/lib/media/reference";
import { discoverStaticMediaAssets } from "@/lib/media/static-discovery";
import {
  extractHomepageMediaReferences,
  extractWorkMediaReferences,
  type ContentMediaReference,
} from "@/lib/media/content-references";

export type InventoryContentReference = ContentMediaReference & {
  classification: MediaReferenceClassification;
  fileExists: boolean;
  indexed: boolean;
};

export type MediaReferenceInventory = {
  generatedAt: string;
  staticFilesScanned: number;
  mediaAssetRows: number;
  staticMediaAssetRows: number;
  contentReferences: InventoryContentReference[];
  orphanedMediaRows: string[];
  duplicateStorageKeys: string[];
  missingStaticSources: string[];
  unresolvedReferences: InventoryContentReference[];
};

async function collectContentReferences(): Promise<ContentMediaReference[]> {
  if (!hasDatabaseUrl()) return [];
  const refs: ContentMediaReference[] = [];

  const homepage = await prisma.homepageContent.findUnique({
    where: { id: "home" },
    select: { ogImagePath: true, sections: true, draftJson: true },
  });
  if (homepage) {
    refs.push(...extractHomepageMediaReferences(homepage));
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (settings) {
    const fields: Array<[string, string | null]> = [
      ["defaultOgImagePath", settings.defaultOgImagePath],
      ["primaryLogoPath", settings.primaryLogoPath],
      ["logoOnDarkPath", settings.logoOnDarkPath],
      ["brandMarkPath", settings.brandMarkPath],
      ["faviconPath", settings.faviconPath],
    ];
    for (const [field, value] of fields) {
      if (value) {
        refs.push({
          entityType: "SiteSettings",
          entityId: "site",
          label: "Site settings",
          href: "/admin/settings",
          published: true,
          field,
          reference: value,
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
    refs.push(...extractWorkMediaReferences(row));
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
    const base = {
      entityType: "Insight",
      entityId: item.id,
      label: item.title,
      href: `/admin/insights/${item.id}`,
      published: item.status === "PUBLISHED",
    };
    if (item.heroImagePath) {
      refs.push({ ...base, field: "heroImagePath", reference: item.heroImagePath });
    }
    if (item.ogImagePath) {
      refs.push({ ...base, field: "ogImagePath", reference: item.ogImagePath });
    }
    const matches = item.bodyMarkdown.match(/\/(?:images|og)\/[^\s)"']+/g) ?? [];
    for (const match of matches) {
      refs.push({ ...base, field: "bodyMarkdown", reference: match });
    }
  }

  const testimonials = await prisma.testimonial.findMany({
    select: { id: true, legacyId: true, name: true, avatarPath: true, status: true, verified: true },
  });
  for (const item of testimonials) {
    if (!item.avatarPath) continue;
    refs.push({
      entityType: "Testimonial",
      entityId: item.id,
      label: item.name,
      href: `/admin/testimonials/${item.id}`,
      published: item.status === "PUBLISHED" && item.verified,
      field: "avatarPath",
      reference: item.avatarPath,
    });
  }

  const managed = await prisma.managedPage.findMany({
    select: { id: true, displayName: true, key: true, ogImagePath: true, status: true },
  });
  for (const item of managed) {
    if (!item.ogImagePath) continue;
    refs.push({
      entityType: "ManagedPage",
      entityId: item.id,
      label: item.displayName,
      href: `/admin/seo?page=${item.key}`,
      published: item.status === "PUBLISHED",
      field: "ogImagePath",
      reference: item.ogImagePath,
    });
  }

  const resources = await prisma.cmsResource.findMany({
    select: { id: true, title: true, heroImagePath: true, status: true },
  });
  for (const item of resources) {
    if (!item.heroImagePath) continue;
    refs.push({
      entityType: "CmsResource",
      entityId: item.id,
      label: item.title,
      href: `/admin/resources/${item.id}`,
      published: item.status === "PUBLISHED",
      field: "heroImagePath",
      reference: item.heroImagePath,
    });
  }

  const services = await prisma.service.findMany({
    select: { id: true, title: true, ogImagePath: true, status: true },
  });
  for (const item of services) {
    if (!item.ogImagePath) continue;
    refs.push({
      entityType: "Service",
      entityId: item.id,
      label: item.title,
      href: `/admin/services/${item.id}`,
      published: item.status === "PUBLISHED",
      field: "ogImagePath",
      reference: item.ogImagePath,
    });
  }

  const solutions = await prisma.solution.findMany({
    select: { id: true, title: true, ogImagePath: true, status: true },
  });
  for (const item of solutions) {
    if (!item.ogImagePath) continue;
    refs.push({
      entityType: "Solution",
      entityId: item.id,
      label: item.title,
      href: `/admin/solutions/${item.id}`,
      published: item.status === "PUBLISHED",
      field: "ogImagePath",
      reference: item.ogImagePath,
    });
  }

  const platforms = await prisma.platform.findMany({
    select: { id: true, title: true, ogImagePath: true, status: true },
  });
  for (const item of platforms) {
    if (!item.ogImagePath) continue;
    refs.push({
      entityType: "Platform",
      entityId: item.id,
      label: item.title,
      href: `/admin/platforms/${item.id}`,
      published: item.status === "PUBLISHED",
      field: "ogImagePath",
      reference: item.ogImagePath,
    });
  }

  const industries = await prisma.industry.findMany({
    select: { id: true, name: true, ogImagePath: true, status: true },
  });
  for (const item of industries) {
    if (!item.ogImagePath) continue;
    refs.push({
      entityType: "Industry",
      entityId: item.id,
      label: item.name,
      href: `/admin/industries/${item.id}`,
      published: item.status === "PUBLISHED",
      field: "ogImagePath",
      reference: item.ogImagePath,
    });
  }

  const assetRefs = await prisma.assetReference.findMany({ select: { id: true, path: true, entityHint: true } });
  for (const ref of assetRefs) {
    refs.push({
      entityType: "AssetReference",
      entityId: ref.id,
      label: ref.entityHint || ref.path,
      published: true,
      field: "path",
      reference: ref.path,
    });
  }

  return refs;
}

/** Read-only inventory of static assets, MediaAsset rows, and content references. */
export async function buildMediaReferenceInventory(
  projectRoot = process.cwd(),
): Promise<MediaReferenceInventory> {
  const discovered = discoverStaticMediaAssets(projectRoot);
  const staticPathSet = new Set(discovered.map((item) => item.publicPath));

  const mediaRows = hasDatabaseUrl()
    ? await prisma.mediaAsset.findMany({
        select: { id: true, publicUrl: true, storageKey: true, sourceType: true },
      })
    : [];

  const publicUrlSet = new Set(mediaRows.map((row) => row.publicUrl));
  const storageKeyCounts = new Map<string, number>();
  for (const row of mediaRows) {
    storageKeyCounts.set(row.storageKey, (storageKeyCounts.get(row.storageKey) ?? 0) + 1);
  }

  const rawRefs = await collectContentReferences();
  const referencedUrls = new Set<string>();
  const contentReferences: InventoryContentReference[] = rawRefs.map((ref) => {
    referencedUrls.add(ref.reference);
    const normalized = normalizePublicMediaPath(ref.reference);
    const classification = classifyMediaReference(ref.reference);
    const fileExists = normalized
      ? staticPathSet.has(normalized) ||
        fs.existsSync(
          path.join(projectRoot, "public", normalized.replace(/^\//, "")),
        )
      : false;
    const indexed =
      publicUrlSet.has(ref.reference) ||
      (normalized ? publicUrlSet.has(normalized) : false) ||
      mediaRows.some((row) => mediaReferencesMatch(ref.reference, row.publicUrl));

    return {
      ...ref,
      classification,
      fileExists,
      indexed,
    };
  });

  const orphanedMediaRows = mediaRows
    .filter((row) => !Array.from(referencedUrls).some((ref) => mediaReferencesMatch(ref, row.publicUrl)))
    .map((row) => row.publicUrl);

  const duplicateStorageKeys = [...storageKeyCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);

  const missingStaticSources: string[] = [];
  for (const row of mediaRows.filter((r) => r.sourceType === "STATIC_EXISTING")) {
    const normalized = normalizePublicMediaPath(row.publicUrl);
    if (!normalized) continue;
    const diskPath = path.join(projectRoot, "public", normalized.replace(/^\//, ""));
    if (!fs.existsSync(diskPath)) missingStaticSources.push(row.publicUrl);
  }

  const unresolvedReferences = contentReferences.filter(
    (ref) =>
      ref.classification === "INVALID" ||
      ref.classification === "UNKNOWN" ||
      (ref.classification === "VALID_STATIC" && !ref.fileExists && !ref.indexed),
  );

  return {
    generatedAt: new Date().toISOString(),
    staticFilesScanned: discovered.length,
    mediaAssetRows: mediaRows.length,
    staticMediaAssetRows: mediaRows.filter((r) => r.sourceType === "STATIC_EXISTING").length,
    contentReferences,
    orphanedMediaRows,
    duplicateStorageKeys,
    missingStaticSources,
    unresolvedReferences,
  };
}
