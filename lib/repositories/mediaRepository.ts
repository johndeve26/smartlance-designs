import { hasDatabaseUrl, prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { getMediaStorage } from "@/lib/media/storage";
import {
  buildStorageKey,
  getMaxUploadBytes,
  validateImageUpload,
} from "@/lib/media/validation";
import type { MediaAssetStatus, MediaSourceType, Prisma } from "@prisma/client";
import { findMediaUsages } from "@/lib/media/usage";
import {
  getAdminSiteSettingsExtras,
  getSiteSettingsAdmin,
} from "@/lib/repositories/siteSettingsRepository";

async function resolveUploadMaxBytes() {
  const row = await getSiteSettingsAdmin();
  const presentation = getAdminSiteSettingsExtras(row);
  return getMaxUploadBytes(presentation.mediaMaxUploadMb);
}

export async function listMediaAssets(input?: {
  q?: string;
  sourceType?: MediaSourceType;
  status?: MediaAssetStatus;
  mimePrefix?: string;
  page?: number;
  pageSize?: number;
}) {
  if (!hasDatabaseUrl()) return { items: [], total: 0, page: 1, pageSize: 24 };
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(input?.pageSize ?? 24, 100);
  const where: Prisma.MediaAssetWhereInput = {};
  if (input?.status) where.status = input.status;
  if (input?.sourceType) where.sourceType = input.sourceType;
  if (input?.mimePrefix) where.mimeType = { startsWith: input.mimePrefix };
  if (input?.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { filename: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { altText: { contains: q, mode: "insensitive" } },
      { caption: { contains: q, mode: "insensitive" } },
      { originalFilename: { contains: q, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mediaAsset.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getMediaAsset(id: string) {
  if (!hasDatabaseUrl()) return null;
  return prisma.mediaAsset.findUnique({ where: { id } });
}

export async function countMediaByStatus() {
  if (!hasDatabaseUrl()) return { ACTIVE: 0, ARCHIVED: 0, total: 0 };
  const groups = await prisma.mediaAsset.groupBy({
    by: ["status"],
    _count: true,
  });
  const ACTIVE = groups.find((g) => g.status === "ACTIVE")?._count ?? 0;
  const ARCHIVED = groups.find((g) => g.status === "ARCHIVED")?._count ?? 0;
  return { ACTIVE, ARCHIVED, total: ACTIVE + ARCHIVED };
}

export async function registerStaticMediaAsset(input: {
  publicPath: string;
  altText?: string | null;
  title?: string | null;
  mimeType?: string;
  byteSize?: number;
  width?: number | null;
  height?: number | null;
  createdById?: string | null;
}) {
  const publicUrl = input.publicPath.startsWith("/")
    ? input.publicPath
    : `/${input.publicPath}`;
  const filename = publicUrl.split("/").pop() || publicUrl;
  const extension = (filename.split(".").pop() || "").toLowerCase();
  return prisma.mediaAsset.upsert({
    where: { storageKey: `static:${publicUrl}` },
    create: {
      filename,
      originalFilename: filename,
      storageProvider: "static",
      storageKey: `static:${publicUrl}`,
      publicUrl,
      mimeType: input.mimeType || guessMime(extension),
      extension,
      byteSize: input.byteSize ?? 0,
      width: input.width ?? null,
      height: input.height ?? null,
      altText: input.altText ?? null,
      title: input.title ?? null,
      sourceType: "STATIC_EXISTING",
      status: "ACTIVE",
      createdById: input.createdById ?? null,
    },
    update: {},
  });
}

function guessMime(ext: string) {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export async function uploadMediaAsset(input: {
  buffer: Buffer;
  originalFilename: string;
  reportedMime?: string | null;
  altText?: string | null;
  title?: string | null;
  caption?: string | null;
  actorId: string;
}) {
  const maxBytes = await resolveUploadMaxBytes();
  const validated = validateImageUpload({
    buffer: input.buffer,
    originalFilename: input.originalFilename,
    reportedMime: input.reportedMime,
    maxBytes,
  });
  const storage = getMediaStorage();
  const storageKey = buildStorageKey(validated.safeFilename, validated.extension);

  let uploaded;
  try {
    uploaded = await storage.upload({
      buffer: input.buffer,
      filename: validated.safeFilename,
      mimeType: validated.mimeType,
      contentType: validated.mimeType,
      storageKey,
    });
  } catch (err) {
    throw err;
  }

  try {
    const row = await prisma.mediaAsset.create({
      data: {
        filename: validated.safeFilename,
        originalFilename: input.originalFilename,
        storageProvider: storage.name,
        storageKey: uploaded.storageKey,
        publicUrl: uploaded.publicUrl,
        mimeType: validated.mimeType,
        extension: validated.extension,
        byteSize: validated.byteSize,
        width: validated.width,
        height: validated.height,
        altText: input.altText ?? null,
        title: input.title ?? null,
        caption: input.caption ?? null,
        sourceType: "UPLOADED",
        status: "ACTIVE",
        createdById: input.actorId,
        updatedById: input.actorId,
      },
    });
    await writeAuditLog({
      actorId: input.actorId,
      action: "media_upload",
      entityType: "MediaAsset",
      entityId: row.id,
      metadata: {
        storageKey: row.storageKey,
        mimeType: row.mimeType,
        byteSize: row.byteSize,
      },
    });
    return row;
  } catch (err) {
    try {
      await storage.delete(uploaded.storageKey);
    } catch {
      // best-effort cleanup
    }
    throw err;
  }
}

export async function updateMediaMetadata(input: {
  id: string;
  altText?: string | null;
  caption?: string | null;
  title?: string | null;
  actorId: string;
}) {
  const row = await prisma.mediaAsset.update({
    where: { id: input.id },
    data: {
      altText: input.altText,
      caption: input.caption,
      title: input.title,
      updatedById: input.actorId,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "media_metadata_change",
    entityType: "MediaAsset",
    entityId: row.id,
    metadata: {
      altText: row.altText,
      title: row.title,
      caption: row.caption,
    },
  });
  return row;
}

export async function archiveMediaAsset(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.mediaAsset.update({
    where: { id: input.id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
      updatedById: input.actorId,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "media_archive",
    entityType: "MediaAsset",
    entityId: row.id,
  });
  return row;
}

export async function permanentlyDeleteMediaAsset(input: {
  id: string;
  actorId: string;
  force?: boolean;
}) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: input.id } });
  if (!asset) throw new Error("Media asset not found.");
  const usages = await findMediaUsages(asset.publicUrl);
  const published = usages.filter((u) => u.published);
  if (published.length > 0 && !input.force) {
    throw new Error(
      `This asset is currently used by ${published.length} published record(s). Archive or replace instead.`,
    );
  }
  if (usages.length > 0 && !input.force) {
    throw new Error(
      `This asset is referenced by ${usages.length} record(s). Confirm dangerous delete to proceed.`,
    );
  }
  if (asset.sourceType === "STATIC_EXISTING") {
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    await writeAuditLog({
      actorId: input.actorId,
      action: "media_delete",
      entityType: "MediaAsset",
      entityId: asset.id,
      metadata: { note: "metadata-only; static file retained" },
    });
    return;
  }

  // Delete storage first only after we confirm DB delete can proceed:
  // soft-remove DB last after storage success; on storage failure keep DB.
  if (asset.storageProvider === "local" || asset.storageProvider === "s3") {
    const storage = getMediaStorage();
    await storage.delete(asset.storageKey);
  }
  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  await writeAuditLog({
    actorId: input.actorId,
    action: "media_delete",
    entityType: "MediaAsset",
    entityId: asset.id,
    metadata: { storageKey: asset.storageKey },
  });
}

export async function replaceMediaAssetFile(input: {
  id: string;
  buffer: Buffer;
  originalFilename: string;
  reportedMime?: string | null;
  actorId: string;
}) {
  const existing = await prisma.mediaAsset.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Media asset not found.");
  if (existing.sourceType === "STATIC_EXISTING") {
    throw new Error("Static existing assets cannot be replaced in storage. Upload a new asset.");
  }
  const usages = await findMediaUsages(existing.publicUrl);
  const maxBytes = await resolveUploadMaxBytes();
  const validated = validateImageUpload({
    buffer: input.buffer,
    originalFilename: input.originalFilename,
    reportedMime: input.reportedMime,
    maxBytes,
  });
  const storage = getMediaStorage();
  const storageKey = buildStorageKey(validated.safeFilename, validated.extension);
  const uploaded = await storage.upload({
    buffer: input.buffer,
    filename: validated.safeFilename,
    mimeType: validated.mimeType,
    contentType: validated.mimeType,
    storageKey,
  });
  const previousKey = existing.storageKey;
  const row = await prisma.mediaAsset.update({
    where: { id: existing.id },
    data: {
      filename: validated.safeFilename,
      originalFilename: input.originalFilename,
      storageProvider: storage.name,
      storageKey: uploaded.storageKey,
      publicUrl: uploaded.publicUrl,
      mimeType: validated.mimeType,
      extension: validated.extension,
      byteSize: validated.byteSize,
      width: validated.width,
      height: validated.height,
      updatedById: input.actorId,
    },
  });
  try {
    if (previousKey !== uploaded.storageKey) {
      await storage.delete(previousKey);
    }
  } catch {
    // non-fatal
  }
  await writeAuditLog({
    actorId: input.actorId,
    action: "media_replace",
    entityType: "MediaAsset",
    entityId: row.id,
    metadata: {
      impactCount: usages.length,
      previousKey,
      storageKey: uploaded.storageKey,
    },
  });
  return { row, impactCount: usages.length };
}
