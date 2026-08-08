import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Portable Prisma client: Next.js → repositories → Prisma → PostgreSQL.
 * Works with Neon (pooled DATABASE_URL) and any standard Postgres.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
  prismaSchemaFingerprint?: string;
};

/**
 * Bump when new models/fields require a fresh PrismaClient in long-lived `next dev`.
 * Also used with delegate checks below — stale singletons after `prisma generate` are a common
 * Admin "Something went wrong" cause (undefined.findMany / undefined.findUnique).
 */
const PRISMA_CLIENT_GENERATION = "ai-content-assistants-phase-e";

/** Delegates that must exist after AI Writer + Topic Intelligence + Content Assistants landed. */
const REQUIRED_DELEGATES = [
  "aIEditorialProject",
  "aIProviderAccount",
  "aIWriterSettings",
  "editorialOpportunity",
  "topicSourcePack",
  "topicStrategySettings",
  "topicDiscoveryRun",
  "topicWatchlist",
  "topicSeed",
  "aIContentRun",
  "aIContentProposal",
] as const;

/** Extra field checks on aIProviderAccount after schema bumps. */
const REQUIRED_PROVIDER_ACCOUNT_FIELDS = ["defaultModel"] as const;

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function clientHasRequiredDelegates(client: PrismaClient): boolean {
  const okDelegates = REQUIRED_DELEGATES.every((name) => {
    const delegate = (client as unknown as Record<string, unknown>)[name];
    return Boolean(delegate && typeof (delegate as { findMany?: unknown }).findMany === "function");
  });
  if (!okDelegates) return false;

  // Prisma validates fields against the DMMF; missing fields throw at runtime on upsert.
  const dmmf = (client as unknown as { _runtimeDataModel?: { models?: Record<string, { fields?: Array<{ name: string }> }> } })
    ._runtimeDataModel?.models?.AIProviderAccount?.fields;
  if (!dmmf?.length) {
    // Older clients may not expose this shape — force recreate via fingerprint bump instead.
    return true;
  }
  const names = new Set(dmmf.map((f) => f.name));
  return REQUIRED_PROVIDER_ACCOUNT_FIELDS.every((f) => names.has(f));
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure a PostgreSQL connection (e.g. Neon pooled URL).",
    );
  }

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 20_000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function dropStaleClient(reason: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[db] Recreating PrismaClient (${reason}). Restart next dev if this persists.`);
  }
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  }
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaSchemaFingerprint = undefined;
}

function getPrismaClient(): PrismaClient {
  if (
    process.env.NODE_ENV !== "production" &&
    globalForPrisma.prisma &&
    globalForPrisma.prismaSchemaFingerprint !== PRISMA_CLIENT_GENERATION
  ) {
    dropStaleClient(`fingerprint ${globalForPrisma.prismaSchemaFingerprint} → ${PRISMA_CLIENT_GENERATION}`);
  }

  if (
    process.env.NODE_ENV !== "production" &&
    globalForPrisma.prisma &&
    !clientHasRequiredDelegates(globalForPrisma.prisma)
  ) {
    dropStaleClient("missing required model delegates — run prisma generate && restart next dev");
  }

  let client = globalForPrisma.prisma ?? createPrismaClient();

  if (!clientHasRequiredDelegates(client)) {
    dropStaleClient("fresh client missing delegates");
    // Force a new instance; if still missing, generated client is out of date.
    client = createPrismaClient();
    if (!clientHasRequiredDelegates(client)) {
      throw new Error(
        "PrismaClient is missing required Admin/AI models (including Topic Intelligence). Run `npx prisma generate` and restart `npm run dev`.",
      );
    }
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaFingerprint = PRISMA_CLIENT_GENERATION;
  }
  return client;
}

/** Lazily created — only instantiate when DATABASE_URL is present. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!hasDatabaseUrl()) {
      throw new Error(
        "DATABASE_URL is not set. Configure a PostgreSQL connection (e.g. Neon pooled URL).",
      );
    }
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (
      typeof prop === "string" &&
      (REQUIRED_DELEGATES as readonly string[]).includes(prop) &&
      (value == null || typeof (value as { findMany?: unknown }).findMany !== "function")
    ) {
      throw new Error(
        `Prisma delegate "${prop}" is unavailable. Run \`npx prisma generate\` and restart \`npm run dev\`.`,
      );
    }
    return typeof value === "function" ? value.bind(client) : value;
  },
});
