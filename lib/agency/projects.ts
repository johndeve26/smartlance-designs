import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import {
  AGENCY_PAGE_SIZE_DEFAULT,
  AGENCY_PAGE_SIZE_MAX,
} from "@/lib/agency/constants";
import { generateAgencyProjectNumber } from "@/lib/agency/project-number";
import { instantiateTemplateIntoProject } from "@/lib/agency/templates";
import type { AgencyProjectFilters } from "@/lib/agency/schema";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? AGENCY_PAGE_SIZE_DEFAULT,
    AGENCY_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

function buildProjectWhere(filters?: AgencyProjectFilters): Prisma.AgencyProjectWhereInput {
  const where: Prisma.AgencyProjectWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.health) where.health = filters.health;
  if (filters?.ownerId) where.ownerId = filters.ownerId;
  if (filters?.serviceType) where.serviceType = filters.serviceType;
  if (filters?.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { projectNumber: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

const projectInclude = {
  clientCompany: { select: { id: true, name: true } },
  primaryContact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      email: true,
    },
  },
  owner: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  _count: {
    select: {
      tasks: true,
      milestones: true,
      deliverables: true,
      requirements: true,
    },
  },
} satisfies Prisma.AgencyProjectInclude;

export async function listProjects(input?: {
  filters?: AgencyProjectFilters;
  page?: number;
  pageSize?: number;
}) {
  const { page, pageSize } = boundedPage(input);
  const where = buildProjectWhere(input?.filters);

  const [items, total] = await Promise.all([
    prisma.agencyProject.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: projectInclude,
    }),
    prisma.agencyProject.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getProjectById(projectId: string) {
  return prisma.agencyProject.findUnique({
    where: { id: projectId },
    include: {
      ...projectInclude,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      milestones: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, name: true } },
            },
          },
        },
      },
      tasks: {
        where: { milestoneId: null },
        orderBy: { position: "asc" },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
      requirements: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
      deliverables: {
        orderBy: { updatedAt: "desc" },
        include: {
          versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        },
      },
      clientAccess: {
        where: { revokedAt: null },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
            },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      sourceDeal: { select: { id: true, title: true, stage: true } },
      sourceProposal: {
        select: { id: true, proposalNumber: true, title: true, status: true },
      },
    },
  });
}

export async function listAdminUsersForSelect() {
  return prisma.adminUser.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function createProject(input: {
  name: string;
  primaryContactId: string;
  clientCompanyId?: string | null;
  serviceType: Prisma.AgencyProjectCreateInput["serviceType"];
  customServiceName?: string | null;
  cmsServiceSlug?: string | null;
  ownerId: string;
  createdById: string;
  startDate?: Date | null;
  targetDueDate?: Date | null;
  budgetSnapshot?: number | null;
  currency?: string | null;
  summary?: string | null;
  internalNotes?: string | null;
  clientVisibilityEnabled?: boolean;
  caseStudyCandidate?: boolean;
  templateId?: string | null;
}) {
  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.primaryContactId },
  });

  const project = await prisma.$transaction(async (tx) => {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const projectNumber = await generateAgencyProjectNumber(tx);

      try {
        const created = await tx.agencyProject.create({
          data: {
            projectNumber,
            name: input.name.trim(),
            primaryContactId: input.primaryContactId,
            clientCompanyId: input.clientCompanyId ?? contact.companyId,
            serviceType: input.serviceType as never,
            customServiceName: input.customServiceName?.trim() || null,
            cmsServiceSlug: input.cmsServiceSlug?.trim() || null,
            ownerId: input.ownerId,
            createdById: input.createdById,
            startDate: input.startDate ?? null,
            targetDueDate: input.targetDueDate ?? null,
            budgetSnapshot: input.budgetSnapshot ?? null,
            currency: input.currency ?? "USD",
            summary: input.summary?.trim() || null,
            internalNotes: input.internalNotes?.trim() || null,
            clientVisibilityEnabled: input.clientVisibilityEnabled ?? true,
            caseStudyCandidate: input.caseStudyCandidate ?? false,
            members: {
              create: {
                userId: input.ownerId,
                role: "OWNER",
              },
            },
          },
        });

        await recordAgencyProjectActivity(
          {
            projectId: created.id,
            type: "PROJECT_CREATED",
            summary: `Project ${created.projectNumber} created.`,
            actorUserId: input.createdById,
            clientVisible: true,
          },
          tx,
        );

        if (input.templateId) {
          await instantiateTemplateIntoProject(
            {
              projectId: created.id,
              templateId: input.templateId,
              actorUserId: input.createdById,
            },
            tx,
          );
        }

        return created;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "P2002" && attempt < maxAttempts - 1) {
          continue;
        }
        throw err;
      }
    }

    throw new Error("Failed to allocate a unique project number.");
  });

  return getProjectById(project.id);
}

