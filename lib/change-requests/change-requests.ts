import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import { generateAgencyChangeRequestNumber } from "@/lib/change-requests/change-request-number";
import { recordChangeRequestActivity } from "@/lib/change-requests/activity";
import { computeAssessmentHash } from "@/lib/change-requests/assessment-hash";
import { getChangeRequestBaseline } from "@/lib/change-requests/commercial-summary";
import { APPROVAL_CONSENT_TEMPLATE } from "@/lib/change-requests/constants";
import { assertSupportedCurrency } from "@/lib/money/currency";

type Tx = Prisma.TransactionClient;

const detailInclude = {
  project: {
    select: {
      id: true,
      name: true,
      projectNumber: true,
      targetDueDate: true,
      clientCompanyId: true,
      primaryContactId: true,
      currency: true,
    },
  },
  requestedByContact: {
    select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
  },
  requestedByPortalUser: { select: { id: true, email: true, contactId: true } },
  requestedByAdminUser: { select: { id: true, name: true, email: true } },
  owner: { select: { id: true, name: true, email: true } },
  proposalAcceptance: {
    select: {
      id: true,
      acceptedAt: true,
      acceptedTotal: true,
      currency: true,
      proposal: { select: { id: true, proposalNumber: true, title: true } },
    },
  },
  contract: { select: { id: true, contractNumber: true, status: true } },
  assessments: { orderBy: { versionNumber: "desc" as const } },
  approval: true,
  decision: true,
  application: true,
  workItems: { orderBy: { position: "asc" as const } },
  clientAccess: {
    where: { revokedAt: null },
    include: {
      contact: {
        select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  messages: { orderBy: { createdAt: "asc" as const } },
  activities: { orderBy: { createdAt: "desc" as const }, take: 50 },
  invoice: { select: { id: true, invoiceNumber: true, status: true, totalMinor: true, amountPaidMinor: true, amountDueMinor: true, currency: true } },
} satisfies Prisma.AgencyChangeRequestInclude;

export async function getChangeRequestById(changeRequestId: string) {
  return prisma.agencyChangeRequest.findUnique({
    where: { id: changeRequestId },
    include: detailInclude,
  });
}

export async function listChangeRequests(input?: {
  filters?: {
    status?: string;
    classification?: string;
    ownerId?: string;
    projectId?: string;
    companyId?: string;
    awaitingClient?: boolean;
    q?: string;
  };
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(input?.pageSize ?? 25, 100);
  const where: Prisma.AgencyChangeRequestWhereInput = {};

  if (input?.filters?.status) where.status = input.filters.status as never;
  if (input?.filters?.classification) {
    where.classification = input.filters.classification as never;
  }
  if (input?.filters?.ownerId) where.ownerId = input.filters.ownerId;
  if (input?.filters?.projectId) where.projectId = input.filters.projectId;
  if (input?.filters?.awaitingClient) {
    where.status = "AWAITING_CLIENT_APPROVAL";
  }
  if (input?.filters?.companyId) {
    where.project = { clientCompanyId: input.filters.companyId };
  }
  if (input?.filters?.q?.trim()) {
    const q = input.filters.q.trim();
    where.OR = [
      { changeRequestNumber: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { project: { name: { contains: q, mode: "insensitive" } } },
      { project: { projectNumber: { contains: q, mode: "insensitive" } } },
      { project: { clientCompany: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.agencyChangeRequest.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            clientCompany: { select: { id: true, name: true } },
          },
        },
        owner: { select: { id: true, name: true } },
        approval: { select: { approvedPriceImpactMinor: true, currency: true } },
        assessments: {
          where: { supersededAt: null },
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: {
            priceImpactMinor: true,
            timelineImpactDays: true,
            currency: true,
          },
        },
      },
    }),
    prisma.agencyChangeRequest.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function listProjectChangeRequests(projectId: string) {
  return prisma.agencyChangeRequest.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      approval: { select: { approvedPriceImpactMinor: true, currency: true } },
      assessments: {
        where: { supersededAt: null },
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { priceImpactMinor: true, timelineImpactDays: true, currency: true, classification: true },
      },
    },
  });
}

async function resolveProjectCurrency(projectId: string) {
  const baseline = await getChangeRequestBaseline(projectId);
  return assertSupportedCurrency(
    baseline.acceptance?.currency ?? baseline.project.currency ?? "USD",
  );
}

export async function createChangeRequest(input: {
  projectId: string;
  title: string;
  requestDescription: string;
  origin: "CLIENT" | "ADMIN";
  createdById: string;
  ownerId?: string | null;
  requestedByPortalUserId?: string | null;
  requestedByAdminUserId?: string | null;
  requestedByContactId?: string | null;
  submit?: boolean;
}) {
  const baseline = await getChangeRequestBaseline(input.projectId);
  const currency = await resolveProjectCurrency(input.projectId);

  return prisma.$transaction(async (tx) => {
    const changeRequestNumber = await generateAgencyChangeRequestNumber(tx);
    const cr = await tx.agencyChangeRequest.create({
      data: {
        changeRequestNumber,
        projectId: input.projectId,
        proposalAcceptanceId: baseline.acceptance?.id ?? null,
        contractId: baseline.contract?.id ?? null,
        origin: input.origin,
        title: input.title.trim(),
        requestDescription: input.requestDescription.trim(),
        status: input.submit ? "SUBMITTED" : "DRAFT",
        currency,
        ownerId: input.ownerId ?? input.createdById,
        requestedByPortalUserId: input.requestedByPortalUserId ?? null,
        requestedByAdminUserId: input.requestedByAdminUserId ?? null,
        requestedByContactId: input.requestedByContactId ?? null,
        createdById: input.createdById,
        submittedAt: input.submit ? new Date() : null,
      },
    });

    await tx.agencyChangeRequestRevision.create({
      data: {
        changeRequestId: cr.id,
        revisionNumber: 1,
        title: cr.title,
        description: cr.requestDescription,
        createdByPortalUserId: input.requestedByPortalUserId ?? null,
        createdByAdminUserId: input.origin === "ADMIN" ? input.createdById : null,
      },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "CREATED",
        summary: `Change request ${changeRequestNumber} created.`,
        actorUserId: input.origin === "ADMIN" ? input.createdById : null,
        actorPortalUserId: input.requestedByPortalUserId ?? null,
        clientVisible: true,
      },
      tx,
    );

    if (input.submit) {
      await recordChangeRequestActivity(
        {
          changeRequestId: cr.id,
          type: "SUBMITTED",
          summary: `Change request submitted for review.`,
          actorUserId: input.origin === "ADMIN" ? input.createdById : null,
          actorPortalUserId: input.requestedByPortalUserId ?? null,
          clientVisible: true,
        },
        tx,
      );
    }

    return cr;
  });
}

export async function submitChangeRequest(input: {
  changeRequestId: string;
  actorPortalUserId?: string;
  actorUserId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });
    if (cr.status !== "DRAFT") {
      throw new Error("Only draft change requests can be submitted.");
    }

    const updated = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "SUBMITTED",
        summary: "Change request submitted for review.",
        actorUserId: input.actorUserId ?? null,
        actorPortalUserId: input.actorPortalUserId ?? null,
        clientVisible: true,
      },
      tx,
    );

    return updated;
  });
}

