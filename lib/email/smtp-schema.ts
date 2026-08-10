import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .max(254)
  .email("Enter a valid email address.");

const hostField = z
  .string()
  .trim()
  .min(1, "SMTP host is required.")
  .max(253)
  .refine(
    (value) =>
      !/^(https?:\/\/|javascript:|data:)/i.test(value) &&
      !value.includes("/") &&
      !value.includes(" "),
    "Enter a valid SMTP hostname or IP address.",
  );

export const smtpSecurityModeSchema = z.enum([
  "AUTO",
  "TLS",
  "STARTTLS",
  "NONE",
]);

export const smtpSettingsUpdateSchema = z
  .object({
    enabled: z.boolean(),
    host: z.string().trim().max(253).nullable(),
    port: z.number().int().min(1).max(65535).nullable(),
    securityMode: smtpSecurityModeSchema,
    username: z.string().trim().max(320).nullable(),
    fromName: z.string().trim().max(120).nullable(),
    fromEmail: z.string().trim().max(254).nullable(),
    replyToEmail: z.string().trim().max(254).nullable(),
    notificationRecipients: z.array(emailField).max(10),
    testRecipient: z.string().trim().max(254).nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) return;

    if (!data.host) {
      ctx.addIssue({
        code: "custom",
        message: "SMTP host is required when enabled.",
        path: ["host"],
      });
    } else {
      const hostResult = hostField.safeParse(data.host);
      if (!hostResult.success) {
        ctx.addIssue({
          code: "custom",
          message: hostResult.error.issues[0]?.message || "Invalid host.",
          path: ["host"],
        });
      }
    }

    if (data.port == null) {
      ctx.addIssue({
        code: "custom",
        message: "SMTP port is required when enabled.",
        path: ["port"],
      });
    }

    if (!data.fromEmail) {
      ctx.addIssue({
        code: "custom",
        message: "From email is required when enabled.",
        path: ["fromEmail"],
      });
    } else if (!emailField.safeParse(data.fromEmail).success) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid from email address.",
        path: ["fromEmail"],
      });
    }

    if (data.replyToEmail && !emailField.safeParse(data.replyToEmail).success) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid reply-to email address.",
        path: ["replyToEmail"],
      });
    }

    if (
      data.testRecipient &&
      !emailField.safeParse(data.testRecipient).success
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid test recipient email address.",
        path: ["testRecipient"],
      });
    }
  });

export type SmtpSettingsUpdateInput = z.infer<typeof smtpSettingsUpdateSchema>;

export function parseNotificationRecipients(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const emails: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const parsed = emailField.safeParse(trimmed);
    if (parsed.success) emails.push(parsed.data);
  }
  return [...new Set(emails)].slice(0, 10);
}

export function normalizeOptionalEmail(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = emailField.safeParse(trimmed);
  return parsed.success ? parsed.data : null;
}