export async function updateProject(input: {
  projectId: string;
  name?: string;
  clientCompanyId?: string | null;
  primaryContactId?: string;
  serviceType?: Prisma.AgencyProjectUpdateInput["serviceType"];
  customServiceName?: string | null;
  cmsServiceSlug?: string | null;
  ownerId?: string | null;
  health?: Prisma.AgencyProjectUpdateInput["health"];
  startDate?: Date | null;
  targetDueDate?: Date | null;
  budgetSnapshot?: number | null;
  currency?: string | null;
  summary?: string | null;
  internalNotes?: string | null;
  clientVisibilityEnabled?: boolean;
  caseStudyCandidate?: boolean;
}) {
  const data: Prisma.AgencyProjectUpdateInput = {};

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.clientCompanyId !== undefined) {
    data.clientCompany = input.clientCompanyId
      ? { connect: { id: input.clientCompanyId } }
      : { disconnect: true };
  }
  if (input.primaryContactId !== undefined) {
    data.primaryContact = { connect: { id: input.primaryContactId } };
  }
  if (input.serviceType !== undefined) data.serviceType = input.serviceType as never;
  if (input.customServiceName !== undefined) {
    data.customServiceName = input.customServiceName?.trim() || null;
  }
  if (input.cmsServiceSlug !== undefined) {
    data.cmsServiceSlug = input.cmsServiceSlug?.trim() || null;
  }
  if (input.ownerId !== undefined && input.ownerId) {
    data.owner = { connect: { id: input.ownerId } };
  }
  if (input.health !== undefined) data.health = input.health as never;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.targetDueDate !== undefined) data.targetDueDate = input.targetDueDate;
  if (input.budgetSnapshot !== undefined) data.budgetSnapshot = input.budgetSnapshot;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.summary !== undefined) data.summary = input.summary?.trim() || null;
  if (input.internalNotes !== undefined) {
    data.internalNotes = input.internalNotes?.trim() || null;
  }
  if (input.clientVisibilityEnabled !== undefined) {
    data.clientVisibilityEnabled = input.clientVisibilityEnabled;
  }
  if (input.caseStudyCandidate !== undefined) {
    data.caseStudyCandidate = input.caseStudyCandidate;
  }

  await prisma.agencyProject.update({
    where: { id: input.projectId },
    data,
  });

  if (input.ownerId) {
    await prisma.agencyProjectMember.upsert({
      where: {
        projectId_userId: {
          projectId: input.projectId,
          userId: input.ownerId,
        },
      },
      create: {
        projectId: input.projectId,
        userId: input.ownerId,
        role: "OWNER",
      },
      update: { role: "OWNER" },
    });
  }

  return getProjectById(input.projectId);
}

export async function addMember(input: {
  projectId: string;
  userId: string;
  role?: Prisma.AgencyProjectMemberCreateInput["role"];
  actorUserId: string;
}) {
  const member = await prisma.agencyProjectMember.upsert({
    where: {
      projectId_userId: {
        projectId: input.projectId,
        userId: input.userId,
      },
    },
    create: {
      projectId: input.projectId,
      userId: input.userId,
      role: (input.role ?? "MEMBER") as never,
    },
    update: {
      role: (input.role ?? "MEMBER") as never,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  await recordAgencyProjectActivity({
    projectId: input.projectId,
    type: "MEMBER_ADDED",
    summary: `${member.user.name ?? member.user.email} added to project.`,
    actorUserId: input.actorUserId,
    entityType: "AgencyProjectMember",
    entityId: member.id,
  });

  return member;
}

export async function getProjectByDealId(dealId: string) {
  return prisma.agencyProject.findUnique({
    where: { sourceDealId: dealId },
    select: { id: true, name: true, projectNumber: true, status: true },
  });
}

export async function listProjectsForContact(contactId: string) {
  return prisma.agencyProject.findMany({
    where: {
      OR: [
        { primaryContactId: contactId },
        { clientAccess: { some: { contactId, revokedAt: null } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      projectNumber: true,
      name: true,
      status: true,
      health: true,
      targetDueDate: true,
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function listProjectsForCompany(companyId: string) {
  return prisma.agencyProject.findMany({
    where: { clientCompanyId: companyId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      projectNumber: true,
      name: true,
      status: true,
      health: true,
      targetDueDate: true,
      primaryContact: {
        select: { id: true, firstName: true, lastName: true, displayName: true },
      },
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function getProjectAdminDetail(projectId: string) {
  return prisma.agencyProject.findUnique({
    where: { id: projectId },
    include: {
      clientCompany: { select: { id: true, name: true } },
      primaryContact: {
        include: { company: { select: { id: true, name: true } } },
      },
      owner: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      sourceDeal: { select: { id: true, title: true, stage: true } },
      sourceProposal: {
        select: { id: true, proposalNumber: true, title: true, status: true },
      },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      milestones: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: { assignee: { select: { id: true, name: true } } },
          },
        },
      },
      tasks: {
        where: { milestoneId: null },
        orderBy: { position: "asc" },
        include: { assignee: { select: { id: true, name: true } } },
      },
      requirements: { orderBy: { createdAt: "asc" } },
      deliverables: {
        orderBy: { createdAt: "asc" },
        include: {
          versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        },
      },
      clientAccess: {
        where: { revokedAt: null },
        include: {
          contact: true,
          grantedBy: { select: { id: true, name: true } },
        },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
}