export async function requestClarification(input: {
  changeRequestId: string;
  message: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });
    if (!["SUBMITTED", "UNDER_ASSESSMENT"].includes(cr.status)) {
      throw new Error("Clarification cannot be requested in the current status.");
    }

    await tx.agencyChangeRequestMessage.create({
      data: {
        changeRequestId: cr.id,
        type: "AGENCY_CLARIFICATION_REQUEST",
        body: input.message.trim(),
        clientVisible: true,
        actorUserId: input.actorUserId,
      },
    });

    const updated = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "NEEDS_CLARIFICATION" },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "CLARIFICATION_REQUESTED",
        summary: "Clarification requested from client.",
        actorUserId: input.actorUserId,
        clientVisible: true,
      },
      tx,
    );

    return updated;
  });
}

export async function respondToClarification(input: {
  changeRequestId: string;
  message: string;
  actorPortalUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });
    if (cr.status !== "NEEDS_CLARIFICATION") {
      throw new Error("This change request is not awaiting clarification.");
    }

    await tx.agencyChangeRequestMessage.create({
      data: {
        changeRequestId: cr.id,
        type: "CLIENT_CLARIFICATION",
        body: input.message.trim(),
        clientVisible: true,
        actorPortalUserId: input.actorPortalUserId,
      },
    });

    const latestRevision = await tx.agencyChangeRequestRevision.aggregate({
      where: { changeRequestId: cr.id },
      _max: { revisionNumber: true },
    });
    const nextRevision = (latestRevision._max.revisionNumber ?? 0) + 1;

    await tx.agencyChangeRequestRevision.create({
      data: {
        changeRequestId: cr.id,
        revisionNumber: nextRevision,
        title: cr.title,
        description: `${cr.requestDescription}\n\n--- Client clarification ---\n${input.message.trim()}`,
        createdByPortalUserId: input.actorPortalUserId,
      },
    });

    const updated = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: {
        status: "SUBMITTED",
        requestDescription: `${cr.requestDescription}\n\n--- Client clarification ---\n${input.message.trim()}`,
      },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "CLARIFICATION_RECEIVED",
        summary: "Client provided clarification.",
        actorPortalUserId: input.actorPortalUserId,
        clientVisible: true,
      },
      tx,
    );

    return updated;
  });
}

