import { z } from "zod";

export const emailSendingProfileSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens."),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  fromName: z.string().trim().min(1).max(120),
  fromEmail: z.string().trim().email().max(254),
  replyToName: z.string().trim().max(120).optional().or(z.literal("")),
  replyToEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  transportType: z.enum(["SYSTEM_SMTP", "CUSTOM_SMTP"]),
  smtpHost: z.string().trim().max(253).optional().or(z.literal("")),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpSecurityMode: z.enum(["AUTO", "TLS", "STARTTLS", "NONE"]).optional(),
  smtpUsername: z.string().trim().max(254).optional().or(z.literal("")),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export function slugifyProfileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
