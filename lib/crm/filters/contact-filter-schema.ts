import { z } from "zod";
import { CRM_CONTACT_FILTER_MAX_CONDITIONS } from "@/lib/crm/properties/constants";

/** Shared Contact filter AST — used by Saved Views and Segment v3. */
export const CONTACT_FILTER_VERSION = 3 as const;

const textOps = z.enum([
  "IS",
  "IS_NOT",
  "CONTAINS",
  "NOT_CONTAINS",
  "STARTS_WITH",
  "IS_KNOWN",
  "IS_UNKNOWN",
]);

const numberOps = z.enum(["EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IS_KNOWN", "IS_UNKNOWN"]);
const boolOps = z.enum(["IS_TRUE", "IS_FALSE", "IS_UNKNOWN"]);
const dateOps = z.enum(["BEFORE", "AFTER", "ON", "BETWEEN", "IS_KNOWN", "IS_UNKNOWN"]);
const selectOps = z.enum(["IN", "NOT_IN", "IS_KNOWN", "IS_UNKNOWN"]);
const multiOps = z.enum(["CONTAINS_ANY", "CONTAINS_ALL", "CONTAINS_NONE", "IS_KNOWN", "IS_UNKNOWN"]);
const socialOps = z.enum(["HAS", "MISSING"]);

export const standardFieldSchema = z.enum([
  "firstName",
  "lastName",
  "displayName",
  "email",
  "phone",
  "jobTitle",
  "companyId",
  "countryCode",
  "stateRegion",
  "city",
  "source",
  "sourceDetail",
  "lifecycleStage",
  "leadStatus",
  "temperature",
  "emailStatus",
  "ownerId",
  "lastContactedAt",
  "createdAt",
  "nextActivityAt",
  "hasOpenDeal",
  "hasOverdueTask",
  "hasOpenTask",
  "hasLocation",
  "missingLocation",
]);

const standardConditionSchema = z.object({
  kind: z.literal("STANDARD"),
  field: standardFieldSchema,
  operator: z.string().min(1).max(40),
  value: z.unknown().optional(),
});

const customConditionSchema = z.object({
  kind: z.literal("CUSTOM"),
  propertyId: z.string().cuid(),
  operator: z.string().min(1).max(40),
  value: z.unknown().optional(),
});

const socialConditionSchema = z.object({
  kind: z.literal("SOCIAL"),
  platform: z.enum([
    "LINKEDIN",
    "X",
    "FACEBOOK",
    "INSTAGRAM",
    "GITHUB",
    "YOUTUBE",
    "TIKTOK",
    "OTHER",
    "ANY",
  ]),
  operator: socialOps,
});

const notesConditionSchema = z.object({
  kind: z.literal("NOTES"),
  operator: z.literal("CONTAINS"),
  value: z.string().trim().min(1).max(200),
});

const engagementConditionSchema = z.object({
  kind: z.literal("ENGAGEMENT"),
  field: z.enum(["hasDetectedOpen", "hasDetectedClick"]),
  operator: z.enum(["IS_TRUE", "IS_FALSE"]),
});

export const contactFilterConditionSchema = z.discriminatedUnion("kind", [
  standardConditionSchema,
  customConditionSchema,
  socialConditionSchema,
  notesConditionSchema,
  engagementConditionSchema,
]);

export const contactFilterSchemaV3 = z
  .object({
    version: z.literal(CONTACT_FILTER_VERSION),
    match: z.enum(["ALL", "ANY"]).default("ALL"),
    conditions: z.array(contactFilterConditionSchema).max(CRM_CONTACT_FILTER_MAX_CONDITIONS),
  })
  .strict();

export type ContactFilterV3 = z.infer<typeof contactFilterSchemaV3>;
export type ContactFilterCondition = z.infer<typeof contactFilterConditionSchema>;

export function parseContactFilterV3(raw: unknown): ContactFilterV3 {
  const parsed = contactFilterSchemaV3.safeParse(raw);
  if (!parsed.success) throw new Error("Invalid contact filter.");
  return parsed.data;
}

export { textOps, numberOps, boolOps, dateOps, selectOps, multiOps, socialOps };
