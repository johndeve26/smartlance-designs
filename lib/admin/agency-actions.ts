"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import { AGENCY_PROJECT_STATUS_LABELS } from "@/lib/agency/constants";
import { prisma } from "@/lib/db";
import {
  addAgencyProjectMemberSchema,
  adminApproveDeliverableSchema,
  addDeliverableVersionSchema,
  agencyProjectStatusActionSchema,
  completeAgencyTaskSchema,
  convertWonDealSchema,
  createAgencyDeliverableSchema,
  createAgencyProjectSchema,
  createAgencyRequirementSchema,
  createAgencyTaskSchema,
  createAgencyTemplateSchema,
  instantiateTemplateSchema,
  markRequirementReceivedSchema,
  reorderAgencyMilestonesSchema,
  submitDeliverableForReviewSchema,
  updateAgencyMilestoneSchema,
  updateAgencyProjectSchema,
  updateAgencyTaskSchema,
  updateAgencyTemplateSchema,
} from "@/lib/agency/schema";
import {
  addMember,
  createProject,
  updateProject,
} from "@/lib/agency/projects";
import {
  adminOverrideApproveDeliverable,
  addDeliverableVersion,
  createDeliverable,
  submitDeliverableForReview,
} from "@/lib/agency/deliverables";
import { convertWonDealToProject } from "@/lib/agency/deal-conversion";
import { reorderMilestones, updateMilestone } from "@/lib/agency/milestones";
import { createRequirement, markRequirementReceived } from "@/lib/agency/requirements";
import {
  cancelAgencyProject,
  completeAgencyProject,
  holdAgencyProject,
  reopenAgencyProject,
  resumeAgencyProject,
  startAgencyProject,
  updateAgencyProjectHealth,
} from "@/lib/agency/status";
import {
  completeTask,
  createTask,
  updateTask,
} from "@/lib/agency/tasks";
import {
  createTemplate,
  instantiateTemplateIntoProject,
  installStarterTemplates,
  updateTemplate,
} from "@/lib/agency/templates";

function revalidateAgency(projectId?: string) {
  revalidatePath("/admin/agency");
  revalidatePath("/admin/agency/projects");
  if (projectId) {
    revalidatePath(`/admin/agency/projects/${projectId}`);
  }
}

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createAgencyProjectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = createAgencyProjectSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const project = await createProject({
      ...parsed.data,
      clientCompanyId: parsed.data.clientCompanyId || null,
      customServiceName: parsed.data.customServiceName || null,
      cmsServiceSlug: parsed.data.cmsServiceSlug || null,
      ownerId: parsed.data.ownerId || user.id,
      createdById: user.id,
      summary: parsed.data.summary || null,
      internalNotes: parsed.data.internalNotes || null,
      templateId: parsed.data.templateId || null,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "agency.project.create",
      entityType: "AgencyProject",
      entityId: project?.id,
      metadata: { projectNumber: project?.projectNumber },
    });

    revalidateAgency(project?.id);
    return { ok: true as const, id: project?.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create project.",
    };
  }
}

export async function updateAgencyProjectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = updateAgencyProjectSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const project = await updateProject({
      ...parsed.data,
      clientCompanyId:
        parsed.data.clientCompanyId === undefined
          ? undefined
          : parsed.data.clientCompanyId || null,
      customServiceName:
        parsed.data.customServiceName === undefined
          ? undefined
          : parsed.data.customServiceName || null,
      cmsServiceSlug:
        parsed.data.cmsServiceSlug === undefined
          ? undefined
          : parsed.data.cmsServiceSlug || null,
      ownerId: parsed.data.ownerId === undefined ? undefined : parsed.data.ownerId || null,
      summary: parsed.data.summary === undefined ? undefined : parsed.data.summary || null,
      internalNotes:
        parsed.data.internalNotes === undefined ? undefined : parsed.data.internalNotes || null,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "agency.project.update",
      entityType: "AgencyProject",
      entityId: parsed.data.projectId,
    });

    revalidateAgency(parsed.data.projectId);
    return { ok: true as const, id: project?.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update project.",
    };
  }
}

async function projectStatusAction(
  formData: FormData,
  handler: (input: { projectId: string; actorUserId: string }) => Promise<unknown>,
  auditAction: string,
) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = agencyProjectStatusActionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await handler({ projectId: parsed.data.projectId, actorUserId: user.id });
    await writeAuditLog({
      actorId: user.id,
      action: auditAction,
      entityType: "AgencyProject",
      entityId: parsed.data.projectId,
    });
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update project status.",
    };
  }
}

export async function startAgencyProjectAction(formData: FormData) {
  return projectStatusAction(formData, startAgencyProject, "agency.project.start");
}

export async function holdAgencyProjectAction(formData: FormData) {
  return projectStatusAction(formData, holdAgencyProject, "agency.project.hold");
}

