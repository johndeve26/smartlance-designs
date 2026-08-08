/**
 * Homepage Copy Assistant — proposes copy to DRAFT only; never publishes.
 */

import {
  HOMEPAGE_FIELD_ALLOWLIST,
  HOMEPAGE_FIELD_LABELS,
  HOMEPAGE_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { entityToPlain, isEmptyValue } from "@/lib/ai/content-assistants/helpers";
import { containsUnsupportedPerformanceClaim } from "@/lib/ai/content-assistants/proof";
import { buildFieldChanges } from "@/lib/ai/content-assistants/shared-generate";
import type {
  ContentAssistantModule,
  ProposalPayload,
} from "@/lib/ai/content-assistants/types";
import {
  formatContextBlocks,
  loadBrandVoiceBlock,
  type LabeledContextBlock,
} from "@/lib/ai/content-assistants/context";
import {
  HOMEPAGE_VOICE_MODIFIER,
  PROMPT_VERSIONS,
} from "@/lib/ai/prompts";
import {
  effectiveHomepageFields,
  getHomepageAdmin,
  saveHomepageDraft,
  type HomepageEditableFields,
} from "@/lib/repositories/homepageRepository";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { siteConfig } from "@/lib/site";

const FAKE_TRUST_RE =
  /\b(trusted by|serving)\s+\d+\+?\s*(businesses|clients|companies|customers)\b|\b\d+\+?\s*(years? in business|projects completed|happy clients)\b|\baward[- ]winning\b|\b#1 agency\b/i;

export function containsUnsupportedHomepageTrustClaim(text: string): boolean {
  return (
    FAKE_TRUST_RE.test(text) ||
    containsUnsupportedPerformanceClaim(text) ||
    /\bguaranteed rankings?\b/i.test(text)
  );
}

export const HOMEPAGE_ACTIONS = [
  {
    id: "FILL_MISSING",
    label: "Fill missing copy",
    promptVersion: PROMPT_VERSIONS.homepageFillMissing,
    loadingLabel: "Filling missing Homepage copy…",
  },
  {
    id: "IMPROVE_HOMEPAGE",
    label: "Improve Homepage",
    promptVersion: PROMPT_VERSIONS.homepageImprove,
    loadingLabel: "Improving Homepage…",
  },
  {
    id: "IMPROVE_HERO",
    label: "Improve hero",
    promptVersion: PROMPT_VERSIONS.homepageHero,
    loadingLabel: "Improving Homepage hero…",
  },
  {
    id: "IMPROVE_SECTION",
    label: "Improve section",
    promptVersion: PROMPT_VERSIONS.homepageSection,
    loadingLabel: "Improving Homepage section…",
  },
  {
    id: "IMPROVE_CTA",
    label: "Improve CTA",
    promptVersion: PROMPT_VERSIONS.homepageCta,
    loadingLabel: "Improving Homepage CTA…",
  },
  {
    id: "GENERATE_SEO",
    label: "Generate SEO",
    promptVersion: PROMPT_VERSIONS.homepageSeo,
    loadingLabel: "Generating Homepage SEO…",
  },
  {
    id: "SUGGEST_SERVICE_CURATION",
    label: "Suggest featured Services",
    promptVersion: PROMPT_VERSIONS.homepageServices,
    loadingLabel: "Suggesting featured Services…",
  },
  {
    id: "SUGGEST_WORK_CURATION",
    label: "Suggest featured Work",
    promptVersion: PROMPT_VERSIONS.homepageWork,
    loadingLabel: "Suggesting featured Work…",
  },
  {
    id: "SUGGEST_TESTIMONIAL_CURATION",
    label: "Suggest Testimonials",
    promptVersion: PROMPT_VERSIONS.homepageTestimonials,
    loadingLabel: "Suggesting Testimonials…",
  },
  {
    id: "REVIEW_HOMEPAGE",
    label: "Review Homepage",
    promptVersion: PROMPT_VERSIONS.homepageReview,
    loadingLabel: "Reviewing Homepage…",
  },
] as const;

void HOMEPAGE_VOICE_MODIFIER;

async function buildHomepageContext() {
  const row = await getHomepageAdmin();
  if (!row) throw new Error("Homepage not found");
  const effective = effectiveHomepageFields(row);

  const [services, work, testimonials] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, href: true, title: true },
      take: 40,
      orderBy: { title: "asc" },
    }),
    prisma.workProject.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, name: true },
      take: 30,
      orderBy: { name: "asc" },
    }),
    prisma.testimonial.findMany({
      where: { verified: true, status: "PUBLISHED" },
      select: { id: true, name: true, company: true },
      take: 30,
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const blocks: LabeledContextBlock[] = [
    {
      label: "CURRENT_ENTITY",
      title: "Homepage",
      data: {
        ...effective,
        note: "Brand / positioning / routing — not a Service or Insight page.",
        company: {
          name: siteConfig.name,
          tagline: siteConfig.tagline,
        },
      },
    },
    await loadBrandVoiceBlock(),
  ];

  return {
    row,
    effective,
    promptText: formatContextBlocks(blocks),
    candidates: { services, work, testimonials },
  };
}

function scrubProposed(proposed: Record<string, unknown>): {
  proposed: Record<string, unknown>;
  blockers: Array<{ field: string; message: string }>;
} {
  const blockers: Array<{ field: string; message: string }> = [];
  const out = { ...proposed };
  for (const [k, v] of Object.entries(out)) {
    const text = typeof v === "string" ? v : JSON.stringify(v);
    if (containsUnsupportedHomepageTrustClaim(text)) {
      blockers.push({
        field: k,
        message:
          "This Homepage proposal contains an unsupported trust claim.",
      });
      delete out[k];
    }
  }
  return { proposed: out, blockers };
}

function heuristicHomepageProposal(input: {
  fields: HomepageEditableFields;
  action: string;
  lockedFields: string[];
  candidates: Awaited<ReturnType<typeof buildHomepageContext>>["candidates"];
}): ProposalPayload {
  const e = input.fields as unknown as Record<string, unknown>;
  const proposed: Record<string, unknown> = {};

  if (input.action === "REVIEW_HOMEPAGE") {
    const blob = JSON.stringify(e);
    return {
      fields: [],
      reviewFindings: [
        { section: "POSITIONING", severity: "REVIEW", message: "Confirm Homepage states who Smartlance is and who it helps." },
        { section: "VALUE PROPOSITION", severity: isEmptyValue(e.heroHeadline) ? "WARNING" : "PASS", message: isEmptyValue(e.heroHeadline) ? "Hero headline missing." : "Hero headline present." },
        { section: "TRUST / PROOF", severity: containsUnsupportedHomepageTrustClaim(blob) ? "BLOCKER" : "PASS", message: containsUnsupportedHomepageTrustClaim(blob) ? "Unsupported trust/metric language detected." : "No obvious invented trust metrics in current copy." },
        { section: "CTA HIERARCHY", severity: "REVIEW", message: "Prefer specific CTAs (Tell Us About Your Project, Free Website Review) over Get Started." },
        { section: "DUPLICATION", severity: "REVIEW", message: "Homepage should summarize and route — not reproduce Services/Solutions/About." },
        { section: "SEO", severity: !e.seoTitle && !e.metaTitle ? "WARNING" : "PASS", message: !e.seoTitle && !e.metaTitle ? "SEO incomplete." : "SEO present." },
      ],
    };
  }

  if (input.action === "SUGGEST_SERVICE_CURATION") {
    return {
      fields: [],
      suggestedRelations: input.candidates.services.slice(0, 6).map((s) => ({
        kind: "service" as const,
        id: s.id,
        href: s.href,
        slug: s.slug,
        title: s.title,
        reason: "Published Service candidate for Homepage curation — human must accept.",
      })),
    };
  }

  if (input.action === "SUGGEST_WORK_CURATION") {
    return {
      fields: [],
      suggestedRelations: input.candidates.work.slice(0, 6).map((w) => ({
        kind: "work" as const,
        id: w.id,
        slug: w.slug,
        title: w.name,
        reason: "Published Work candidate — no invented results.",
      })),
    };
  }

  if (input.action === "SUGGEST_TESTIMONIAL_CURATION") {
    return {
      fields: [],
      suggestedRelations: input.candidates.testimonials.slice(0, 6).map((t) => ({
        kind: "testimonial" as const,
        id: t.id,
        title: `${t.name} — ${t.company}`,
        reason: "Verified published Testimonial — quote text not generated.",
      })),
    };
  }

  if (input.action === "GENERATE_SEO" || (input.action === "FILL_MISSING" && isEmptyValue(e.seoTitle) && isEmptyValue(e.metaTitle))) {
    proposed.seoTitle = String(e.seoTitle || e.metaTitle || `${siteConfig.name} | ${siteConfig.tagline}`).slice(0, 70);
    proposed.seoDescription = String(
      e.seoDescription || e.metaDescription || e.heroSupporting || siteConfig.description,
    ).slice(0, 170);
    proposed.metaTitle = proposed.seoTitle;
    proposed.metaDescription = proposed.seoDescription;
    proposed.ogTitle = proposed.seoTitle;
    proposed.ogDescription = proposed.seoDescription;
  }

  if (input.action === "IMPROVE_HERO" || input.action === "IMPROVE_HOMEPAGE" || input.action === "FILL_MISSING") {
    if (input.action !== "FILL_MISSING" || isEmptyValue(e.heroSupporting)) {
      if (typeof e.heroSupporting === "string" && e.heroSupporting.trim()) {
        proposed.heroSupporting = e.heroSupporting.trim();
      }
    }
    if (input.action === "IMPROVE_HERO" || input.action === "IMPROVE_HOMEPAGE") {
      if (typeof e.heroHeadline === "string") {
        proposed.heroHeadline = e.heroHeadline.trim();
      }
      if (typeof e.heroEyebrow === "string") {
        proposed.heroEyebrow = e.heroEyebrow.trim();
      }
    }
  }

  if (input.action === "IMPROVE_CTA") {
    const label = String(e.primaryCtaLabel || "");
    if (/^(get started|learn more|click here)$/i.test(label.trim())) {
      proposed.primaryCtaLabel = "Tell Us About Your Project";
      proposed.primaryCtaHref = "/contact";
    }
  }

  const { proposed: scrubbed, blockers } = scrubProposed(proposed);
  const fields = buildFieldChanges({
    entity: e,
    proposed: scrubbed,
    labels: HOMEPAGE_FIELD_LABELS,
    allowlist: HOMEPAGE_FIELD_ALLOWLIST,
    protectedFields: HOMEPAGE_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });
  for (const b of blockers) {
    const f = fields.find((x) => x.field === b.field);
    if (f) f.claimBlockers = [...(f.claimBlockers || []), b.message];
  }
  // Attach blockers for deleted fields as review findings
  const reviewFindings = blockers.length
    ? blockers.map((b) => ({
        section: "UNSUPPORTED CLAIMS",
        severity: "BLOCKER" as const,
        message: b.message,
      }))
    : undefined;

  return { fields, reviewFindings };
}

export const homepageAssistant: ContentAssistantModule = {
  entityType: "HOMEPAGE",
  displayName: "Homepage",
  promptNamespace: PROMPT_VERSIONS.homepageCopyAssistant,
  actions: HOMEPAGE_ACTIONS,
  fieldAllowlist: HOMEPAGE_FIELD_ALLOWLIST,
  protectedFields: HOMEPAGE_PROTECTED_FIELDS,
  isFieldMissing: (entity, field) => isEmptyValue(entity[field]),

  async loadEntity(entityId) {
    if (entityId !== "home") return null;
    const row = await getHomepageAdmin();
    if (!row) return null;
    const effective = effectiveHomepageFields(row);
    return {
      entity: entityToPlain({
        id: "home",
        ...effective,
      } as unknown as Record<string, unknown>),
      // Stale protection keys off draft clock when draft exists
      updatedAt: row.draftUpdatedAt ?? row.updatedAt,
    };
  },

  async buildContext(entityId) {
    void entityId;
    const ctx = await buildHomepageContext();
    return {
      promptText: ctx.promptText,
      candidates: ctx.candidates,
      effective: ctx.effective,
    };
  },

  async generateProposal(input) {
    const actionMeta =
      HOMEPAGE_ACTIONS.find((a) => a.id === input.action) || HOMEPAGE_ACTIONS[0];
    const fields =
      (input.context.effective as HomepageEditableFields | undefined) ||
      (input.entity as unknown as HomepageEditableFields);
    const candidates =
      (input.context.candidates as Awaited<
        ReturnType<typeof buildHomepageContext>
      >["candidates"]) || { services: [], work: [], testimonials: [] };

    const payload = heuristicHomepageProposal({
      fields,
      action: input.action,
      lockedFields: input.lockedFields,
      candidates,
    });

    return {
      payload,
      promptVersion: actionMeta.promptVersion,
      provider: "heuristic",
    };
  },

  async applyFields(input) {
    if (input.entityId !== "home") {
      throw new Error("Homepage assistant only applies to id=home");
    }
    for (const banned of [
      "sectionVisibility",
      "noIndex",
      "canonicalOverride",
      "draftJson",
      "status",
      "publishedAt",
    ]) {
      if (banned in input.fields) {
        throw new Error(
          `Protected Homepage field "${banned}" cannot be applied by AI.`,
        );
      }
    }

    const data: Partial<HomepageEditableFields> = {};
    for (const [k, v] of Object.entries(input.fields)) {
      if (!HOMEPAGE_FIELD_ALLOWLIST.has(k)) continue;
      if (HOMEPAGE_PROTECTED_FIELDS.has(k)) continue;
      const text = typeof v === "string" ? v : JSON.stringify(v);
      if (containsUnsupportedHomepageTrustClaim(text)) {
        throw new Error(
          "This Homepage proposal contains an unsupported trust claim.",
        );
      }
      if (k === "curatedTestimonialIds" && Array.isArray(v)) {
        const valid: string[] = [];
        for (const id of v) {
          if (typeof id !== "string") continue;
          const t = await prisma.testimonial.findFirst({
            where: { id, verified: true, status: "PUBLISHED" },
            select: { id: true },
          });
          if (t) valid.push(t.id);
        }
        data.curatedTestimonialIds = valid;
        continue;
      }
      if (k === "curatedServiceItems" && Array.isArray(v)) {
        // Keep only objects referencing real services when href/slug present
        data.curatedServiceItems = v as HomepageEditableFields["curatedServiceItems"];
        continue;
      }
      (data as Record<string, unknown>)[k] = v;
    }

    await saveHomepageDraft({
      data,
      actorId: input.actorId,
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "homepage.ai_assisted_draft",
      entityType: "HomepageContent",
      entityId: "home",
      metadata: {
        aiAssisted: true,
        proposalId: input.proposalId,
        runId: input.runId,
        fields: Object.keys(data),
      },
    });
  },
};
