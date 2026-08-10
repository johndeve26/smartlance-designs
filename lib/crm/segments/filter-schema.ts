import { z } from "zod";
import {
  CONTACT_FILTER_VERSION,
  contactFilterSchemaV3,
} from "@/lib/crm/filters/contact-filter-schema";

/** Versioned segment filter — no raw SQL or executable code. */
export const SEGMENT_FILTER_VERSION = 1 as const;
export const SEGMENT_FILTER_VERSION_V2 = 2 as const;
export const SEGMENT_FILTER_VERSION_V3 = CONTACT_FILTER_VERSION;

const enumArray = <T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).min(1).optional();

const baseFilterShape = {
  lifecycle: enumArray([
    "PROSPECT",
    "LEAD",
    "OPPORTUNITY",
    "CLIENT",
    "PAST_CLIENT",
    "OTHER",
  ] as const),
  leadStatus: enumArray([
    "NEW",
    "ATTEMPTING",
    "CONNECTED",
    "QUALIFIED",
    "UNQUALIFIED",
    "BAD_TIMING",
    "CLOSED",
  ] as const),
  temperature: enumArray(["COLD", "WARM", "HOT"] as const),
  source: enumArray([
    "MANUAL",
    "CONTACT_FORM",
    "WEBSITE_REVIEW",
    "PROJECT_PLANNER",
    "REFERRAL",
    "INBOUND_EMAIL",
    "OUTBOUND",
    "UPWORK",
    "SOCIAL",
    "OTHER",
  ] as const),
  ownerId: z.string().cuid().optional(),
  emailStatus: enumArray([
    "SENDABLE",
    "DO_NOT_EMAIL",
    "UNSUBSCRIBED",
    "BOUNCED",
    "COMPLAINED",
    "INVALID",
    "SUPPRESSED",
  ] as const),
  companyId: z.string().cuid().optional(),
  dealStage: enumArray([
    "NEW_OPPORTUNITY",
    "DISCOVERY",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "WON",
    "LOST",
  ] as const),
  hasOpenDeal: z.boolean().optional(),
  hasOpenTask: z.boolean().optional(),
  noOpenTask: z.boolean().optional(),
  overdueTask: z.boolean().optional(),
  notContactedDays: z.number().int().min(1).max(3650).optional(),
  lastContactedBefore: z.string().datetime().optional(),
  lastContactedAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  createdAfter: z.string().datetime().optional(),
  servicesInterested: z.array(z.string().trim().max(120)).min(1).optional(),
  inActiveSequence: z.boolean().optional(),
  outreachPaused: z.boolean().optional(),
};

const engagementFilterShape = {
  hasDetectedOpen: z.boolean().optional(),
  hasDetectedClick: z.boolean().optional(),
  lastDetectedClickFrom: z.string().datetime().optional(),
  lastDetectedClickTo: z.string().datetime().optional(),
};

export const segmentFilterSchema = z
  .object({
    version: z.literal(SEGMENT_FILTER_VERSION),
    ...baseFilterShape,
  })
  .strict();

export const segmentFilterSchemaV2 = z
  .object({
    version: z.literal(SEGMENT_FILTER_VERSION_V2),
    ...baseFilterShape,
    ...engagementFilterShape,
  })
  .strict();

export const segmentFilterSchemaV3 = contactFilterSchemaV3;

export const segmentFilterSchemaAny = z.union([
  segmentFilterSchema,
  segmentFilterSchemaV2,
  segmentFilterSchemaV3,
]);

export type SegmentFilter = z.infer<typeof segmentFilterSchemaAny>;

export function parseSegmentFilter(raw: unknown): SegmentFilter {
  const parsed = segmentFilterSchemaAny.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid segment filter configuration.");
  }
  return parsed.data;
}
