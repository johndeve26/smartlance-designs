import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";
import { prisma } from "@/lib/db";

export async function sendChangeRequestApprovalEmail(input: {
  changeRequestId: string;
  contactEmail: string;
}) {
  const cr = await prisma.agencyChangeRequest.findUniqueOrThrow({
    where: { id: input.changeRequestId },
    include: { project: { select: { name: true } } },
  });

  const url = `${emailSiteUrl()}/portal/projects/${cr.projectId}/changes/${cr.id}`;

  return sendSmartlanceEmail({
    category: "CHANGE_REQUEST",
    to: input.contactEmail,
    subject: escapeHeaderFragment(
      `Change request ready for review — ${cr.changeRequestNumber}`,
    ),
    text: [
      `A change request for ${cr.project.name} is ready for your review.`,
      "",
      `${cr.title}`,
      "",
      `Review and respond: ${url}`,
    ].join("\n"),
    html: `<p>A change request for <strong>${cr.project.name}</strong> is ready for your review.</p><p><strong>${cr.title}</strong></p><p><a href="${url}">Review change request</a></p>`,
  });
}
