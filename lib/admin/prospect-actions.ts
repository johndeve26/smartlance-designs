"use server";

import { requireAdminUser } from "@/lib/admin/session";
import { createProposal } from "@/lib/proposals/proposals";
import { prisma } from "@/lib/db";
import {
  adminRequestClarification,
  markRequestProposalReady,
} from "@/lib/prospect/requests/service";

export async function adminProspectRequestClarificationAction(input: {
  requestId: string;
  body: string;
}) {
  const user = await requireAdminUser("manage_crm");
  await adminRequestClarification({
    requestId: input.requestId,
    adminUserId: user.id,
    body: input.body,
  });
}

export async function adminCreateProposalFromRequestAction(requestId: string) {
  const user = await requireAdminUser("manage_proposals");

  const request = await prisma.agencyProspectRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { contact: true, proposal: true },
  });

  if (request.proposal) {
    return { proposalId: request.proposal.id, existing: true as const };
  }

  if (!request.contactId) {
    throw new Error("Request has no linked CRM contact.");
  }

  const proposal = await createProposal({
    title: request.title,
    primaryContactId: request.contactId,
    companyId: request.contact?.companyId,
    sourceProspectRequestId: request.id,
    ownerId: user.id,
    createdById: user.id,
    summary: `Created from prospect request ${request.requestNumber}`,
    internalNotes: `Source: Prospect Request ${request.requestNumber}`,
  });

  if (!proposal) throw new Error("Failed to create proposal.");

  return { proposalId: proposal.id, existing: false as const };
}

export async function adminMarkRequestProposalReadyAction(requestId: string) {
  await requireAdminUser("manage_proposals");
  await markRequestProposalReady(requestId);
}
