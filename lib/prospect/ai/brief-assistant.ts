import { z } from "zod";
import { createAIProviderOrTestOverride } from "@/lib/ai/providers";
import { sandboxUntrustedText } from "@/lib/ai/safety";
import { PROSPECT_BRIEF_PROMPT_VERSION } from "@/lib/prospect/constants";
import {
  buildBriefContextForField,
  combineBriefFieldInput,
  getBriefFieldWritingGuidance,
  isSparseBriefFieldInput,
} from "@/lib/prospect/ai/brief-field-context";
import type { TemplateValues } from "@/components/templates/brief-plain-text";

const BRIEF_SYSTEM_PROMPT = `You are Smartlance's website project brief writing assistant.

Your job is to help users write clear, useful answers for a website project brief — answers an agency could act on.

Rules:
- Use only facts from the user's input, rough notes, and other brief answers supplied in context.
- Never invent specific business facts (names, numbers, dates, audiences, features, budgets, timelines) the user did not provide.
- When information is missing, use [square bracket placeholders] with a short hint inside, e.g. [target audience — e.g. local homeowners].
- Do NOT simply rephrase or shorten the user's words. Add structure, specificity, and professional clarity.
- For sparse input (a short phrase or single sentence), produce a substantive draft scaffold (usually 3–5 sentences or a short bullet list where appropriate).
- For detailed input, polish and organize while preserving meaning; fill gaps only with bracket placeholders.
- Write in professional international English. Be direct and practical, not salesy.
- Return JSON only.`;

export const improveFieldSchema = z.object({
  suggestion: z.string().min(40).max(2000),
  rationale: z.string().max(500),
  openQuestions: z.array(z.string().max(300)).max(5),
});

export const missingFieldsSchema = z.object({
  openQuestions: z.array(z.string().max(300)).max(15),
  unclearFields: z.array(z.string().max(100)).max(15),
});

export const briefSummarySchema = z.object({
  summaryMarkdown: z.string().max(8000),
  openQuestions: z.array(z.string().max(300)).max(15),
  suggestedServices: z.array(z.string().max(100)).max(5).optional(),
});

export type ImproveBriefFieldInput = {
  fieldId: string;
  fieldLabel: string;
  currentValue: string;
  roughNotes?: string;
  fieldHelp?: string;
  fieldPlaceholder?: string;
  sectionTitle?: string;
  briefContext?: Array<{ fieldId: string; label: string; value: string }>;
};