export async function beginAssessment(input: {
  changeRequestId: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });
    if (!["SUBMITTED", "NEEDS_CLARIFICATION"].includes(cr.status)) {
      if (cr.status === "UNDER_ASSESSMENT") return cr;
      throw new Error("Assessment cannot begin in the current status.");
    }

    const updated = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "UNDER_ASSESSMENT" },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "ASSESSMENT_STARTED",
        summary: "Assessment started.",
        actorUserId: input.actorUserId,
      },
      tx,
    );

    return updated;
  });
}

export async function saveAssessment(input: {
  changeRequestId: string;
  actorUserId: string;
  classification: "IN_SCOPE" | "OUT_OF_SCOPE";
  scopeImpactSummary?: string | null;
  clientScopeImpactSummary?: string | null;
  timelineImpactDays?: number;
  timelineImpactSummary?: string | null;
  priceImpactMinor?: number;
  implementationSummary?: string | null;
  requirePaymentBeforeImplementation?: boolean;
  contractAmendmentRecommended?: boolean;
  expectedUpdatedAt?: Date;
}) {
  const currency = await resolveProjectCurrency(
    (await prisma.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
      select: { projectId: true },
    })).projectId,
  );

  const priceImpactMinor = Math.max(0, input.priceImpactMinor ?? 0);
  const timelineImpactDays = Math.max(0, input.timelineImpactDays ?? 0);

  if (input.classification === "IN_SCOPE" && priceImpactMinor > 0) {
    throw new Error("In-scope changes should have zero price impact.");
  }

  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });

    if (!["UNDER_ASSESSMENT", "AWAITING_CLIENT_APPROVAL"].includes(cr.status)) {
      throw new Error("Assessment cannot be saved in the current status.");
    }

    if (input.expectedUpdatedAt) {
      const guard = await tx.agencyChangeRequest.updateMany({
        where: { id: cr.id, updatedAt: input.expectedUpdatedAt },
        data: { updatedAt: new Date() },
      });
      if (guard.count !== 1) {
        throw new Error("Change request was updated by another user. Refresh and try again.");
      }
    }

    const current = await tx.agencyChangeRequestAssessment.findFirst({
      where: { changeRequestId: cr.id, supersededAt: null, sentForApprovalAt: null },
      orderBy: { versionNumber: "desc" },
    });

    let assessment;
    if (current && !current.sentForApprovalAt) {
      const hash = computeAssessmentHash({
        changeRequestId: cr.id,
        versionNumber: current.versionNumber,
        classification: input.classification,
        scopeImpactSummary: input.scopeImpactSummary ?? null,
        priceImpactMinor,
        currency,
        timelineImpactDays,
      });
      assessment = await tx.agencyChangeRequestAssessment.update({
        where: { id: current.id },
        data: {
          classification: input.classification,
          scopeImpactSummary: input.scopeImpactSummary?.trim() || null,
          clientScopeImpactSummary: input.clientScopeImpactSummary?.trim() || null,
          timelineImpactDays,
          timelineImpactSummary: input.timelineImpactSummary?.trim() || null,
          priceImpactMinor,
          currency,
          implementationSummary: input.implementationSummary?.trim() || null,
          assessmentHash: hash,
          assessedById: input.actorUserId,
        },
      });
    } else {
      const maxVersion = await tx.agencyChangeRequestAssessment.aggregate({
        where: { changeRequestId: cr.id },
        _max: { versionNumber: true },
      });
      const versionNumber = (maxVersion._max.versionNumber ?? 0) + 1;
      const hash = computeAssessmentHash({
        changeRequestId: cr.id,
        versionNumber,
        classification: input.classification,
        scopeImpactSummary: input.scopeImpactSummary ?? null,
        priceImpactMinor,
        currency,
        timelineImpactDays,
      });
      assessment = await tx.agencyChangeRequestAssessment.create({
        data: {
          changeRequestId: cr.id,
          versionNumber,
          classification: input.classification,
          scopeImpactSummary: input.scopeImpactSummary?.trim() || null,
          clientScopeImpactSummary: input.clientScopeImpactSummary?.trim() || null,
          timelineImpactDays,
          timelineImpactSummary: input.timelineImpactSummary?.trim() || null,
          priceImpactMinor,
          currency,
          implementationSummary: input.implementationSummary?.trim() || null,
          assessmentHash: hash,
          assessedById: input.actorUserId,
        },
      });
    }

    await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: {
        classification: input.classification,
        currency,
        currentAssessmentId: assessment.id,
        assessedAt: new Date(),
        requirePaymentBeforeImplementation:
          input.requirePaymentBeforeImplementation ?? cr.requirePaymentBeforeImplementation,
        contractAmendmentRecommended:
          input.contractAmendmentRecommended ?? cr.contractAmendmentRecommended,
        status: cr.status === "AWAITING_CLIENT_APPROVAL" ? "UNDER_ASSESSMENT" : cr.status,
        sentForApprovalAt: cr.status === "AWAITING_CLIENT_APPROVAL" ? null : cr.sentForApprovalAt,
      },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type:
          input.classification === "IN_SCOPE"
            ? "ASSESSED_IN_SCOPE"
            : "ASSESSED_OUT_OF_SCOPE",
        summary: `Assessed as ${input.classification === "IN_SCOPE" ? "in scope" : "out of scope"}.`,
        actorUserId: input.actorUserId,
      },
      tx,
    );

    return assessment;
  });
}

