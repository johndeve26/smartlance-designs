import { prisma } from "@/lib/db";
import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";
import { grantContractAccess } from "@/lib/contracts/portal-access";
import { markContractSent } from "@/lib/contracts/status";
import { publishContractVersion } from "@/lib/contracts/versions";
import { findUnresolvedRequiredVariables } from "@/lib/contracts/variables";

function siteUrl() {
  return emailSiteUrl();
}

export async function sendContractToSigners(input: {
  contractId: string;
  versionId?: string;
  actorUserId: string;
}) {
  const contract = await prisma.agencyContract.findUniqueOrThrow({
    where: { id: input.contractId },
    include: {
      signers: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  if (!["DRAFT", "READY_FOR_REVIEW", "CORRECTION_REQUESTED"].includes(contract.status)) {
    throw new Error("Contract cannot be sent in its current status.");
  }

  const versionId = input.versionId ?? contract.currentVersionId ?? contract.versions[0]?.id;
  if (!versionId) throw new Error("No contract version to send.");

  const version = await prisma.agencyContractVersion.findUniqueOrThrow({
    where: { id: versionId },
  });

  const unresolved = findUnresolvedRequiredVariables({
    content: version.content,
    values: (version.resolvedVariables as Record<string, string>) ?? {},
  });
  if (unresolved.length) {
    throw new Error(`Unresolved required variables: ${unresolved.join(", ")}`);
  }

  await publishContractVersion({
    contractId: input.contractId,
    versionId,
    actorUserId: input.actorUserId,
  });

  const clientSigners = contract.signers.filter(
    (s) =>
      s.signerType === "CLIENT" &&
      s.contactId &&
      s.contractVersionId === versionId,
  );

  for (const signer of clientSigners) {
    if (!signer.contactId) continue;
    await grantContractAccess({
      contractId: input.contractId,
      contactId: signer.contactId,
      role: signer.role,
      grantedById: input.actorUserId,
    });

    await prisma.agencyContractSigner.update({
      where: { id: signer.id },
      data: { contractVersionId: versionId, invitedAt: new Date(), status: "PENDING" },
    });
  }

  await markContractSent({
    contractId: input.contractId,
    actorUserId: input.actorUserId,
    versionId,
  });

  await prisma.agencyContract.update({
    where: { id: input.contractId },
    data: { currentVersionId: versionId },
  });

  const notifications: Array<{ email: string; success: boolean; error?: string }> = [];

  for (const signer of clientSigners) {
    if (!signer.emailSnapshot.trim()) continue;
    const result = await sendSmartlanceEmail({
      category: "CONTRACT",
      to: signer.emailSnapshot,
      subject: escapeHeaderFragment(`Contract ready for signature: ${contract.title}`),
      text: `Smartlance Designs has a contract ready for your review and signature.\n\nContract: ${contract.contractNumber} — ${contract.title}\n\nReview & sign: ${siteUrl()}/portal/contracts/${contract.id}`,
      html: `<p>Smartlance Designs has a contract ready for your review and signature.</p><p><strong>${contract.contractNumber}</strong> — ${contract.title}</p><p><a href="${siteUrl()}/portal/contracts/${contract.id}">Review &amp; sign contract</a></p>`,
    });
    notifications.push({
      email: signer.emailSnapshot,
      success: result.success,
      error: result.success ? undefined : result.errorMessage,
    });
  }

  return {
    contractId: input.contractId,
    versionId,
    notifications,
    notificationFailed: notifications.length > 0 && notifications.every((n) => !n.success),
  };
}

export async function resendContractNotification(input: {
  contractId: string;
  signerId: string;
}) {
  const contract = await prisma.agencyContract.findUniqueOrThrow({
    where: { id: input.contractId },
  });
  const signer = await prisma.agencyContractSigner.findUniqueOrThrow({
    where: { id: input.signerId },
  });

  if (!["SENT", "PARTIALLY_SIGNED"].includes(contract.status)) {
    throw new Error("Only sent contracts can be resent.");
  }

  return sendSmartlanceEmail({
    category: "CONTRACT",
    to: signer.emailSnapshot,
    subject: escapeHeaderFragment(`Reminder: sign contract ${contract.contractNumber}`),
    text: `Reminder to review and sign contract ${contract.title}.\n\n${siteUrl()}/portal/contracts/${contract.id}`,
    html: `<p>Reminder to review and sign <strong>${contract.title}</strong>.</p><p><a href="${siteUrl()}/portal/contracts/${contract.id}">Review &amp; sign</a></p>`,
  });
}
