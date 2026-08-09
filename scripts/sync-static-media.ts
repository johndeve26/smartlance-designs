/**
 * Index known repository static assets into MediaAsset rows (no file moves, no deletes).
 *
 * Usage:
 *   npm run media:sync:static -- --dry-run
 *   npm run media:sync:static
 *   npm run media:sync:static -- --write-audit
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { buildMediaReferenceInventory } from "@/lib/media/inventory";
import { syncStaticMediaAssets } from "@/lib/media/sync-static";

const DRY_RUN = process.argv.includes("--dry-run");
const WRITE_AUDIT = process.argv.includes("--write-audit");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const syncResult = await syncStaticMediaAssets({ dryRun: DRY_RUN });
    let inventoryReport: Record<string, unknown> | null = null;
    try {
      const inventory = await buildMediaReferenceInventory();
      inventoryReport = {
        generatedAt: inventory.generatedAt,
        staticFilesScanned: inventory.staticFilesScanned,
        mediaAssetRows: inventory.mediaAssetRows,
        orphanedMediaRows: inventory.orphanedMediaRows,
        duplicateStorageKeys: inventory.duplicateStorageKeys,
        missingStaticSources: inventory.missingStaticSources,
        unresolvedReferenceCount: inventory.unresolvedReferences.length,
        unresolvedReferences: inventory.unresolvedReferences.map((ref) => ({
          entityType: ref.entityType,
          entityId: ref.entityId,
          field: ref.field,
          reference: ref.reference,
          classification: ref.classification,
        })),
      };
    } catch (error) {
      inventoryReport = {
        error:
          error instanceof Error
            ? error.message
            : "Inventory audit unavailable (apply pending migrations?)",
      };
    }

    const report = {
      sync: syncResult,
      inventory: inventoryReport,
    };

    console.log(JSON.stringify(report, null, 2));

    if (WRITE_AUDIT && !DRY_RUN && inventoryReport && !("error" in inventoryReport)) {
      const outDir = path.join(process.cwd(), "docs/audit-artifacts");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, "media-reference-audit.json"),
        JSON.stringify(inventoryReport, null, 2),
      );
      console.log("Wrote docs/audit-artifacts/media-reference-audit.json");
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