export async function sendForClientApproval(input: {
  changeRequestId: string;
  actorUserId: string;
  approverContactIds: string[];
  expectedUpdatedAt?: Date;
}) {
  if (!input.approverContactIds.length) {
    throw new Error("At least one client approver is required.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });

    if (cr.status !== "UNDER_ASSESSMENT") {
      throw new Error("Change request must be under assessment to send for approval.");
    }

    if (input.expectedUpdatedAt) {
      const guard = await tx.agencyChangeRequest.updateMany({
        where: { id: cr.id, updatedAt: input.expectedUpdatedAt },
        data: { updatedAt: new Date() },
      });
      if (guard.count !== 1) {
        throw new Error("Change request was updated by another user. Refresh and try again.");
      }
    }

    const assessment = await tx.agencyChangeRequestAssessment.findFirst({
      where: { changeRequestId: cr.id, supersededAt: null, sentForApprovalAt: null },
      orderBy: { versionNumber: "desc" },
    });
    if (!assessment) throw new Error("Save an assessment before sending for approval.");
    if (assessment.classification !== "OUT_OF_SCOPE") {
      throw new Error("Only out-of-scope changes require client approval.");
    }

    await tx.agencyChangeRequestAssessment.update({
      where: { id: assessment.id },
      data: { sentForApprovalAt: new Date() },
    });

    for (const contactId of input.approverContactIds) {
      await grantChangeRequestAccessTx(tx, {
        changeRequestId: cr.id,
        contactId,
        role: "APPROVER",
        grantedById: input.actorUserId,
      });
    }

    const result = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: {
        status: "AWAITING_CLIENT_APPROVAL",
        sentForApprovalAt: new Date(),
        currentAssessmentId: assessment.id,
      },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "SENT_FOR_APPROVAL",
        summary: "Sent to client for approval.",
        actorUserId: input.actorUserId,
        clientVisible: true,
      },
      tx,
    );

    return result;
  });

  const contacts = await prisma.crmContact.findMany({
    where: { id: { in: input.approverContactIds } },
    select: { email: true },
  });
  const { sendChangeRequestApprovalEmail } = await import("@/lib/change-requests/email");
  for (const contact of contacts) {
    if (!contact.email?.trim()) continue;
    void sendChangeRequestApprovalEmail({
      changeRequestId: updated.id,
      contactEmail: contact.email,
    }).catch((err) => {
      console.error(
        "[change-request:email]",
        err instanceof Error ? err.message : err,
      );
    });
  }

  return updated;
}

