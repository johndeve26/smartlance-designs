import { prisma } from "@/lib/db";
import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";
import { grantProposalAccess } from "@/lib/proposals/portal-access";
import { markProposalSent } from "@/lib/proposals/status";
import { publishVersion } from "@/lib/proposals/versions";

function siteUrl() {
  return emailSiteUrl();
}

export async function sendProposalToClient(input: {
  proposalId: string;
  versionId?: string;
  actorUserId: string;
  contactIds: string[];
  decisionMakerContactId: string;
}) {
  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: input.proposalId },
    include: {
      company: true,
      primaryContact: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  if (!["DRAFT", "INTERNAL_REVIEW", "CHANGES_REQUESTED"].includes(proposal.status)) {
    throw new Error("Proposal cannot be sent in its current status.");
  }

  const versionId = input.versionId ?? proposal.currentVersionId ?? proposal.versions[0]?.id;
  if (!versionId) {
    throw new Error("No proposal version available to send.");
  }

  const version = await prisma.agencyProposalVersion.findUniqueOrThrow({
    where: { id: versionId },
    include: { lineItems: true, scopeItems: true },
  });

  if (!proposal.primaryContactId) {
    throw new Error("Proposal must have a primary contact.");
  }
  if (!version.scopeSummary?.trim() && !version.scopeItems.length) {
    throw new Error("Proposal scope is required before sending.");
  }

  await publishVersion({
    proposalId: input.proposalId,
    versionId,
    actorUserId: input.actorUserId,
  });

  for (const contactId of input.contactIds) {
    await grantProposalAccess({
      proposalId: input.proposalId,
      contactId,
      role: contactId === input.decisionMakerContactId ? "DECISION_MAKER" : "VIEWER",
      grantedById: input.actorUserId,
    });
  }

  await markProposalSent({
    proposalId: input.proposalId,
    actorUserId: input.actorUserId,
    versionId,
  });

  await prisma.agencyProposal.update({
    where: { id: input.proposalId },
    data: { currentVersionId: versionId },
  });

  const contacts = await prisma.crmContact.findMany({
    where: { id: { in: input.contactIds } },
    select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
  });

  const notificationResults: Array<{ contactId: string; success: boolean; error?: string }> = [];

  for (const contact of contacts) {
    if (!contact.email?.trim()) {
      notificationResults.push({
        contactId: contact.id,
        success: false,
        error: "Contact has no email.",
      });
      continue;
    }

    const subject = escapeHeaderFragment(
      `Proposal ready: ${proposal.title}`,
    );
    const viewUrl = `${siteUrl()}/portal/proposals/${proposal.id}`;
    const companyName = proposal.company?.name ?? "your organization";

    const result = await sendSmartlanceEmail({
      category: "PROPOSAL",
      to: contact.email,
      subject,
      text: `Smartlance Designs has prepared a proposal for ${companyName}.\n\nProposal: ${proposal.title}\n\nView proposal: ${viewUrl}`,
      html: `<p>Smartlance Designs has prepared a proposal for <strong>${companyName}</strong>.</p><p><strong>${proposal.title}</strong></p><p><a href="${viewUrl}">View proposal</a></p>`,
    });

    notificationResults.push({
      contactId: contact.id,
      success: result.success,
      error: result.success ? undefined : result.errorMessage,
    });
  }

  const allFailed = notificationResults.length > 0 && notificationResults.every((r) => !r.success);

  return {
    proposalId: input.proposalId,
    versionId,
    notifications: notificationResults,
    notificationFailed: allFailed,
  };
}

export async function resendProposalNotification(input: {
  proposalId: string;
  contactId: string;
  actorUserId: string;
}) {
  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: input.proposalId },
    include: { company: true },
  });

  if (!["SENT", "CHANGES_REQUESTED"].includes(proposal.status)) {
    throw new Error("Only sent proposals can be resent.");
  }

  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });
  if (!contact.email?.trim()) {
    throw new Error("Contact has no email.");
  }

  const viewUrl = `${siteUrl()}/portal/proposals/${proposal.id}`;
  const companyName = proposal.company?.name ?? "your organization";

  return sendSmartlanceEmail({
    category: "PROPOSAL",
    to: contact.email,
    subject: escapeHeaderFragment(`Proposal reminder: ${proposal.title}`),
    text: `Reminder: Smartlance Designs has a proposal ready for ${companyName}.\n\nView proposal: ${viewUrl}`,
    html: `<p>Reminder: Smartlance Designs has a proposal ready for <strong>${companyName}</strong>.</p><p><a href="${viewUrl}">View proposal</a></p>`,
  });
}
