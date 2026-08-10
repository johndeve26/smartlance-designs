import { z } from "zod";

export const subscriberSourceSchema = z.enum([
  "FOOTER",
  "INSIGHT",
  "RESOURCE",
  "GUIDE",
  "CHECKLIST",
  "TEMPLATE",
  "CONTACT",
  "WEBSITE_REVIEW",
  "PROJECT_PLANNER",
  "OTHER",
]);

export type SubscriberSourceValue = z.infer<typeof subscriberSourceSchema>;

const unsafePathPattern = /^(javascript|data|file|vbscript):/i;

export function normalizeSubscriberEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeSourceUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (unsafePathPattern.test(trimmed)) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      const path = `${url.pathname}${url.search}` || "/";
      return path.startsWith("/") ? path : `/${path}`;
    } catch {
      return null;
    }
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path.includes("://")) return null;
  return path.slice(0, 500);
}

export const subscribeFormSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  source: subscriberSourceSchema,
  sourceUrl: z.string().trim().max(500).optional().or(z.literal("")),
  /** Honeypot — bots may fill this */
  _gotcha: z.string().max(200).optional().default(""),
});

export type SubscribeFormInput = z.infer<typeof subscribeFormSchema>;

export const audienceListFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z
    .enum(["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED", "all"])
    .optional(),
  source: subscriberSourceSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