async function grantChangeRequestAccessTx(
  tx: Tx,
  input: {
    changeRequestId: string;
    contactId: string;
    role: "VIEWER" | "APPROVER";
    grantedById: string;
  },
) {
  const contact = await tx.crmContact.findUniqueOrThrow({ where: { id: input.contactId } });
  if (!contact.email?.trim()) throw new Error("Contact must have an email.");

  const portalUser = await tx.clientPortalUser.upsert({
    where: { contactId: input.contactId },
    create: {
      contactId: input.contactId,
      email: contact.email.trim().toLowerCase(),
      status: "INVITED",
    },
    update: { email: contact.email.trim().toLowerCase() },
  });

  return tx.agencyChangeRequestClientAccess.upsert({
    where: {
      changeRequestId_contactId: {
        changeRequestId: input.changeRequestId,
        contactId: input.contactId,
      },
    },
    create: {
      changeRequestId: input.changeRequestId,
      contactId: input.contactId,
      portalUserId: portalUser.id,
      role: input.role as never,
      grantedById: input.grantedById,
    },
    update: {
      portalUserId: portalUser.id,
      role: input.role as never,
      revokedAt: null,
      grantedById: input.grantedById,
      grantedAt: new Date(),
    },
  });
}

export async function approveInScopeChange(input: {
  changeRequestId: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });
    if (cr.status !== "UNDER_ASSESSMENT" || cr.classification !== "IN_SCOPE") {
      throw new Error("Only in-scope assessments under review can be approved internally.");
    }

    const assessment = await tx.agencyChangeRequestAssessment.findFirst({
      where: { changeRequestId: cr.id, supersededAt: null },
      orderBy: { versionNumber: "desc" },
    });
    if (!assessment || assessment.classification !== "IN_SCOPE") {
      throw new Error("Valid in-scope assessment required.");
    }

    const updated = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "APPROVED",
        summary: "In-scope change approved for project application.",
        actorUserId: input.actorUserId,
        clientVisible: true,
      },
      tx,
    );

    return updated;
  });
}

