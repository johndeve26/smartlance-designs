import { unstable_cache } from "next/cache";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { RedirectOrigin, RedirectStatus, RedirectType } from "@prisma/client";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { CACHE_TAGS, revalidateRedirects } from "@/lib/admin/publishing";
import { isSafePublicUrl, normalizeInternalPath } from "@/lib/ops/url-safety";
import { PUBLIC_CACHE_REVALIDATE_SECONDS } from "@/lib/public/cache/config";

async function findActiveRedirectUncached(sourcePath: string) {
  return prisma.redirect.findFirst({
    where: {
      sourcePath,
      status: "ACTIVE",
    },
  });
}

/** Cached for public proxy/page lookups. Mutations call `revalidateRedirects()`. */
export async function findActiveRedirect(sourcePath: string) {
  if (!hasDatabaseUrl()) return null;
  if (process.env.NODE_ENV === "test") {
    return findActiveRedirectUncached(sourcePath);
  }
  return unstable_cache(
    () => findActiveRedirectUncached(sourcePath),
    ["active-redirect", sourcePath],
    {
      tags: [CACHE_TAGS.redirects],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

/**
 * Record a slug-change redirect and keep the redirect table loop-free.
 *
 * Renaming an entity back to a previously used slug would otherwise leave the
 * now-live path as an ACTIVE redirect source, which the proxy applies before
 * the page renders — taking a published page offline behind a redirect loop.
 */
export async function upsertSlugRedirect(input: {
  sourcePath: string;
  destination: string;
  createdById?: string | null;
  reason?: string;
  type?: RedirectType;
}) {
  if (input.sourcePath === input.destination) {
    return null;
  }

  const type = input.type ?? "PERMANENT_301";
  const reason = input.reason ?? "slug-change";

  const redirect = await prisma.redirect.upsert({
    where: { sourcePath: input.sourcePath },
    create: {
      sourcePath: input.sourcePath,
      destination: input.destination,
      type,
      status: "ACTIVE",
      origin: "SLUG_CHANGE",
      reason,
      createdById: input.createdById ?? null,
    },
    update: {
      destination: input.destination,
      type,
      status: "ACTIVE",
      origin: "SLUG_CHANGE",
      reason,
    },
  });

  // The destination is now a live URL, so it must not redirect anywhere.
  await prisma.redirect.updateMany({
    where: { sourcePath: input.destination, status: "ACTIVE" },
    data: { status: "DISABLED", reason: `${reason}:reclaimed-live-path` },
  });

  // Collapse chains: anything that pointed at the old path now points forward.
  await prisma.redirect.updateMany({
    where: {
      destination: input.sourcePath,
      status: "ACTIVE",
      sourcePath: { not: input.destination },
    },
    data: { destination: input.destination },
  });

  return redirect;
}

export async function listRedirects(input?: {
  limit?: number;
  offset?: number;
  q?: string;
  origin?: RedirectOrigin;
  status?: RedirectStatus;
  type?: RedirectType;
}) {
  if (!hasDatabaseUrl()) return { items: [], total: 0 };
  const limit = Math.min(input?.limit ?? 50, 200);
  const offset = input?.offset ?? 0;
  const where: {
    origin?: RedirectOrigin;
    status?: RedirectStatus;
    type?: RedirectType;
    OR?: Array<
      | { sourcePath: { contains: string; mode: "insensitive" } }
      | { destination: { contains: string; mode: "insensitive" } }
    >;
  } = {};
  if (input?.origin) where.origin = input.origin;
  if (input?.status) where.status = input.status;
  if (input?.type) where.type = input.type;
  if (input?.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { sourcePath: { contains: q, mode: "insensitive" } },
      { destination: { contains: q, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.redirect.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.redirect.count({ where }),
  ]);
  return { items, total };
}

export type RedirectChainStep = {
  sourcePath: string;
  destination: string;
  type: RedirectType;
};

export async function resolveRedirectChain(
  startPath: string,
  maxHops = 8,
): Promise<{
  chain: RedirectChainStep[];
  finalPath: string;
  loop: boolean;
}> {
  const chain: RedirectChainStep[] = [];
  const seen = new Set<string>();
  let current = normalizeInternalPath(startPath) || startPath;
  let loop = false;
  for (let i = 0; i < maxHops; i++) {
    if (seen.has(current)) {
      loop = true;
      break;
    }
    seen.add(current);
    const row = await findActiveRedirect(current);
    if (!row) break;
    chain.push({
      sourcePath: row.sourcePath,
      destination: row.destination,
      type: row.type,
    });
    const next = normalizeInternalPath(row.destination) || row.destination;
    current = next;
  }
  return { chain, finalPath: current, loop };
}

export async function detectRedirectLoop(
  sourcePath: string,
  destination: string,
): Promise<{ loop: boolean; chain?: string }> {
  if (sourcePath === destination) {
    return { loop: true, chain: `${sourcePath} → ${destination}` };
  }
  const destPath = normalizeInternalPath(destination);
  if (!destPath) return { loop: false };
  const { chain, loop, finalPath } = await resolveRedirectChain(destPath);
  if (loop) return { loop: true, chain: chain.map((c) => c.sourcePath).join(" → ") };
  if (finalPath === sourcePath) {
    return {
      loop: true,
      chain: `${sourcePath} → ${destination} → … → ${sourcePath}`,
    };
  }
  // Direct reverse
  const reverse = await findActiveRedirect(destPath);
  if (reverse && reverse.destination === sourcePath) {
    return { loop: true, chain: `${sourcePath} ↔ ${destPath}` };
  }
  return { loop: false };
}

export async function createManualRedirect(input: {
  sourcePath: string;
  destination: string;
  type?: RedirectType;
  reason?: string;
  actorId: string;
}) {
  const source = normalizeInternalPath(input.sourcePath);
  if (!source) throw new Error("Source path must be an internal path starting with /.");
  if (!isSafePublicUrl(input.destination)) {
    throw new Error("Destination URL uses an unsafe scheme.");
  }
  if (source === input.destination) {
    throw new Error("Source and destination cannot be the same.");
  }
  const loop = await detectRedirectLoop(source, input.destination);
  if (loop.loop) {
    throw new Error(`Redirect loop detected: ${loop.chain}`);
  }
  const chain = await resolveRedirectChain(
    normalizeInternalPath(input.destination) || input.destination,
  );
  let warning: string | null = null;
  if (chain.chain.length > 0) {
    warning = `Destination redirects further to ${chain.finalPath}. Consider pointing directly to the canonical path.`;
  }

  const row = await prisma.redirect.create({
    data: {
      sourcePath: source,
      destination: input.destination,
      type: input.type ?? "PERMANENT_301",
      status: "ACTIVE",
      origin: "MANUAL",
      reason: input.reason ?? null,
      createdById: input.actorId,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "redirect_create",
    entityType: "Redirect",
    entityId: row.id,
    metadata: { sourcePath: source, destination: input.destination },
  });
  revalidateRedirects();
  return { row, warning };
}

export async function updateRedirect(input: {
  id: string;
  destination?: string;
  type?: RedirectType;
  status?: RedirectStatus;
  reason?: string | null;
  actorId: string;
}) {
  const existing = await prisma.redirect.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Redirect not found.");
  const destination = input.destination ?? existing.destination;
  if (!isSafePublicUrl(destination)) {
    throw new Error("Destination URL uses an unsafe scheme.");
  }
  if (destination === existing.sourcePath) {
    throw new Error("Source and destination cannot be the same.");
  }
  const loop = await detectRedirectLoop(existing.sourcePath, destination);
  if (loop.loop) {
    throw new Error(`Redirect loop detected: ${loop.chain}`);
  }
  const row = await prisma.redirect.update({
    where: { id: input.id },
    data: {
      destination,
      type: input.type,
      status: input.status,
      reason: input.reason === undefined ? undefined : input.reason,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: input.status === "DISABLED" ? "redirect_disable" : "redirect_update",
    entityType: "Redirect",
    entityId: row.id,
    metadata: {
      sourcePath: row.sourcePath,
      destination: row.destination,
      status: row.status,
    },
  });
  revalidateRedirects();
  return row;
}

export async function permanentlyDeleteRedirect(input: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.redirect.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Redirect not found.");
  if (existing.origin === "LEGACY_MIGRATION") {
    throw new Error(
      "Legacy migration redirects should be disabled, not deleted, except with extreme care.",
    );
  }
  await prisma.redirect.delete({ where: { id: input.id } });
  await writeAuditLog({
    actorId: input.actorId,
    action: "redirect_delete",
    entityType: "Redirect",
    entityId: input.id,
    metadata: {
      sourcePath: existing.sourcePath,
      destination: existing.destination,
    },
  });
  revalidateRedirects();
}

export async function countRedirectsByOrigin() {
  if (!hasDatabaseUrl()) return {};
  const groups = await prisma.redirect.groupBy({
    by: ["origin"],
    _count: true,
  });
  return Object.fromEntries(groups.map((g) => [g.origin, g._count]));
}
