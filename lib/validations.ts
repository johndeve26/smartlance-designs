import { z } from "zod";

/** Normalize bare domains to https:// for optional website fields */
export function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/\./.test(trimmed) && !/\s/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function isSafeHttpUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((value) => normalizeWebsiteUrl(value || ""))
    .refine(
      (value) => !value || isSafeHttpUrl(value),
      "Enter a valid http(s) website URL.",
    )
    .refine(
      (value) => !value || /^https?:\/\/[^\s]+\.[^\s]+/i.test(value),
      "Enter a valid website such as yourwebsite.com.",
    ),
  service: z.string().trim().min(1, "Select a service.").max(120),
  projectDetails: z
    .string()
    .trim()
    .min(20, "Tell us a little about your project.")
    .max(8000, "Project details are too long."),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  timeline: z.string().trim().max(80).optional().or(z.literal("")),
  referralSource: z.string().trim().max(80).optional().or(z.literal("")),
  /**
   * Honeypot — bots may fill this. Allowed through Zod so the API can
   * return fake success without persisting. Humans leave it empty.
   */
  _gotcha: z.string().max(200).optional().default(""),
  subscribeToUpdates: z.boolean().optional().default(false),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const websiteReviewSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(254),
  website: z
    .string()
    .trim()
    .min(4, "Please enter your website URL")
    .max(500)
    .transform((value) => normalizeWebsiteUrl(value))
    .refine(
      (value) => isSafeHttpUrl(value),
      "Only http and https website URLs are allowed.",
    )
    .refine(
      (value) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(value),
      "Please enter a valid website URL",
    ),
  mainConcern: z.enum(
    [
      "More Traffic",
      "More Leads",
      "Better Design",
      "Better Google Rankings",
      "Faster Website",
      "More Sales",
      "Not Sure",
    ],
    { message: "Please select your main concern" },
  ),
  /** Honeypot — see contactFormSchema */
  _gotcha: z.string().max(200).optional().default(""),
  /** Explicit opt-in to audience updates — never pre-checked */
  subscribeToUpdates: z.boolean().optional().default(false),
});

export type WebsiteReviewValues = z.infer<typeof websiteReviewSchema>;

export const contactServiceOptions = [
  "Website Design",
  "Website Development",
  "Website Redesign",
  "SEO",
  "Technical SEO",
  "Local SEO",
  "E-commerce",
  "Landing Page",
  "Conversion Optimization",
  "Website Maintenance",
  "Digital Marketing",
  "Not Sure Yet",
] as const;

/** Existing Smartlance project ranges — preserved, not invented */
export const budgetOptions = [
  "Under $2,000",
  "$2,000 – $5,000",
  "$5,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000+",
  "Not sure yet",
] as const;

export const timelineOptions = [
  "As soon as possible",
  "Within 1 month",
  "1 – 3 months",
  "3+ months",
  "Flexible / not sure",
] as const;

export const referralSourceOptions = [
  "Google",
  "Referral",
  "Social media",
  "Upwork / freelance platform",
  "Existing client",
  "Blog / article",
  "Other",
] as const;

export const reviewConcernOptions = [
  "More Traffic",
  "More Leads",
  "Better Design",
  "Better Google Rankings",
  "Faster Website",
  "More Sales",
  "Not Sure",
] as const;