export async function approveChangeRequest(input: {
  changeRequestId: string;
  portalUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const portalUser = await tx.clientPortalUser.findUniqueOrThrow({
      where: { id: input.portalUserId },
      include: { contact: true },
    });

    const cr = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT id, status FROM "AgencyChangeRequest"
      WHERE id = ${input.changeRequestId}
      FOR UPDATE
    `;
    const locked = cr[0];
    if (!locked || locked.status !== "AWAITING_CLIENT_APPROVAL") {
      throw new Error("This change request is not awaiting approval.");
    }

    const approverAccess = await tx.agencyChangeRequestClientAccess.findFirst({
      where: {
        changeRequestId: input.changeRequestId,
        portalUserId: input.portalUserId,
        role: "APPROVER",
        revokedAt: null,
      },
    });
    if (!approverAccess) {
      throw new Error("You are not authorized to approve this change request.");
    }

    const existing = await tx.agencyChangeRequestApproval.findUnique({
      where: { changeRequestId: input.changeRequestId },
    });
    if (existing) return existing;

    const assessment = await tx.agencyChangeRequestAssessment.findFirst({
      where: {
        changeRequestId: input.changeRequestId,
        supersededAt: null,
        sentForApprovalAt: { not: null },
      },
      orderBy: { versionNumber: "desc" },
    });
    if (!assessment) throw new Error("No pending assessment found for approval.");

    const crFull = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });

    const consentText = APPROVAL_CONSENT_TEMPLATE.replace(
      "{number}",
      crFull.changeRequestNumber,
    );

    const clientName =
      portalUser.contact.displayName?.trim() ||
      [portalUser.contact.firstName, portalUser.contact.lastName].filter(Boolean).join(" ") ||
      portalUser.contact.email ||
      "Client";

    const approval = await tx.agencyChangeRequestApproval.create({
      data: {
        changeRequestId: input.changeRequestId,
        assessmentId: assessment.id,
        portalUserId: portalUser.id,
        contactId: portalUser.contactId,
        clientNameSnapshot: clientName,
        clientEmailSnapshot: portalUser.contact.email ?? portalUser.email,
        approvedPriceImpactMinor: assessment.priceImpactMinor,
        currency: assessment.currency,
        approvedTimelineImpactDays: assessment.timelineImpactDays,
        scopeImpactSnapshot: assessment.clientScopeImpactSummary ?? assessment.scopeImpactSummary,
        timelineImpactSnapshot: assessment.timelineImpactSummary,
        assessmentHash: assessment.assessmentHash,
        consentTextSnapshot: consentText,
      },
    });

    await tx.agencyChangeRequest.update({
      where: { id: input.changeRequestId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: input.changeRequestId,
        type: "APPROVED",
        summary: "Client approved the change request.",
        actorPortalUserId: portalUser.id,
        clientVisible: true,
      },
      tx,
    );

    return approval;
  });
}

export async function declineChangeRequest(input: {
  changeRequestId: string;
  portalUserId: string;
  comment?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const portalUser = await tx.clientPortalUser.findUniqueOrThrow({
      where: { id: input.portalUserId },
    });

    const rows = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT id, status FROM "AgencyChangeRequest"
      WHERE id = ${input.changeRequestId}
      FOR UPDATE
    `;
    const locked = rows[0];
    if (!locked || locked.status !== "AWAITING_CLIENT_APPROVAL") {
      throw new Error("This change request is not awaiting approval.");
    }

    const approverAccess = await tx.agencyChangeRequestClientAccess.findFirst({
      where: {
        changeRequestId: input.changeRequestId,
        portalUserId: input.portalUserId,
        role: "APPROVER",
        revokedAt: null,
      },
    });
    if (!approverAccess) {
      throw new Error("You are not authorized to decline this change request.");
    }

    const existingApproval = await tx.agencyChangeRequestApproval.findUnique({
      where: { changeRequestId: input.changeRequestId },
    });
    if (existingApproval) {
      throw new Error("Change request was already approved.");
    }

    const existingDecision = await tx.agencyChangeRequestDecision.findUnique({
      where: { changeRequestId: input.changeRequestId },
    });
    if (existingDecision) return existingDecision;

    const assessment = await tx.agencyChangeRequestAssessment.findFirst({
      where: {
        changeRequestId: input.changeRequestId,
        supersededAt: null,
        sentForApprovalAt: { not: null },
      },
      orderBy: { versionNumber: "desc" },
    });
    if (!assessment) throw new Error("No pending assessment found.");

    const decision = await tx.agencyChangeRequestDecision.create({
      data: {
        changeRequestId: input.changeRequestId,
        assessmentId: assessment.id,
        portalUserId: portalUser.id,
        contactId: portalUser.contactId,
        comment: input.comment?.trim() || null,
      },
    });

    await tx.agencyChangeRequest.update({
      where: { id: input.changeRequestId },
      data: { status: "DECLINED", declinedAt: new Date() },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: input.changeRequestId,
        type: "DECLINED",
        summary: "Client declined the change request.",
        actorPortalUserId: portalUser.id,
        clientVisible: true,
      },
      tx,
    );

    return decision;
  });
}

