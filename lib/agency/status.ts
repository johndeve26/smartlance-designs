import type { AgencyProjectStatus, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import {
  ACTIVE_AGENCY_PROJECT_STATUSES,
  AGENCY_PROJECT_STATUS_LABELS,
  TERMINAL_AGENCY_PROJECT_STATUSES,
} from "@/lib/agency/constants";

export class AgencyProjectStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgencyProjectStatusError";
  }
}

const STARTABLE: AgencyProjectStatus[] = ["PLANNING"];
const HOLDABLE: AgencyProjectStatus[] = [
  "ONBOARDING",
  "IN_PROGRESS",
  "CLIENT_REVIEW",
];
const RESUMABLE: AgencyProjectStatus[] = ["ON_HOLD"];
const COMPLETABLE: AgencyProjectStatus[] = [
  "PLANNING",
  "ONBOARDING",
  "IN_PROGRESS",
  "CLIENT_REVIEW",
  "ON_HOLD",
];
const CANCELLABLE: AgencyProjectStatus[] = [
  "PLANNING",
  "ONBOARDING",
  "IN_PROGRESS",
  "CLIENT_REVIEW",
  "ON_HOLD",
];
const REOPENABLE: AgencyProjectStatus[] = ["COMPLETED", "CANCELLED"];

function assertStatus(
  current: AgencyProjectStatus,
  allowed: AgencyProjectStatus[],
  action: string,
) {
  if (!allowed.includes(current)) {
    throw new AgencyProjectStatusError(
      `Cannot ${action} project in ${AGENCY_PROJECT_STATUS_LABELS[current]} status.`,
    );
  }
}

async function transitionProjectStatus(
  input: {
    projectId: string;
    nextStatus: AgencyProjectStatus;
    actorUserId: string;
    data?: Prisma.AgencyProjectUpdateInput;
    clientVisible?: boolean;
  },
  db: Pick<
    PrismaClient,
    "agencyProject" | "agencyProjectActivity"
  > = prisma,
) {
  const before = await db.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });

  if (before.status === input.nextStatus) {
    return before;
  }

  const project = await db.agencyProject.update({
    where: { id: input.projectId },
    data: {
      status: input.nextStatus,
      ...input.data,
    },
  });

  await recordAgencyProjectActivity(
    {
      projectId: project.id,
      type: "STATUS_CHANGED",
      summary: `Status changed from ${AGENCY_PROJECT_STATUS_LABELS[before.status]} to ${AGENCY_PROJECT_STATUS_LABELS[input.nextStatus]}.`,
      actorUserId: input.actorUserId,
      metadata: {
        from: before.status,
        to: input.nextStatus,
      },
      clientVisible: input.clientVisible ?? false,
    },
    db,
  );

  return project;
}

export async function startAgencyProject(input: {
  projectId: string;
  actorUserId: string;
}) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });
  assertStatus(project.status, STARTABLE, "start");

  return transitionProjectStatus({
    projectId: input.projectId,
    nextStatus: "IN_PROGRESS",
    actorUserId: input.actorUserId,
    data: {
      startDate: project.startDate ?? new Date(),
    },
    clientVisible: true,
  });
}

export async function holdAgencyProject(input: {
  projectId: string;
  actorUserId: string;
}) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });
  assertStatus(project.status, HOLDABLE, "hold");

  return transitionProjectStatus({
    projectId: input.projectId,
    nextStatus: "ON_HOLD",
    actorUserId: input.actorUserId,
  });
}

export async function resumeAgencyProject(input: {
  projectId: string;
  actorUserId: string;
}) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });
  assertStatus(project.status, RESUMABLE, "resume");

  return transitionProjectStatus({
    projectId: input.projectId,
    nextStatus: "IN_PROGRESS",
    actorUserId: input.actorUserId,
    clientVisible: true,
  });
}

export async function completeAgencyProject(input: {
  projectId: string;
  actorUserId: string;
}) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });
  assertStatus(project.status, COMPLETABLE, "complete");

  return transitionProjectStatus({
    projectId: input.projectId,
    nextStatus: "COMPLETED",
    actorUserId: input.actorUserId,
    data: {
      completedAt: new Date(),
      cancelledAt: null,
    },
    clientVisible: true,
  });
}

export async function cancelAgencyProject(input: {
  projectId: string;
  actorUserId: string;
}) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });
  assertStatus(project.status, CANCELLABLE, "cancel");

  return transitionProjectStatus({
    projectId: input.projectId,
    nextStatus: "CANCELLED",
    actorUserId: input.actorUserId,
    data: {
      cancelledAt: new Date(),
      completedAt: null,
    },
  });
}

export async function reopenAgencyProject(input: {
  projectId: string;
  actorUserId: string;
}) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });
  assertStatus(project.status, REOPENABLE, "reopen");

  return transitionProjectStatus({
    projectId: input.projectId,
    nextStatus: "IN_PROGRESS",
    actorUserId: input.actorUserId,
    data: {
      completedAt: null,
      cancelledAt: null,
      startDate: project.startDate ?? new Date(),
    },
    clientVisible: true,
  });
}

export async function updateAgencyProjectHealth(input: {
  projectId: string;
  health: Prisma.AgencyProjectUpdateInput["health"];
  actorUserId: string;
}) {
  const before = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
  });

  if (before.health === input.health) {
    return before;
  }

  const project = await prisma.agencyProject.update({
    where: { id: input.projectId },
    data: { health: input.health as never },
  });

  await recordAgencyProjectActivity({
    projectId: project.id,
    type: "HEALTH_CHANGED",
    summary: `Health changed from ${before.health} to ${input.health}.`,
    actorUserId: input.actorUserId,
    metadata: { from: before.health, to: input.health },
  });

  return project;
}

export { ACTIVE_AGENCY_PROJECT_STATUSES, TERMINAL_AGENCY_PROJECT_STATUSES };
