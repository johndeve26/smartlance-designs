type FormPayload = Record<string, unknown>;

function escapePlain(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function payloadRef(payload: FormPayload) {
  const ref = escapePlain(payload.reference).replace(/[\r\n]+/g, " ");
  return ref ? ` (${ref})` : "";
}

export function formatContactEmailText(payload: FormPayload, submittedAt: string) {
  return [
    "New Smartlance Project Enquiry",
    "",
    `Reference: ${escapePlain(payload.reference) || "—"}`,
    `Submitted: ${submittedAt}`,
    `Name: ${escapePlain(payload.name)}`,
    `Email: ${escapePlain(payload.email)}`,
    `Company: ${escapePlain(payload.company) || "—"}`,
    `Website: ${escapePlain(payload.website) || "—"}`,
    `Service: ${escapePlain(payload.service)}`,
    `Budget: ${escapePlain(payload.budget) || "—"}`,
    `Timeline: ${escapePlain(payload.timeline) || "—"}`,
    `Referral source: ${escapePlain(payload.referralSource) || "—"}`,
    payload.adminPath ? `Admin: ${escapePlain(payload.adminPath)}` : null,
    "",
    "Project details:",
    escapePlain(payload.projectDetails),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function formatReviewEmailText(payload: FormPayload, submittedAt: string) {
  return [
    "New Free Website Review Request",
    "",
    `Reference: ${escapePlain(payload.reference) || "—"}`,
    `Submitted: ${submittedAt}`,
    `Name: ${escapePlain(payload.name)}`,
    `Email: ${escapePlain(payload.email)}`,
    `Website URL: ${escapePlain(payload.website)}`,
    `Main concern: ${escapePlain(payload.mainConcern)}`,
    payload.adminPath ? `Admin: ${escapePlain(payload.adminPath)}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function contactNotificationSubject(payload: FormPayload) {
  return `New Smartlance Project Enquiry${payloadRef(payload)}`;
}

export function reviewNotificationSubject(payload: FormPayload) {
  return `New Smartlance Website Review Request${payloadRef(payload)}`;
}

export function smtpTestEmailContent(sentAt: string) {
  return {
    subject: "Smartlance Designs — SMTP configuration test",
    text: [
      "Smartlance Designs",
      "SMTP configuration test",
      "",
      "Your SMTP settings are working.",
      "",
      `Sent at: ${sentAt}`,
    ].join("\n"),
  };
}

export function profileTestEmailContent(input: {
  profileName: string;
  fromEmail: string;
  transportLabel: string;
  sentAt: string;
}) {
  return {
    subject: "Smartlance Designs — Sending profile test",
    text: [
      "Smartlance email configuration test",
      "",
      `Profile: ${input.profileName}`,
      `From: ${input.fromEmail}`,
      `Transport: ${input.transportLabel}`,
      "",
      `Sent at: ${input.sentAt}`,
    ].join("\n"),
    html: [
      "<p><strong>Smartlance email configuration test</strong></p>",
      `<p>Profile: ${input.profileName}<br/>From: ${input.fromEmail}<br/>Transport: ${input.transportLabel}</p>`,
      `<p>Sent at: ${input.sentAt}</p>`,
    ].join(""),
  };
}
