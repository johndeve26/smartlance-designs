export type {
  ActiveEmailTransport,
  EmailProvider,
  ResolvedSmtpConfig,
  SendTransactionalEmailInput,
  SendTransactionalEmailResult,
  SmtpSecurityMode,
} from "@/lib/email/types";

export {
  isAdminSmtpEnabled,
  isEmailDeliveryConfigured,
  isEmailDeliveryConfiguredFromEnv,
  resolveActiveEmailTransport,
  resolveNotificationRecipients,
} from "@/lib/email/config";

export { sendTransactionalEmail, escapeHeaderFragment } from "@/lib/email/send";
export { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
export type { SendSmartlanceEmailInput } from "@/lib/email/send-smartlance";
export { resolveEmailSendingProfile } from "@/lib/email/routing/resolve-profile";
export { EMAIL_ROUTE_CATEGORIES, EMAIL_ROUTE_LABELS } from "@/lib/email/routing/categories";

export {
  formatContactEmailText,
  formatReviewEmailText,
  contactNotificationSubject,
  reviewNotificationSubject,
  smtpTestEmailContent,
} from "@/lib/email/templates";

export { normalizeSmtpError } from "@/lib/email/errors";

export {
  smtpSettingsUpdateSchema,
  parseNotificationRecipients,
  type SmtpSettingsUpdateInput,
} from "@/lib/email/smtp-schema";

export { createSmtpTransport, verifySmtpConnection, sendViaSmtp } from "@/lib/email/smtp";
