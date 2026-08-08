import { prisma } from "@/lib/db";
import type { AdminRole, AdminUserStatus, Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/admin/crypto";
import { revokeAllSessionsForUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export async function listAdminUsers() {
  return prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  actorId: string;
}) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.adminUser.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
      status: "ACTIVE",
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "admin.user.create",
    entityType: "AdminUser",
    entityId: user.id,
    metadata: { email, role: input.role },
  });
  return user;
}

export const LAST_SUPER_ADMIN_ERROR =
  "Cannot disable or demote the last active Super Admin. Promote another Super Admin first.";

export async function updateAdminUser(input: {
  id: string;
  actorId: string;
  name?: string;
  role?: AdminRole;
  status?: AdminUserStatus;
}) {
  const existing = await prisma.adminUser.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("User not found.");

  const wouldDisable =
    input.status === "DISABLED" && existing.status === "ACTIVE";
  const wouldDemoteSuper =
    existing.role === "SUPER_ADMIN" &&
    input.role !== undefined &&
    input.role !== "SUPER_ADMIN";

  const guardsLastSuperAdmin =
    existing.role === "SUPER_ADMIN" &&
    existing.status === "ACTIVE" &&
    (wouldDisable || wouldDemoteSuper);

  const data: Prisma.AdminUserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.role !== undefined) data.role = input.role;
  if (input.status !== undefined) data.status = input.status;

  /**
   * Counting Super Admins outside the write transaction lets two concurrent
   * demotions each observe two survivors and lock everyone out of admin.
   * Serializable isolation makes Postgres abort the losing transaction.
   */
  const user = guardsLastSuperAdmin
    ? await prisma.$transaction(
        async (tx) => {
          const activeSupers = await tx.adminUser.count({
            where: { role: "SUPER_ADMIN", status: "ACTIVE" },
          });
          if (activeSupers <= 1) {
            throw new Error(LAST_SUPER_ADMIN_ERROR);
          }
          return tx.adminUser.update({ where: { id: input.id }, data });
        },
        { isolationLevel: "Serializable" },
      )
    : await prisma.adminUser.update({ where: { id: input.id }, data });

  if (input.status === "DISABLED" || wouldDemoteSuper) {
    await revokeAllSessionsForUser(user.id);
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "admin.user.update",
    entityType: "AdminUser",
    entityId: user.id,
    metadata: {
      name: input.name,
      role: input.role,
      status: input.status,
    },
  });

  return user;
}

export async function countAdminUsers() {
  return prisma.adminUser.count();
}
