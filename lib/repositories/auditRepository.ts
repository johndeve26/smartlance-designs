import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function listAuditLogs(input?: {
  entityType?: string;
  entityId?: string;
  action?: string;
  limit?: number;
  offset?: number;
  limited?: boolean;
}) {
  const limit = Math.min(input?.limit ?? 50, 200);
  const offset = input?.offset ?? 0;

  const where: Prisma.AuditLogWhereInput = {};
  if (input?.entityType) where.entityType = input.entityType;
  if (input?.entityId) where.entityId = input.entityId;
  if (input?.action) where.action = { contains: input.action };

  // Limited view: content mutations only (not user management)
  if (input?.limited) {
    where.entityType = {
      in: ["Service", "Solution", "Platform", "HomepageContent", "Redirect"],
    };
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, limit, offset };
}

export async function countRecentAudit(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.auditLog.count({
    where: { createdAt: { gte: since } },
  });
}