export async function resumeAgencyProjectAction(formData: FormData) {
  return projectStatusAction(formData, resumeAgencyProject, "agency.project.resume");
}

export async function completeAgencyProjectAction(formData: FormData) {
  return projectStatusAction(formData, completeAgencyProject, "agency.project.complete");
}

export async function cancelAgencyProjectAction(formData: FormData) {
  return projectStatusAction(formData, cancelAgencyProject, "agency.project.cancel");
}

export async function reopenAgencyProjectAction(formData: FormData) {
  return projectStatusAction(formData, reopenAgencyProject, "agency.project.reopen");
}

export async function addAgencyProjectMemberAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = addAgencyProjectMemberSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await addMember({ ...parsed.data, actorUserId: user.id });
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not add member.",
    };
  }
}

export async function convertWonDealAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = convertWonDealSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await convertWonDealToProject({
      dealId: parsed.data.dealId,
      actorUserId: user.id,
      name: parsed.data.name,
      serviceType: parsed.data.serviceType,
      ownerId: parsed.data.ownerId || null,
      templateId: parsed.data.templateId || null,
    });

    if (result.created) {
      await writeAuditLog({
        actorId: user.id,
        action: "agency.deal.convert",
        entityType: "AgencyProject",
        entityId: result.project.id,
        metadata: { dealId: parsed.data.dealId },
      });
    }

    revalidateAgency(result.project.id);
    revalidatePath("/admin/crm/deals");
    return { ok: true as const, id: result.project.id, created: result.created };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not convert deal.",
    };
  }
}

export async function createAgencyTemplateAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_project_templates");

  const parsed = createAgencyTemplateSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const template = await createTemplate({
      ...parsed.data,
      description: parsed.data.description || null,
      createdById: user.id,
    });
    revalidatePath("/admin/agency/templates");
    return { ok: true as const, id: template.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create template.",
    };
  }
}

export async function updateAgencyTemplateAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_project_templates");

  const parsed = updateAgencyTemplateSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await updateTemplate({
      ...parsed.data,
      description:
        parsed.data.description === undefined ? undefined : parsed.data.description || null,
      updatedById: user.id,
    });
    revalidatePath("/admin/agency/templates");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update template.",
    };
  }
}

export async function instantiateTemplateAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_project_templates");

  const parsed = instantiateTemplateSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await instantiateTemplateIntoProject({
      ...parsed.data,
      actorUserId: user.id,
    });
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not apply template.",
    };
  }
}

export async function installStarterTemplatesAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_project_templates");

  try {
    const result = await installStarterTemplates(user.id);
    await writeAuditLog({
      actorId: user.id,
      action: "agency.templates.install_starters",
      entityType: "AgencyProjectTemplate",
      metadata: { created: result.created, skipped: result.skipped },
    });
    revalidatePath("/admin/agency/templates");
    return { ok: true as const, ...result };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not install starter templates.",
    };
  }
}

/** @deprecated Use installStarterTemplatesAction */
export async function seedAgencyTemplatesAction() {
  return installStarterTemplatesAction();
}

export async function updateAgencyMilestoneAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = updateAgencyMilestoneSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const milestone = await updateMilestone({
      ...parsed.data,
      description:
        parsed.data.description === undefined ? undefined : parsed.data.description || null,
      actorUserId: user.id,
    });
    revalidateAgency(milestone.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update milestone.",
    };
  }
}

export async function reorderAgencyMilestonesAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_project_templates");

  const rawIds = formData.getAll("milestoneIds").map(String);
  const parsed = reorderAgencyMilestonesSchema.safeParse({
    projectId: formData.get("projectId"),
    milestoneIds: rawIds,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await reorderMilestones(parsed.data);
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not reorder milestones.",
    };
  }
}

export async function createAgencyTaskAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = createAgencyTaskSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const task = await createTask({
      ...parsed.data,
      milestoneId: parsed.data.milestoneId || null,
      description: parsed.data.description || null,
      assigneeId: parsed.data.assigneeId || null,
      createdById: user.id,
    });
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const, id: task.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create task.",
    };
  }
}

export async function updateAgencyTaskAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = updateAgencyTaskSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const task = await updateTask({
      ...parsed.data,
      description:
        parsed.data.description === undefined ? undefined : parsed.data.description || null,
      assigneeId:
        parsed.data.assigneeId === undefined ? undefined : parsed.data.assigneeId || null,
      milestoneId:
        parsed.data.milestoneId === undefined ? undefined : parsed.data.milestoneId || null,
      blockedReason:
        parsed.data.blockedReason === undefined ? undefined : parsed.data.blockedReason || null,
      actorUserId: user.id,
    });
    revalidateAgency(task.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update task.",
    };
  }
}

