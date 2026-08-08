/**
 * Homepage Copy Assistant — structured output schemas (Zod).
 * Heuristic path still returns ProposalPayload; schemas document contracts.
 */

import { z } from "zod";

export const HomepageHeroOutput = z.object({
  heroEyebrow: z.string().optional(),
  heroHeadline: z.string().optional(),
  heroHeadlineAccent: z.string().nullable().optional(),
  heroSupporting: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  primaryCtaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
});

export const HomepageSectionOutput = z.object({
  sections: z.record(z.string(), z.unknown()).optional(),
});

export const HomepageCtaOutput = z.object({
  primaryCtaLabel: z.string().optional(),
  primaryCtaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
});

export const HomepageSeoOutput = z.object({
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
});

export const HomepageCurationSuggestionOutput = z.object({
  suggestions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      reason: z.string().optional(),
    }),
  ),
});

export const HomepageFullProposalOutput = HomepageHeroOutput.merge(
  HomepageSeoOutput,
).extend({
  sections: z.record(z.string(), z.unknown()).optional(),
});

export const HomepageReviewOutput = z.object({
  findings: z.array(
    z.object({
      section: z.string(),
      severity: z.enum(["PASS", "WARNING", "REVIEW", "BLOCKER"]),
      message: z.string(),
    }),
  ),
});