function buildImproveFieldPrompt(input: ImproveBriefFieldInput): string {
  const sourceText = combineBriefFieldInput(input.currentValue, input.roughNotes);
  const sparse = isSparseBriefFieldInput(sourceText);
  const fieldGuidance = getBriefFieldWritingGuidance(input.fieldId);

  const contextBlock =
    input.briefContext && input.briefContext.length > 0
      ? [
          "Other answers already in this brief (use for consistency — do not repeat verbatim):",
          ...input.briefContext.map(
            (row) => `- ${row.label}: ${sandboxUntrustedText("BRIEF", row.value)}`,
          ),
        ].join("\n")
      : null;

  return [
    `Field: ${input.fieldLabel} (${input.fieldId})`,
    input.sectionTitle ? `Section: ${input.sectionTitle}` : null,
    input.fieldHelp ? `Field help: ${input.fieldHelp}` : null,
    input.fieldPlaceholder ? `Placeholder guidance: ${input.fieldPlaceholder}` : null,
    fieldGuidance ? `What a strong answer covers: ${fieldGuidance}` : null,
    "",
    sourceText
      ? `User's current draft / notes:\n${sandboxUntrustedText("INPUT", sourceText)}`
      : "User's current draft / notes: (empty — user needs a starting scaffold)",
    contextBlock,
    "",
    sparse
      ? [
          "The input is brief. Write a substantive draft scaffold the user can edit.",
          "Use 3–5 sentences (or short bullets if the field suits a list).",
          "Include [bracket placeholders] for any detail not in the input or brief context.",
          "Do not output a one-line rephrase of the user's words.",
        ].join("\n")
      : [
          "Polish and structure the user's draft.",
          "Keep all provided facts. Expand only with [bracket placeholders] for missing details.",
          "Make the answer clearer and more actionable for a web agency.",
        ].join("\n"),
    "",
    'Return JSON: { "suggestion": "...", "rationale": "one sentence on approach", "openQuestions": ["...", "..."] }',
    "openQuestions: 2–4 specific things the user should fill in or decide next.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function improveBriefField(input: ImproveBriefFieldInput) {
  const provider = await createAIProviderOrTestOverride("FAST_MODEL");

  return provider
    .generateStructured({
      modelRole: "FAST_MODEL",
      schema: improveFieldSchema,
      schemaName: "BriefFieldImprovement",
      repairAttempts: 2,
      messages: [
        { role: "system", content: BRIEF_SYSTEM_PROMPT },
        { role: "user", content: buildImproveFieldPrompt(input) },
      ],
    })
    .then((r) => r.data);
}

export async function suggestFromReview(input: {
  fieldId: string;
  fieldLabel: string;
  reviewFindings: Array<{ title: string; explanation: string }>;
}) {
  if (input.reviewFindings.length === 0) {
    return {
      suggestion: "",
      rationale: "No review findings available.",
      openQuestions: [],
    };
  }

  const provider = await createAIProviderOrTestOverride("FAST_MODEL");
  const findings = input.reviewFindings
    .map((f) => `- ${f.title}: ${f.explanation}`)
    .join("\n");
  const fieldGuidance = getBriefFieldWritingGuidance(input.fieldId);

  return provider
    .generateStructured({
      modelRole: "FAST_MODEL",
      schema: improveFieldSchema,
      schemaName: "BriefReviewSuggestion",
      repairAttempts: 2,
      messages: [
        { role: "system", content: BRIEF_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Suggest a draft answer for field: ${input.fieldLabel} (${input.fieldId})`,
            fieldGuidance ? `What a strong answer covers: ${fieldGuidance}` : null,
            "Use ONLY these website review findings — do not invent other facts:",
            sandboxUntrustedText("REVIEW", findings),
            "Write a substantive draft (3–5 sentences or short bullets). Use [bracket placeholders] for details not in the findings.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    })
    .then((r) => r.data);
}

export async function explainBriefSection(sectionTitle: string) {
  const provider = await createAIProviderOrTestOverride("FAST_MODEL");
  return provider
    .generateStructured({
      modelRole: "FAST_MODEL",
      schema: z.object({ explanation: z.string().max(2000) }),
      schemaName: "BriefSectionExplain",
      messages: [
        { role: "system", content: BRIEF_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain what useful information belongs in the "${sectionTitle}" section of a website project brief. Be educational with concrete examples. Do not assert the user needs specific integrations or features.`,
        },
      ],
    })
    .then((r) => r.data);
}

export async function findMissingBriefFields(input: {
  unansweredFields: string[];
  sectionTitle?: string;
}) {
  const provider = await createAIProviderOrTestOverride("FAST_MODEL");
  return provider
    .generateStructured({
      modelRole: "FAST_MODEL",
      schema: missingFieldsSchema,
      schemaName: "BriefMissingFields",
      messages: [
        { role: "system", content: BRIEF_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            "These brief fields are unanswered or empty:",
            input.unansweredFields.join("\n"),
            input.sectionTitle ? `Section context: ${input.sectionTitle}` : null,
            "List open questions based only on these gaps.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    })
    .then((r) => r.data);
}

export async function generateBriefSummary(input: {
  answersSummary: string;
  reviewSummary?: string | null;
}) {
  const provider = await createAIProviderOrTestOverride("FAST_MODEL");
  return provider
    .generateStructured({
      modelRole: "FAST_MODEL",
      schema: briefSummarySchema,
      schemaName: "BriefProjectSummary",
      messages: [
        { role: "system", content: BRIEF_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            "Create a polished PROJECT SUMMARY using ONLY the information below.",
            "Surface open questions for missing details. Do not invent facts.",
            "",
            sandboxUntrustedText("BRIEF", input.answersSummary),
            input.reviewSummary
              ? `\nLinked review:\n${sandboxUntrustedText("REVIEW", input.reviewSummary)}`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    })
    .then((r) => r.data);
}

export function resolveBriefContextFromValues(
  values: TemplateValues,
  excludeFieldId: string,
) {
  return buildBriefContextForField(values, excludeFieldId);
}

export { PROSPECT_BRIEF_PROMPT_VERSION };
