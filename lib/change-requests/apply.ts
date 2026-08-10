import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import { recordChangeRequestActivity } from "@/lib/change-requests/activity";

function addCalendarDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function isPaymentGateSatisfied(changeRequestId: string) {
  const cr = await prisma.agencyChangeRequest.findUniqueOrThrow({
    where: { id: changeRequestId },
    include: {
      approval: true,
      invoice: { select: { status: true, amountDueMinor: true } },
    },
  });

  if (!cr.requirePaymentBeforeImplementation) return true;
  if (!cr.approval || cr.approval.approvedPriceImpactMinor <= 0) return true;
  if (!cr.invoice) return false;
  return cr.invoice.status === "PAID" || cr.invoice.amountDueMinor <= 0;
}

export async function applyChangeRequestToProject(input: {
  changeRequestId: string;
  appliedById: string;
  milestoneId?: string | null;
  applyTargetDate?: boolean;
}) {
  const paymentOk = await isPaymentGateSatisfied(input.changeRequestId);
  if (!paymentOk) {
    throw new Error("Confirmed payment is required before applying this change.");
  }

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: string; status: string; projectId: string; changeRequestNumber: string }>
    >`
      SELECT id, status, "projectId", "changeRequestNumber"
      FROM "AgencyChangeRequest"
      WHERE id = ${input.changeRequestId}
      FOR UPDATE
    `;
    const locked = rows[0];
    if (!locked) throw new Error("Change request not found.");
    if (locked.status !== "APPROVED") {
      if (locked.status === "APPLIED" || locked.status === "IMPLEMENTED") {
        const existing = await tx.agencyChangeRequestApplication.findUnique({
          where: { changeRequestId: input.changeRequestId },
        });
        if (existing) return existing;
      }
      throw new Error("Only approved change requests can be applied.");
    }

    const existingApp = await tx.agencyChangeRequestApplication.findUnique({
      where: { changeRequestId: input.changeRequestId },
    });
    if (existingApp) return existingApp;

    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
      include: {
        approval: true,
        assessments: {
          where: { supersededAt: null },
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        workItems: { orderBy: { position: "asc" } },
        project: { select: { id: true, targetDueDate: true } },
      },
    });

    const assessment = cr.approval
      ? cr.assessments.find((a) => a.id === cr.approval!.assessmentId) ?? cr.assessments[0]
      : cr.assessments[0];

    const timelineImpactDays =
      cr.approval?.approvedTimelineImpactDays ?? assessment?.timelineImpactDays ?? 0;

    let previousTargetDueDate = cr.project.targetDueDate;
    let newTargetDueDate = cr.project.targetDueDate;

    if (input.applyTargetDate && timelineImpactDays > 0 && cr.project.targetDueDate) {
      newTargetDueDate = addCalendarDays(cr.project.targetDueDate, timelineImpactDays);
      await tx.agencyProject.update({
        where: { id: cr.projectId },
        data: { targetDueDate: newTargetDueDate },
      });
    }

    const created: {
      tasks: string[];
      deliverables: string[];
      requirements: string[];
    } = { tasks: [], deliverables: [], requirements: [] };

    for (const item of cr.workItems) {
      if (item.type === "TASK") {
        const task = await tx.agencyProjectTask.create({
          data: {
            projectId: cr.projectId,
            milestoneId: input.milestoneId ?? null,
            title: item.title,
            description: item.description,
            clientVisible: item.clientVisible,
            changeRequestId: cr.id,
            createdById: input.appliedById,
            position: item.position,
          },
        });
        created.tasks.push(task.id);
      } else if (item.type === "DELIVERABLE") {
        const deliverable = await tx.agencyDeliverable.create({
          data: {
            projectId: cr.projectId,
            milestoneId: input.milestoneId ?? null,
            title: item.title,
            description: item.description,
            clientVisible: item.clientVisible,
            changeRequestId: cr.id,
            createdById: input.appliedById,
          },
        });
        created.deliverables.push(deliverable.id);
      } else if (item.type === "REQUIREMENT") {
        const requirement = await tx.agencyClientRequirement.create({
          data: {
            projectId: cr.projectId,
            milestoneId: input.milestoneId ?? null,
            title: item.title,
            description: item.description,
            clientVisible: item.clientVisible,
            changeRequestId: cr.id,
          },
        });
        created.requirements.push(requirement.id);
      }
    }

    const application = await tx.agencyChangeRequestApplication.create({
      data: {
        changeRequestId: cr.id,
        appliedById: input.appliedById,
        previousTargetDueDate,
        newTargetDueDate,
        applicationSnapshotJson: {
          workItems: cr.workItems.map((w) => ({
            id: w.id,
            type: w.type,
            title: w.title,
          })),
          created,
          timelineImpactDays,
        },
      },
    });

    await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "APPLIED", appliedAt: new Date() },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "APPLIED_TO_PROJECT",
        summary: `Change request applied to project.`,
        actorUserId: input.appliedById,
        clientVisible: true,
        metadata: { applicationId: application.id },
      },
      tx,
    );

    await recordAgencyProjectActivity({
      projectId: cr.projectId,
      type: "UPDATE_POSTED",
      summary: `Approved change request ${cr.changeRequestNumber} applied to project.`,
      actorUserId: input.appliedById,
      clientVisible: true,
    });

    return application;
  });
}

export async function previewChangeApplication(changeRequestId: string) {
  const cr = await prisma.agencyChangeRequest.findUniqueOrThrow({
    where: { id: changeRequestId },
    include: {
      approval: true,
      assessments: {
        where: { supersededAt: null },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      workItems: { orderBy: { position: "asc" } },
      project: { select: { targetDueDate: true } },
    },
  });

  const timelineImpactDays =
    cr.approval?.approvedTimelineImpactDays ?? cr.assessments[0]?.timelineImpactDays ?? 0;

  let proposedTargetDueDate: Date | null = cr.project.targetDueDate;
  if (timelineImpactDays > 0 && cr.project.targetDueDate) {
    proposedTargetDueDate = addCalendarDays(cr.project.targetDueDate, timelineImpactDays);
  }

  const paymentGateSatisfied = await isPaymentGateSatisfied(changeRequestId);

  return {
    workItems: cr.workItems,
    currentTargetDueDate: cr.project.targetDueDate,
    timelineImpactDays,
    proposedTargetDueDate,
    paymentGateSatisfied,
    requirePaymentBeforeImplementation: cr.requirePaymentBeforeImplementation,
  };
}
