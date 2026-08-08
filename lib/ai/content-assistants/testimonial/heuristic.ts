/**
 * Testimonial Assistant heuristics — preserve client words; never invent quotes.
 */

import type { Testimonial } from "@prisma/client";
import {
  TESTIMONIAL_FIELD_ALLOWLIST,
  TESTIMONIAL_FIELD_LABELS,
  TESTIMONIAL_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import {
  deterministicFormatQuote,
  isSafeQuoteFormat,
  isValidExcerptFromOriginal,
  quoteWords,
} from "@/lib/ai/content-assistants/proof";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";

const THEME_KEYWORDS: Array<{ theme: string; patterns: RegExp[] }> = [
  { theme: "communication", patterns: [/communicat/i, /respons/i, /clear/i] },
  { theme: "design quality", patterns: [/design/i, /look(s|ed)?/i, /visual/i] },
  { theme: "reliability", patterns: [/reliab/i, /dependable/i, /trust/i] },
  { theme: "technical skill", patterns: [/technical/i, /development/i, /code/i] },
  {
    theme: "project experience",
    patterns: [/process/i, /on time/i, /deadline/i, /project/i, /delivered/i],
  },
];

/** Deterministic shorter excerpt — subsequence of original words with optional ellipsis. */
export function createDeterministicExcerpt(
  original: string,
  maxWords = 18,
): string | null {
  const words = original.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return original.trim();

  // Prefer keeping start + end when long
  const head = Math.ceil(maxWords * 0.55);
  const tail = maxWords - head;
  const excerpt = [...words.slice(0, head), "…", ...words.slice(-tail)].join(" ");
  if (!isValidExcerptFromOriginal(original, excerpt.replace(/…/g, " "))) {
    // Fallback: prefix only
    const prefix = words.slice(0, maxWords).join(" ") + "…";
    if (isValidExcerptFromOriginal(original, prefix.replace(/…/g, " "))) return prefix;
    return null;
  }
  return excerpt;
}

function classifyThemes(quote: string): string[] {
  const found: string[] = [];
  for (const { theme, patterns } of THEME_KEYWORDS) {
    if (patterns.some((p) => p.test(quote))) found.push(theme);
  }
  return found;
}

export function heuristicTestimonialProposal(input: {
  testimonial: Testimonial;
  action: string;
  lockedFields: string[];
  sourceQuote: string;
  relationPool?: {
    work: Array<{
      id: string;
      slug: string;
      name: string;
      clientName: string | null;
    }>;
  };
}): ProposalPayload {
  const t = input.testimonial;
  const original = input.sourceQuote || t.originalQuote || t.quote || "";

  if (!original.trim()) {
    return {
      fields: [],
      reviewFindings: [
        {
          section: "SOURCE PRESENT",
          severity: "BLOCKER",
          message:
            "Add the client's verified feedback before using Testimonial Assistant.",
        },
      ],
    };
  }

  if (input.action === "REVIEW_TESTIMONIAL") {
    const excerptOk =
      !t.displayExcerpt ||
      isValidExcerptFromOriginal(original, t.displayExcerpt);
    return {
      fields: [],
      reviewFindings: [
        {
          section: "SOURCE PRESENT",
          severity: "PASS",
          message: "Original quote is present.",
        },
        {
          section: "QUOTE INTEGRITY",
          severity: "PASS",
          message: "Working quote should remain faithful to the original wording.",
        },
        {
          section: "VERIFICATION STATUS",
          severity: t.verified ? "PASS" : "REVIEW",
          message: t.verified
            ? "Marked verified — Assistant cannot change verification."
            : "Not yet verified — Assistant can format/excerpt but cannot mark verified.",
        },
        {
          section: "DISPLAY EXCERPT",
          severity: excerptOk ? "PASS" : "BLOCKER",
          message: excerptOk
            ? t.displayExcerpt
              ? "Display excerpt derives from the original quote."
              : "No display excerpt yet."
            : "Display excerpt changes the client's wording and cannot be accepted.",
        },
        {
          section: "ATTRIBUTION",
          severity: "PASS",
          message: "Name / role / company are human-controlled — AI must not change them.",
        },
        {
          section: "RELATED WORK",
          severity: t.workProjectId ? "PASS" : "REVIEW",
          message: t.workProjectId
            ? "Related Case Study is set."
            : "No related Case Study — suggest only with supporting evidence.",
        },
        {
          section: "PUBLICATION READINESS",
          severity: t.verified ? "PASS" : "WARNING",
          message: "Publishing still requires verified + published via normal workflow.",
        },
        {
          section: "PRIVATE METADATA",
          severity: "PASS",
          message: "Internal verification notes are never sent to the AI provider.",
        },
      ],
    };
  }

  if (input.action === "FORMAT_QUOTE") {
    const formatted = deterministicFormatQuote(original);
    if (!isSafeQuoteFormat(original, formatted)) {
      return {
        fields: [],
        reviewFindings: [
          {
            section: "QUOTE INTEGRITY",
            severity: "BLOCKER",
            message:
              "Formatting would change the client's wording and cannot be accepted.",
          },
        ],
      };
    }
    const fields = buildFieldChanges({
      entity: t as unknown as Record<string, unknown>,
      proposed: { quote: formatted },
      labels: TESTIMONIAL_FIELD_LABELS,
      allowlist: TESTIMONIAL_FIELD_ALLOWLIST,
      protectedFields: TESTIMONIAL_PROTECTED_FIELDS,
      lockedFields: input.lockedFields,
    });
    return { fields };
  }

  if (input.action === "CREATE_EXCERPT") {
    const excerpt = createDeterministicExcerpt(original);
    if (!excerpt || !isValidExcerptFromOriginal(original, excerpt.replace(/…/g, " "))) {
      return {
        fields: [],
        reviewFindings: [
          {
            section: "DISPLAY EXCERPT",
            severity: "BLOCKER",
            message:
              "Could not create a safe excerpt that preserves the client's words.",
          },
        ],
      };
    }
    const fields = buildFieldChanges({
      entity: t as unknown as Record<string, unknown>,
      proposed: { displayExcerpt: excerpt },
      labels: TESTIMONIAL_FIELD_LABELS,
      allowlist: TESTIMONIAL_FIELD_ALLOWLIST,
      protectedFields: TESTIMONIAL_PROTECTED_FIELDS,
      lockedFields: input.lockedFields,
    });
    // Extra integrity flag for apply layer
    for (const f of fields) {
      if (f.field === "displayExcerpt") {
        const words = quoteWords(String(f.proposed));
        if (!words.length) {
          f.claimBlockers = [
            "This excerpt changes the client's wording and cannot be accepted.",
          ];
        }
      }
    }
    return { fields };
  }

  if (input.action === "CLASSIFY_THEME") {
    const themes = classifyThemes(original);
    const fields = buildFieldChanges({
      entity: t as unknown as Record<string, unknown>,
      proposed: { themesJson: themes },
      labels: TESTIMONIAL_FIELD_LABELS,
      allowlist: TESTIMONIAL_FIELD_ALLOWLIST,
      protectedFields: TESTIMONIAL_PROTECTED_FIELDS,
      lockedFields: input.lockedFields,
    });
    return {
      fields,
      reviewFindings: themes.length
        ? undefined
        : [
            {
              section: "QUOTE INTEGRITY",
              severity: "REVIEW",
              message: "No clear themes detected from the quote wording.",
            },
          ],
    };
  }

  if (input.action === "SUGGEST_RELATED_WORK") {
    const company = (t.company || "").trim().toLowerCase();
    const matches = (input.relationPool?.work || []).filter((w) => {
      const client = (w.clientName || "").trim().toLowerCase();
      const name = (w.name || "").trim().toLowerCase();
      if (!company) return false;
      return (
        (client && (client === company || client.includes(company) || company.includes(client))) ||
        name.includes(company)
      );
    });
    // Do not invent relation solely from weak name overlap without clientName match
    const strong = matches.filter((w) => {
      const client = (w.clientName || "").trim().toLowerCase();
      return client && (client === company || client.includes(company) || company.includes(client));
    });
    return {
      fields: [],
      suggestedRelations: strong.slice(0, 3).map((w) => ({
        kind: "work" as const,
        id: w.id,
        slug: w.slug,
        title: w.name,
        reason: `Client/company name aligns with Case Study clientName (${w.clientName}). Human must confirm.`,
      })),
      reviewFindings: strong.length
        ? undefined
        : [
            {
              section: "RELATED WORK",
              severity: "REVIEW",
              message:
                "No Case Study suggestion with verified client-name match. Do not infer from company alone without matching logic.",
            },
          ],
    };
  }

  return {
    fields: [],
    reviewFindings: [
      {
        section: "QUOTE INTEGRITY",
        severity: "REVIEW",
        message: "Unknown Testimonial Assistant action.",
      },
    ],
  };
}