export async function completeAgencyTaskAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = completeAgencyTaskSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const task = await completeTask({
      taskId: parsed.data.taskId,
      actorUserId: user.id,
    });
    revalidateAgency(task.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not complete task.",
    };
  }
}

export async function createAgencyRequirementAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_project_templates");

  const parsed = createAgencyRequirementSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const requirement = await createRequirement({
      ...parsed.data,
      milestoneId: parsed.data.milestoneId || null,
      description: parsed.data.description || null,
    });
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const, id: requirement.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create requirement.",
    };
  }
}

export async function markRequirementReceivedAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = markRequirementReceivedSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const requirement = await markRequirementReceived({
      requirementId: parsed.data.requirementId,
      actorUserId: user.id,
    });
    revalidateAgency(requirement.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not mark requirement received.",
    };
  }
}

export async function createAgencyDeliverableAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = createAgencyDeliverableSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const deliverable = await createDeliverable({
      ...parsed.data,
      milestoneId: parsed.data.milestoneId || null,
      description: parsed.data.description || null,
      createdById: user.id,
    });
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const, id: deliverable.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create deliverable.",
    };
  }
}

export async function addDeliverableVersionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = addDeliverableVersionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const version = await addDeliverableVersion({
      ...parsed.data,
      externalUrl: parsed.data.externalUrl || null,
      notes: parsed.data.notes || null,
      createdById: user.id,
    });
    const deliverable = await import("@/lib/agency/deliverables").then((m) =>
      m.getDeliverableById(parsed.data.deliverableId),
    );
    if (deliverable) revalidateAgency(deliverable.projectId);
    return { ok: true as const, id: version.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not add deliverable version.",
    };
  }
}

export async function submitDeliverableForReviewAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = submitDeliverableForReviewSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await submitDeliverableForReview({
      ...parsed.data,
      actorUserId: user.id,
    });
    revalidateAgency(result.deliverable.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not submit deliverable.",
    };
  }
}

export async function adminApproveDeliverableAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = adminApproveDeliverableSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await adminOverrideApproveDeliverable({
      ...parsed.data,
      comment: parsed.data.comment || null,
      actorUserId: user.id,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "agency.deliverable.admin_approve",
      entityType: "AgencyDeliverable",
      entityId: parsed.data.deliverableId,
      metadata: { versionId: parsed.data.versionId },
    });

    revalidateAgency(result.deliverable.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not approve deliverable.",
    };
  }
}

export async function updateAgencyProjectHealthAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const projectId = String(formData.get("projectId") ?? "");
  const health = String(formData.get("health") ?? "");
  const parsed = updateAgencyProjectSchema
    .pick({ projectId: true, health: true })
    .safeParse({ projectId, health });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await updateAgencyProjectHealth({
      projectId: parsed.data.projectId,
      health: parsed.data.health,
      actorUserId: user.id,
    });
    revalidateAgency(parsed.data.projectId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update project health.",
    };
  }
}

export async function updateProjectStatusAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");
  const parsed = updateAgencyProjectSchema
    .pick({ projectId: true })
    .extend({ status: updateAgencyProjectSchema.shape.serviceType.optional() })
    .safeParse({ projectId });

  const statusParsed = z.enum([
    "PLANNING",
    "ONBOARDING",
    "IN_PROGRESS",
    "CLIENT_REVIEW",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
  ]).safeParse(status);

  if (!parsed.success || !statusParsed.success) {
    return { ok: false as const, error: "Invalid project status input." };
  }

  try {
    const before = await prisma.agencyProject.findUniqueOrThrow({
      where: { id: projectId },
    });

    const project = await prisma.agencyProject.update({
      where: { id: projectId },
      data: {
        status: statusParsed.data,
        completedAt: statusParsed.data === "COMPLETED" ? new Date() : before.completedAt,
        cancelledAt: statusParsed.data === "CANCELLED" ? new Date() : before.cancelledAt,
      },
    });

    if (before.status !== statusParsed.data) {
      await recordAgencyProjectActivity({
        projectId,
        type: "STATUS_CHANGED",
        summary: `Status changed from ${AGENCY_PROJECT_STATUS_LABELS[before.status]} to ${AGENCY_PROJECT_STATUS_LABELS[statusParsed.data]}.`,
        actorUserId: user.id,
        metadata: { from: before.status, to: statusParsed.data },
      });
    }

    revalidateAgency(projectId);
    return { ok: true as const, id: project.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update project status.",
    };
  }
}

export async function archiveTemplateAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_project_templates");

  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) {
    return { ok: false as const, error: "Template is required." };
  }

  try {
    await updateTemplate({
      templateId,
      isArchived: true,
      updatedById: user.id,
    });
    revalidatePath("/admin/agency/templates");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not archive template.",
    };
  }
}