export async function cancelChangeRequest(input: {
  changeRequestId: string;
  actorUserId: string;
  reason?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });
    if (["APPLIED", "IMPLEMENTED", "DECLINED"].includes(cr.status)) {
      throw new Error("This change request cannot be cancelled.");
    }
    if (cr.status === "APPROVED") {
      throw new Error("Approved change requests cannot be cancelled without administrative resolution.");
    }

    const updated = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "CANCELLED",
        summary: input.reason?.trim() || "Change request cancelled.",
        actorUserId: input.actorUserId,
        metadata: input.reason ? { reason: input.reason } : undefined,
      },
      tx,
    );

    return updated;
  });
}

export async function markChangeRequestImplemented(input: {
  changeRequestId: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const cr = await tx.agencyChangeRequest.findUniqueOrThrow({
      where: { id: input.changeRequestId },
    });
    if (cr.status !== "APPLIED") {
      if (cr.status === "IMPLEMENTED") {
        return cr;
      }
      throw new Error("Only applied change requests can be marked implemented.");
    }

    const updated = await tx.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "IMPLEMENTED", implementedAt: new Date() },
    });

    await recordChangeRequestActivity(
      {
        changeRequestId: cr.id,
        type: "IMPLEMENTED",
        summary: "Change request marked as implemented.",
        actorUserId: input.actorUserId,
        clientVisible: true,
      },
      tx,
    );

    await recordAgencyProjectActivity({
      projectId: cr.projectId,
      type: "UPDATE_POSTED",
      summary: `Change request ${cr.changeRequestNumber} marked implemented.`,
      actorUserId: input.actorUserId,
      clientVisible: true,
    });

    return updated;
  });
}

export async function upsertWorkItems(input: {
  changeRequestId: string;
  items: Array<{
    type: "TASK" | "DELIVERABLE" | "REQUIREMENT";
    title: string;
    description?: string | null;
    clientVisible?: boolean;
    position?: number;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.agencyChangeRequestWorkItem.deleteMany({
      where: { changeRequestId: input.changeRequestId },
    });
    if (!input.items.length) return [];

    return tx.agencyChangeRequestWorkItem.createManyAndReturn({
      data: input.items.map((item, i) => ({
        changeRequestId: input.changeRequestId,
        type: item.type as never,
        title: item.title.trim(),
        description: item.description?.trim() || null,
        clientVisible: item.clientVisible ?? false,
        position: item.position ?? i,
      })),
    });
  });
}
