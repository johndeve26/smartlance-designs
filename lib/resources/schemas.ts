import { z } from "zod";

const stringArray = z.array(z.string());

const resourceSectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    body: z.string(),
  })
  .passthrough();

const checklistItemSchema = z
  .object({
    id: z.string().min(1),
    text: z.string(),
  })
  .passthrough();

const checklistSectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    items: z.array(checklistItemSchema),
  })
  .passthrough();

const comparisonCriterionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string(),
    optionA: z.string(),
    optionB: z.string(),
  })
  .passthrough();

const comparisonMatrixRowSchema = z
  .object({
    id: z.string().min(1),
    label: z.string(),
    optionA: z.string(),
    optionB: z.string(),
    note: z.string(),
  })
  .passthrough();

const templateFieldSchema = z
  .object({
    id: z.string().min(1),
    label: z.string(),
    kind: z.string(),
  })
  .passthrough();

const templateSectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    fields: z.array(templateFieldSchema),
  })
  .passthrough();

export const guidePayloadSchema = z
  .object({
    type: z.literal("guide"),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    intro: z.string(),
    sections: z.array(resourceSectionSchema),
    readingTime: z.string(),
    published: z.boolean(),
    publishedAt: z.string(),
    topicIds: z.array(z.string()),
  })
  .passthrough();

export const comparisonPayloadSchema = z
  .object({
    type: z.literal("comparison"),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    optionA: z.string(),
    optionB: z.string(),
    summary: z.string(),
    quickFitA: stringArray,
    quickFitB: stringArray,
    comparisonCriteria: z.array(comparisonCriterionSchema),
    decisionMatrix: z.array(comparisonMatrixRowSchema),
    sections: z.array(
      z.object({ id: z.string().min(1), title: z.string(), body: z.string() }).passthrough(),
    ),
    bestForA: stringArray,
    bestForB: stringArray,
    decisionQuestions: stringArray,
    tradeoffs: stringArray,
    decisionGuidance: z.string(),
    readingTime: z.string(),
    published: z.boolean(),
    publishedAt: z.string(),
    topicIds: z.array(z.string()),
  })
  .passthrough();

export const checklistPayloadSchema = z
  .object({
    type: z.literal("checklist"),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sections: z.array(checklistSectionSchema),
    published: z.boolean(),
    publishedAt: z.string(),
    topicIds: z.array(z.string()),
  })
  .passthrough();

export const glossaryPayloadSchema = z
  .object({
    type: z.literal("glossary"),
    slug: z.string().min(1),
    term: z.string().min(1),
    shortDefinition: z.string().min(1),
    fullExplanation: z.string().min(1),
    glossaryTopicGroup: z.string().min(1),
    published: z.boolean(),
    publishedAt: z.string(),
    topicIds: z.array(z.string()),
  })
  .passthrough();

export const templatePayloadSchema = z
  .object({
    type: z.literal("template"),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sections: z.array(templateSectionSchema),
    published: z.boolean(),
    publishedAt: z.string(),
    topicIds: z.array(z.string()),
  })
  .passthrough();

/** Tool payloads carry marketing copy only — never scoring engines. */
export const toolPayloadSchema = z
  .object({
    type: z.literal("tool"),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    published: z.boolean(),
    publishedAt: z.string(),
    topicIds: z.array(z.string()),
  })
  .passthrough();

const payloadSchemaByType = {
  guide: guidePayloadSchema,
  comparison: comparisonPayloadSchema,
  checklist: checklistPayloadSchema,
  glossary: glossaryPayloadSchema,
  template: templatePayloadSchema,
  tool: toolPayloadSchema,
} as const;

export type ResourceKindKey = keyof typeof payloadSchemaByType;

export function validateResourcePayload(
  type: ResourceKindKey,
  payload: unknown,
) {
  return payloadSchemaByType[type].parse(payload);
}

export function safeParseResourcePayload(type: ResourceKindKey, payload: unknown) {
  return payloadSchemaByType[type].safeParse(payload);
}
