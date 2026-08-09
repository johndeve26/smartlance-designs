import fs from "node:fs";
import path from "node:path";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  discoverStaticMediaAssets,
  type DiscoveredStaticAsset,
} from "@/lib/media/static-discovery";
import {
  mediaReferencesMatch,
  normalizePublicMediaPath,
  staticStorageKey,
} from "@/lib/media/reference";
import { buildMediaReferenceInventory } from "@/lib/media/inventory";

export type StaticMediaSyncResult = {
  dryRun: boolean;
  filesScanned: number;
  existingMatches: number;
  created: number;
  updated: number;
  unchanged: number;
  conflicts: string[];
  missingSources: string[];
  errors: string[];
};

async function upsertDiscoveredAsset(
  asset: DiscoveredStaticAsset,
  existingByStorageKey: Map<
    string,
    {
      id: string;
      byteSize: number;
      width: number | null;
      height: number | null;
      mimeType: string;
    }
  >,
  input: { dryRun: boolean; actorId?: string | null },
): Promise<"created" | "updated" | "unchanged"> {
  const storageKey = staticStorageKey(asset.publicPath);
  const existing = existingByStorageKey.get(storageKey);

  if (!existing) {
    if (!input.dryRun) {
      const row = await prisma.mediaAsset.create({
        data: {
          filename: asset.publicPath.split("/").pop() || asset.publicPath,
          originalFilename: asset.publicPath.split("/").pop() || asset.publicPath,
          storageProvider: "static",
          storageKey,
          publicUrl: asset.publicPath,
          mimeType: asset.mimeType,
          extension: asset.extension,
          byteSize: asset.byteSize,
          width: asset.width,
          height: asset.height,
          sourceType: "STATIC_EXISTING",
          status: "ACTIVE",
          createdById: input.actorId ?? null,
        },
      });
      existingByStorageKey.set(storageKey, {
        id: row.id,
        byteSize: row.byteSize,
        width: row.width,
        height: row.height,
        mimeType: row.mimeType,
      });
    }
    return "created";
  }

  const updates: {
    byteSize?: number;
    width?: number | null;
    height?: number | null;
    mimeType?: string;
    updatedById?: string | null;
  } = {};

  if (existing.byteSize === 0 && asset.byteSize > 0) {
    updates.byteSize = asset.byteSize;
  }
  if (!existing.width && asset.width) updates.width = asset.width;
  if (!existing.height && asset.height) updates.height = asset.height;
  if (
    existing.mimeType === "application/octet-stream" &&
    asset.mimeType !== "application/octet-stream"
  ) {
    updates.mimeType = asset.mimeType;
  }

  if (Object.keys(updates).length === 0) return "unchanged";

  if (!input.dryRun) {
    await prisma.mediaAsset.update({
      where: { id: existing.id },
      data: {
        ...updates,
        updatedById: input.actorId ?? null,
      },
    });
    existingByStorageKey.set(storageKey, {
      ...existing,
      ...updates,
      byteSize: updates.byteSize ?? existing.byteSize,
      width: updates.width ?? existing.width,
      height: updates.height ?? existing.height,
      mimeType: updates.mimeType ?? existing.mimeType,
    });
  }
  return "updated";
}

/**
 * Reconcile known repository static assets into MediaAsset rows.
 * Idempotent — never deletes files or content references.
 */
export async function syncStaticMediaAssets(input?: {
  dryRun?: boolean;
  actorId?: string | null;
  projectRoot?: string;
}): Promise<StaticMediaSyncResult> {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for static media sync.");
  }

  const dryRun = input?.dryRun ?? false;
  const result: StaticMediaSyncResult = {
    dryRun,
    filesScanned: 0,
    existingMatches: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    conflicts: [],
    missingSources: [],
    errors: [],
  };

  const discovered = discoverStaticMediaAssets(input?.projectRoot);
  result.filesScanned = discovered.length;

  const existingRows = await prisma.mediaAsset.findMany({
    where: { sourceType: "STATIC_EXISTING" },
    select: {
      id: true,
      storageKey: true,
      publicUrl: true,
      byteSize: true,
      width: true,
      height: true,
      mimeType: true,
    },
  });
  const indexedByPath = new Map(
    existingRows.map((row) => [row.publicUrl, row]),
  );
  const existingByStorageKey = new Map(
    existingRows.map((row) => [row.storageKey, row]),
  );

  for (const asset of discovered) {
    try {
      const outcome = await upsertDiscoveredAsset(
        asset,
        existingByStorageKey,
        {
          dryRun,
          actorId: input?.actorId,
        },
      );
      if (outcome === "created") result.created += 1;
      else if (outcome === "updated") result.updated += 1;
      else result.unchanged += 1;
      if (indexedByPath.has(asset.publicPath)) result.existingMatches += 1;
    } catch (error) {
      result.errors.push(
        `${asset.publicPath}: ${error instanceof Error ? error.message : "sync failed"}`,
      );
    }
  }

  for (const row of existingRows) {
    const normalized = normalizePublicMediaPath(row.publicUrl);
    if (!normalized) continue;
    const diskPath = path.join(
      input?.projectRoot ?? process.cwd(),
      "public",
      normalized.replace(/^\//, ""),
    );
    if (!fs.existsSync(diskPath)) {
      result.missingSources.push(row.publicUrl);
    }
  }

  try {
    const inventory = await buildMediaReferenceInventory(
      input?.projectRoot,
    );
    for (const item of inventory.contentReferences) {
      if (item.classification === "INVALID") {
        result.conflicts.push(
          `${item.entityType}/${item.entityId} ${item.field}: invalid reference`,
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `content inventory: ${error instanceof Error ? error.message : "audit failed"}`,
    );
  }

  if (!dryRun && input?.actorId) {
    await writeAuditLog({
      actorId: input.actorId,
      action: "media.sync_static",
      entityType: "MediaAsset",
      entityId: "static-sync",
      metadata: {
        filesScanned: result.filesScanned,
        created: result.created,
        updated: result.updated,
        unchanged: result.unchanged,
        missingSources: result.missingSources.length,
        errors: result.errors.length,
      },
    });
  }

  return result;
}

/** Latest completed static media sync from audit log (mutations only). */
export async function getLatestStaticMediaSyncRun() {
  if (!hasDatabaseUrl()) return null;
  return prisma.auditLog.findFirst({
    where: { action: "media.sync_static" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, metadata: true },
  });
}
