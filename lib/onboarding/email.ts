import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { emailSiteUrl } from "@/lib/email/site-url";
import { prisma } from "@/lib/db";

function siteUrl() {
  return emailSiteUrl();
}

export async function sendOnboardingInvitationEmail(input: { onboardingId: string }) {
  const onboarding = await prisma.agencyProjectOnboarding.findUniqueOrThrow({
    where: { id: input.onboardingId },
    include: {
      project: { select: { id: true, name: true } },
      primaryClientContact: { select: { email: true, displayName: true, firstName: true } },
    },
  });

  const email = onboarding.primaryClientContact?.email?.trim();
  if (!email) return { ok: false as const, reason: "no_email" as const };

  const url = `${siteUrl()}/portal/projects/${onboarding.projectId}/onboarding`;
  const name =
    onboarding.primaryClientContact?.displayName ||
    onboarding.primaryClientContact?.firstName ||
    "there";

  return sendSmartlanceEmail({
    category: "ONBOARDING",
    to: email,
    subject: escapeHeaderFragment(`Complete onboarding for ${onboarding.project.name}`),
    text: [
      `Hi ${name},`,
      "",
      `Please complete onboarding for your project: ${onboarding.project.name}.`,
      onboarding.clientMessage ? `\n${onboarding.clientMessage}\n` : "",
      `Continue onboarding: ${url}`,
      "",
      "Sign in to the client portal to continue.",
    ].join("\n"),
    html: [
      `<p>Hi ${name},</p>`,
      `<p>Please complete onboarding for <strong>${onboarding.project.name}</strong>.</p>`,
      onboarding.clientMessage ? `<p>${onboarding.clientMessage}</p>` : "",
      `<p><a href="${url}">Continue onboarding</a></p>`,
      `<p>Sign in to the client portal to continue.</p>`,
    ].join(""),
  });
}

export async function sendOnboardingReminderEmail(input: {
  onboardingId: string;
  remainingItems: number;
  requirementTitle?: string;
}) {
  const onboarding = await prisma.agencyProjectOnboarding.findUniqueOrThrow({
    where: { id: input.onboardingId },
    include: {
      project: { select: { id: true, name: true } },
      primaryClientContact: { select: { email: true, displayName: true, firstName: true } },
    },
  });

  const email = onboarding.primaryClientContact?.email?.trim();
  if (!email) return { ok: false as const, reason: "no_email" as const };

  const url = `${siteUrl()}/portal/projects/${onboarding.projectId}/onboarding`;
  const name =
    onboarding.primaryClientContact?.displayName ||
    onboarding.primaryClientContact?.firstName ||
    "there";

  const detail = input.requirementTitle
    ? `We are still waiting for: ${input.requirementTitle}.`
    : `${input.remainingItems} required item(s) remain.`;

  return sendSmartlanceEmail({
    category: "ONBOARDING",
    to: email,
    subject: escapeHeaderFragment(`Onboarding reminder — ${onboarding.project.name}`),
    text: [
      `Hi ${name},`,
      "",
      `Your Smartlance project onboarding needs a few items.`,
      `Project: ${onboarding.project.name}`,
      detail,
      `Continue onboarding: ${url}`,
    ].join("\n"),
    html: [
      `<p>Hi ${name},</p>`,
      `<p>Your Smartlance project onboarding needs a few items.</p>`,
      `<p><strong>Project:</strong> ${onboarding.project.name}<br/>${detail}</p>`,
      `<p><a href="${url}">Continue onboarding</a></p>`,
    ].join(""),
  });
}

export async function sendClarificationEmail(input: {
  onboardingId: string;
  itemLabel: string;
  message: string;
}) {
  const onboarding = await prisma.agencyProjectOnboarding.findUniqueOrThrow({
    where: { id: input.onboardingId },
    include: {
      project: { select: { id: true, name: true } },
      primaryClientContact: { select: { email: true, displayName: true, firstName: true } },
    },
  });

  const email = onboarding.primaryClientContact?.email?.trim();
  if (!email) return { ok: false as const, reason: "no_email" as const };

  const url = `${siteUrl()}/portal/projects/${onboarding.projectId}/onboarding`;

  return sendSmartlanceEmail({
    category: "ONBOARDING",
    to: email,
    subject: escapeHeaderFragment(`Clarification needed — ${onboarding.project.name}`),
    text: [
      `We need clarification on: ${input.itemLabel}`,
      input.message,
      `Update your response: ${url}`,
    ].join("\n\n"),
    html: [
      `<p>We need clarification on: <strong>${input.itemLabel}</strong></p>`,
      `<p>${input.message}</p>`,
      `<p><a href="${url}">Update your response</a></p>`,
    ].join(""),
  });
}
