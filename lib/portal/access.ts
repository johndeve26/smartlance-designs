import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { can } from "@/lib/admin/rbac";

export async function listAccessibleProjectIds(portalUserId: string) {
  const rows = await prisma.agencyProjectClientAccess.findMany({
    where: {
      portalUserId,
      revokedAt: null,
      project: {
        clientVisibilityEnabled: true,
        status: { not: "CANCELLED" },
      },
    },
    select: { projectId: true },
  });
  return rows.map((row) => row.projectId);
}

export async function hasProjectAccess(input: {
  projectId: string;
  contactId?: string;
  portalUserId?: string;
}) {
  if (!input.contactId && !input.portalUserId) return false;

  const access = await prisma.agencyProjectClientAccess.findFirst({
    where: {
      projectId: input.projectId,
      revokedAt: null,
      ...(input.portalUserId
        ? { portalUserId: input.portalUserId }
        : { contactId: input.contactId! }),
    },
    include: {
      project: {
        select: {
          clientVisibilityEnabled: true,
          status: true,
        },
      },
    },
  });

  if (!access) return false;
  if (!access.project.clientVisibilityEnabled) return false;
  if (access.project.status === "CANCELLED") return false;

  return true;
}

export async function assertProjectAccess(input: {
  projectId: string;
  contactId?: string;
  portalUserId?: string;
}) {
  const allowed = await hasProjectAccess(input);
  if (!allowed) {
    throw new Error("You do not have access to this project.");
  }
}

export async function listAccessibleProjects(input: {
  contactId?: string;
  portalUserId?: string;
}) {
  if (!input.contactId && !input.portalUserId) return [];

  const rows = await prisma.agencyProjectClientAccess.findMany({
    where: {
      revokedAt: null,
      ...(input.portalUserId
        ? { portalUserId: input.portalUserId }
        : { contactId: input.contactId! }),
      project: {
        clientVisibilityEnabled: true,
        status: { not: "CANCELLED" },
      },
    },
    orderBy: { grantedAt: "desc" },
    include: {
      project: {
        include: {
          owner: { select: { id: true, name: true } },
          primaryContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              deliverables: true,
              requirements: true,
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    accessId: row.id,
    role: row.role,
    grantedAt: row.grantedAt,
    project: row.project,
  }));
}

export async function portalUserCanAccessProject(portalUserId: string, projectId: string) {
  return hasProjectAccess({ projectId, portalUserId });
}

export async function getAccessibleProjectById(input: {
  projectId: string;
  contactId?: string;
  portalUserId?: string;
}) {
  const allowed = await hasProjectAccess(input);
  if (!allowed) return null;

  return prisma.agencyProject.findUnique({
    where: { id: input.projectId },
    include: {
      milestones: {
        where: { clientVisible: true },
        orderBy: { position: "asc" },
      },
      requirements: {
        where: { clientVisible: true },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      },
      deliverables: {
        where: { clientVisible: true },
        orderBy: { updatedAt: "desc" },
        include: {
          versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        },
      },
      updates: {
        where: { clientVisible: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      activities: {
        where: { clientVisible: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function canAccessAgencyProject(input: {
  projectId: string;
  adminRole?: AdminRole | null;
  portalUserId?: string | null;
}) {
  if (input.adminRole && can(input.adminRole, "view_projects")) {
    return true;
  }
  if (input.portalUserId) {
    return hasProjectAccess({
      projectId: input.projectId,
      portalUserId: input.portalUserId,
    });
  }
  return false;
}
