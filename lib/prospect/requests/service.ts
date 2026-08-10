import type {
  AgencyProspectRequestSourceDetail,
  AgencyProspectRequestStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";
import { createBriefSnapshot } from "@/lib/prospect/briefs/service";
import {
  REQUEST_STATUS_COPY,
  REQUEST_STATUS_LABELS,
} from "@/lib/prospect/constants";
import type {
  ProspectRequestDetailDto,
  ProspectRequestListItemDto,
} from "@/lib/prospect/dto";
import { getProspectProfile } from "@/lib/prospect/profile";
import { tryIntegrateProspectRequestWithCrm } from "@/lib/prospect/requests/crm-integration";
import { generateProspectRequestNumber } from "@/lib/prospect/requests/request-number";
import { hasProposalAccess } from "@/lib/proposals/portal-access";

function toListItem(request: {
  id: string;
  requestNumber: string;
  title: string;
  projectType: string | null;
  status: AgencyProspectRequestStatus;
  submittedAt: Date;
  updatedAt: Date;
}): ProspectRequestListItemDto {
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    title: request.title,
    projectType: request.projectType,
    status: request.status,
    statusLabel: REQUEST_STATUS_LABELS[request.status],
    submittedAt: request.submittedAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export async function submitProspectRequest(input: {
  portalUserId: string;
  briefId: string;
  reviewId?: string;
  submissionIdempotencyKey: string;
  sourceDetail: AgencyProspectRequestSourceDetail;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactCompany?: string;
}) {
  const existing = await prisma.agencyProspectRequest.findUnique({
    where: { submissionIdempotencyKey: input.submissionIdempotencyKey },
  });
  if (existing) {
    return { request: existing, idempotent: true as const };
  }

  const brief = await prisma.agencyWebsiteBrief.findFirst({
    where: { id: input.briefId, portalUserId: input.portalUserId },
  });
  if (!brief) throw new Error("Brief not found.");

  const snapshot = await createBriefSnapshot(input.briefId, input.portalUserId);

  let reviewSnapshot: Prisma.InputJsonValue | undefined;
  if (input.reviewId) {
    const review = await prisma.agencyWebsiteReview.findFirst({
      where: { id: input.reviewId, portalUserId: input.portalUserId },
      include: {
        findings: { where: { isPriority: true }, take: 5 },
      },
    });
    if (review) {
      reviewSnapshot = {
        id: review.id,
        websiteUrl: review.websiteUrl,
        normalizedDomain: review.normalizedDomain,
        overallDirection: review.overallDirection,
        summary: review.summary,
        priorities: review.findings.map((f) => ({
          title: f.title,
          explanation: f.explanation,
        })),
      } as Prisma.InputJsonValue;
    }
  }

  const portalUser = await prisma.clientPortalUser.findUniqueOrThrow({
    where: { id: input.portalUserId },
    include: { contact: true, prospectProfile: true },
  });

  const profile = portalUser.prospectProfile ?? (await getProspectProfile(input.portalUserId));
  const contactName =
    input.contactName ??
    ([profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      portalUser.contact.displayName ||
      portalUser.email);
  const contactEmail = input.contactEmail ?? portalUser.email;

  const contactSnapshot = {
    name: contactName,
    email: contactEmail,
    phone: input.contactPhone ?? profile?.phone ?? portalUser.contact.phone,
    company: input.contactCompany ?? profile?.companyName,
  };

  const requestNumber = await generateProspectRequestNumber();

  let request: Awaited<ReturnType<typeof prisma.agencyProspectRequest.create>>;
  try {
    request = await prisma.agencyProspectRequest.create({
      data: {
        requestNumber,
        portalUserId: input.portalUserId,
        prospectProfileId: profile?.id ?? null,
        briefId: input.briefId,
        reviewId: input.reviewId ?? brief.sourceReviewId,
        status: "SUBMITTED",
        title: brief.title,
        projectType: brief.projectType,
        sourceDetail: input.sourceDetail,
        submissionIdempotencyKey: input.submissionIdempotencyKey,
        briefSnapshotJson: snapshot as Prisma.InputJsonValue,
        reviewSnapshotJson: reviewSnapshot,
        contactSnapshotJson: contactSnapshot as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      const raced = await prisma.agencyProspectRequest.findUniqueOrThrow({
        where: { submissionIdempotencyKey: input.submissionIdempotencyKey },
      });
      return { request: raced, idempotent: true as const };
    }
    throw err;
  }

  await prisma.agencyWebsiteBrief.update({
    where: { id: input.briefId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  await prisma.agencyProspectRequestActivity.create({
    data: {
      requestId: request.id,
      type: "REQUEST_SUBMITTED",
      summary: "Request submitted",
    },
  });

  try {
    const crm = await tryIntegrateProspectRequestWithCrm({
      requestId: request.id,
      requestNumber: request.requestNumber,
      name: contactName,
      email: contactEmail,
      phone: contactSnapshot.phone as string | undefined,
      company: contactSnapshot.company as string | undefined,
      website: profile?.primaryWebsite,
      title: brief.title,
      sourceDetail: input.sourceDetail,
    });
    await prisma.agencyProspectRequest.update({
      where: { id: request.id },
      data: { contactId: crm.contactId, status: "BEING_REVIEWED" },
    });
  } catch (err) {
    console.error("[prospect-request-crm]", request.id, err);
  }

  const baseUrl = emailSiteUrl();
  void sendSmartlanceEmail({
    category: "PROSPECT_REQUEST",
    to: contactEmail,
    subject: "We've received your website project details",
    text: [
      "We've received your website project details.",
      "",
      `Project: ${brief.title}`,
      "",
      "You can follow the request from your Smartlance workspace:",
      `${baseUrl}/workspace/requests/${request.id}`,
    ].join("\n"),
  }).catch(console.error);

  return { request, idempotent: false as const };
}

export async function getRequestForUser(
  requestId: string,
  portalUserId: string,
): Promise<ProspectRequestDetailDto | null> {
  const request = await prisma.agencyProspectRequest.findFirst({
    where: { id: requestId, portalUserId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "asc" } },
      proposal: { select: { id: true } },
    },
  });
  if (!request) return null;

  let linkedProposalId: string | null = null;
  if (request.proposal?.id) {
    const allowed = await hasProposalAccess({
      proposalId: request.proposal.id,
      portalUserId,
    });
    if (allowed) linkedProposalId = request.proposal.id;
  }

  return {
    ...toListItem(request),
    statusCopy: REQUEST_STATUS_COPY[request.status],
    briefSnapshot: (request.briefSnapshotJson as Record<string, unknown>) ?? {},
    reviewSnapshot: (request.reviewSnapshotJson as Record<string, unknown>) ?? null,
    messages: request.messages.map((m) => ({
      id: m.id,
      authorType: m.authorType,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
    timeline: request.activities.map((a) => ({
      type: a.type,
      summary: a.summary,
      createdAt: a.createdAt.toISOString(),
    })),
    linkedProposalId,
  };
}

export async function listRequestsForUser(portalUserId: string) {
  const requests = await prisma.agencyProspectRequest.findMany({
    where: { portalUserId },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });
  return requests.map(toListItem);
}

export async function respondToClarification(input: {
  requestId: string;
  portalUserId: string;
  body: string;
}) {
  const request = await prisma.agencyProspectRequest.findFirst({
    where: { id: input.requestId, portalUserId: input.portalUserId },
  });
  if (!request) throw new Error("Request not found.");

  await prisma.agencyProspectRequestMessage.create({
    data: {
      requestId: input.requestId,
      authorType: "PORTAL_USER",
      portalUserId: input.portalUserId,
      body: input.body.trim(),
    },
  });

  await prisma.agencyProspectRequestActivity.create({
    data: {
      requestId: input.requestId,
      type: "PROSPECT_RESPONDED",
      summary: "You responded",
    },
  });

  await prisma.agencyProspectRequest.update({
    where: { id: input.requestId },
    data: { status: "BEING_REVIEWED" },
  });
}

export async function adminRequestClarification(input: {
  requestId: string;
  adminUserId: string;
  body: string;
}) {
  const request = await prisma.agencyProspectRequest.findUniqueOrThrow({
    where: { id: input.requestId },
    include: { portalUser: true },
  });

  await prisma.agencyProspectRequestMessage.create({
    data: {
      requestId: input.requestId,
      authorType: "SMARTLANCE",
      adminUserId: input.adminUserId,
      body: input.body.trim(),
    },
  });

  await prisma.agencyProspectRequestActivity.create({
    data: {
      requestId: input.requestId,
      type: "INFORMATION_REQUESTED",
      summary: "Additional information requested",
    },
  });

  await prisma.agencyProspectRequest.update({
    where: { id: input.requestId },
    data: { status: "NEEDS_INFORMATION" },
  });

  const baseUrl = emailSiteUrl();
  void sendSmartlanceEmail({
    category: "PROSPECT_CLARIFICATION",
    to: request.portalUser.email,
    subject: "Smartlance needs a little more information",
    text: [
      "Smartlance needs a little more information about your project.",
      "",
      input.body.trim(),
      "",
      `Respond from your workspace: ${baseUrl}/workspace/requests/${request.id}`,
    ].join("\n"),
  }).catch(console.error);
}

export async function markRequestProposalReady(requestId: string) {
  await prisma.agencyProspectRequest.update({
    where: { id: requestId },
    data: { status: "PROPOSAL_READY" },
  });
  await prisma.agencyProspectRequestActivity.create({
    data: {
      requestId,
      type: "PROPOSAL_READY",
      summary: "Proposal ready",
    },
  });
}

export async function listRequestsForContact(contactId: string) {
  return prisma.agencyProspectRequest.findMany({
    where: { contactId },
    orderBy: { submittedAt: "desc" },
    include: {
      portalUser: { select: { email: true } },
      brief: { select: { id: true, title: true } },
      review: { select: { id: true, normalizedDomain: true } },
    },
  });
}
