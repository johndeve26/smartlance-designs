import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";
import { prisma } from "@/lib/db";

function siteUrl() {
  return emailSiteUrl();
}

export async function sendSupportConfirmationEmail(input: { supportRequestId: string }) {
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
    include: {
      website: { select: { name: true, domain: true } },
      submittedByPortal: { select: { email: true, contact: { select: { displayName: true, firstName: true } } } },
    },
  });

  const email = sr.submittedByPortal.email;
  const name = sr.submittedByPortal.contact.displayName ?? sr.submittedByPortal.contact.firstName ?? "there";
  const href = `${siteUrl()}/portal/support/${sr.id}`;

  return sendSmartlanceEmail({
    category: "SUPPORT",
    to: email,
    subject: `Support request received — ${escapeHeaderFragment(sr.supportNumber)}`,
    text: `Hi ${name},\n\nWe've received your support request.\n\n${sr.supportNumber}: ${sr.subject}\nWebsite: ${sr.website.name} (${sr.website.domain})\n\nView your request: ${href}`,
    html: `<p>Hi ${name},</p><p>We've received your support request.</p><p><strong>${sr.supportNumber}</strong>: ${sr.subject}<br/>Website: ${sr.website.name} (${sr.website.domain})</p><p><a href="${href}">View your request</a></p>`,
  });
}

export async function sendSupportReplyNotificationEmail(input: { supportRequestId: string }) {
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
    include: {
      submittedByPortal: { select: { email: true, contact: { select: { displayName: true, firstName: true } } } },
    },
  });

  const email = sr.submittedByPortal.email;
  const name = sr.submittedByPortal.contact.displayName ?? sr.submittedByPortal.contact.firstName ?? "there";
  const href = `${siteUrl()}/portal/support/${sr.id}`;

  return sendSmartlanceEmail({
    category: "SUPPORT",
    to: email,
    subject: `Update on your support request — ${escapeHeaderFragment(sr.supportNumber)}`,
    text: `Hi ${name},\n\nSmartlance has responded to your support request ${sr.supportNumber}.\n\nView the update: ${href}`,
    html: `<p>Hi ${name},</p><p>Smartlance has responded to your support request <strong>${sr.supportNumber}</strong>.</p><p><a href="${href}">View the update</a></p>`,
  });
}

export async function sendSupportWaitingOnClientEmail(input: { supportRequestId: string }) {
  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: input.supportRequestId },
    include: {
      submittedByPortal: { select: { email: true, contact: { select: { displayName: true, firstName: true } } } },
    },
  });

  const email = sr.submittedByPortal.email;
  const name = sr.submittedByPortal.contact.displayName ?? sr.submittedByPortal.contact.firstName ?? "there";
  const href = `${siteUrl()}/portal/support/${sr.id}`;

  return sendSmartlanceEmail({
    category: "SUPPORT",
    to: email,
    subject: `We need your response — ${escapeHeaderFragment(sr.supportNumber)}`,
    text: `Hi ${name},\n\nSmartlance needs a response on support request ${sr.supportNumber}.\n\nRespond here: ${href}`,
    html: `<p>Hi ${name},</p><p>Smartlance needs a response on support request <strong>${sr.supportNumber}</strong>.</p><p><a href="${href}">Respond now</a></p>`,
  });
}
