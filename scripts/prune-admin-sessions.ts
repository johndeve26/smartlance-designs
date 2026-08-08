import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Revoke/delete expired Admin sessions.
 * Safe to run on a schedule (e.g. daily cron).
 *
 *   npm run admin:prune-sessions
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const now = new Date();
    const revoked = await prisma.adminSession.updateMany({
      where: { expiresAt: { lt: now }, revokedAt: null },
      data: { revokedAt: now },
    });

    // Physically remove sessions expired > 30 days ago
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.adminSession.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });

    console.log(
      JSON.stringify({
        markedRevoked: revoked.count,
        deletedOlderThan30d: deleted.count,
      }),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
