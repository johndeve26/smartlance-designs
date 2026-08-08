/**
 * Homepage CMS repository — published columns are live; draftJson is unpublished.
 */

import { Prisma } from "@prisma/client";
import type { HomepageContent } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import { toPublicHomepage } from "@/lib/repositories/mappers";
import {
  createContentRevision,
  revalidateHomepage,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export type HomepageEditableFields = {
  heroEyebrow: string;
  heroHeadline: string;
  heroHeadlineAccent: string | null;
  heroSupporting: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  metaTitle: string | null;
  metaDescription: string | null;
  sections: Prisma.InputJsonValue;
  sectionVisibility: Prisma.InputJsonValue;
  curatedServiceItems: Prisma.InputJsonValue;
  curatedTestimonialIds: Prisma.InputJsonValue;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImagePath: string | null;
  noIndex: boolean;
  canonicalOverride: string | null;
};

const EDITABLE_KEYS: (keyof HomepageEditableFields)[] = [
  "heroEyebrow",
  "heroHeadline",
  "heroHeadlineAccent",
  "heroSupporting",
  "primaryCtaLabel",
  "primaryCtaHref",
  "secondaryCtaLabel",
  "secondaryCtaHref",
  "metaTitle",
  "metaDescription",
  "sections",
  "sectionVisibility",
  "curatedServiceItems",
  "curatedTestimonialIds",
  "seoTitle",
  "seoDescription",
  "ogTitle",
  "ogDescription",
  "ogImagePath",
  "noIndex",
  "canonicalOverride",
];

export function publishedFieldsFromRow(row: HomepageContent): HomepageEditableFields {
  return {
    heroEyebrow: row.heroEyebrow,
    heroHeadline: row.heroHeadline,
    heroHeadlineAccent: row.heroHeadlineAccent,
    heroSupporting: row.heroSupporting,
    primaryCtaLabel: row.primaryCtaLabel,
    primaryCtaHref: row.primaryCtaHref,
    secondaryCtaLabel: row.secondaryCtaLabel,
    secondaryCtaHref: row.secondaryCtaHref,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    sections: (row.sections ?? {}) as Prisma.InputJsonValue,
    sectionVisibility: (row.sectionVisibility ?? {}) as Prisma.InputJsonValue,
    curatedServiceItems: (row.curatedServiceItems ?? []) as Prisma.InputJsonValue,
    curatedTestimonialIds: (row.curatedTestimonialIds ??
      []) as Prisma.InputJsonValue,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImagePath: row.ogImagePath,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
  };
}

export function parseDraftJson(raw: unknown): Partial<HomepageEditableFields> | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as Partial<HomepageEditableFields>;
}

/** Effective fields for Admin editor / AI / preview (draft overlays published). */
export function effectiveHomepageFields(row: HomepageContent): HomepageEditableFields {
  const published = publishedFieldsFromRow(row);
  const draft = parseDraftJson(row.draftJson);
  if (!draft) return published;
  return { ...published, ...draft };
}

export function hasHomepageDraft(row: HomepageContent | null | undefined): boolean {
  return Boolean(row?.draftJson && typeof row.draftJson === "object");
}

export async function getHomepageContent() {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.homepageContent.findUnique({
    where: { id: "home" },
  });
  // Public always uses published columns — never draftJson
  return row ? toPublicHomepage(row) : null;
}

export async function getHomepageAdmin() {
  return prisma.homepageContent.findUnique({ where: { id: "home" } });
}

/** Preview unpublished draft (or published if no draft). */
export async function getHomepageForPreview() {
  const row = await getHomepageAdmin();
  if (!row) return null;
  const effective = effectiveHomepageFields(row);
  return toPublicHomepage({
    ...row,
    ...effective,
  } as HomepageContent);
}

function snapshot(row: HomepageContent): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

function normalizePartial(
  data: Partial<HomepageEditableFields>,
): Partial<HomepageEditableFields> {
  const out: Partial<HomepageEditableFields> = {};
  for (const key of EDITABLE_KEYS) {
    if (key in data && data[key] !== undefined) {
      (out as Record<string, unknown>)[key] = data[key];
    }
  }
  return out;
}

/** @deprecated Prefer saveHomepageDraft */
export async function saveHomepage(input: {
  data: Partial<HomepageEditableFields>;
  actorId: string;
}) {
  return saveHomepageDraft(input);
}

export async function saveHomepageDraft(input: {
  data: Partial<HomepageEditableFields>;
  actorId: string;
}) {
  const existing = await prisma.homepageContent.findUnique({
    where: { id: "home" },
  });

  const base: HomepageEditableFields = existing
    ? effectiveHomepageFields(existing)
    : {
        heroEyebrow: "",
        heroHeadline: "",
        heroHeadlineAccent: null,
        heroSupporting: "",
        primaryCtaLabel: "Contact",
        primaryCtaHref: "/contact",
        secondaryCtaLabel: "Work",
        secondaryCtaHref: "/work",
        metaTitle: null,
        metaDescription: null,
        sections: {},
        sectionVisibility: {},
        curatedServiceItems: [],
        curatedTestimonialIds: [],
        seoTitle: null,
        seoDescription: null,
        ogTitle: null,
        ogDescription: null,
        ogImagePath: null,
        noIndex: false,
        canonicalOverride: null,
      };

  const nextDraft: HomepageEditableFields = {
    ...base,
    ...normalizePartial(input.data),
  };

  const now = new Date();
  const row = existing
    ? await prisma.homepageContent.update({
        where: { id: "home" },
        data: {
          draftJson: nextDraft as unknown as Prisma.InputJsonValue,
          draftUpdatedAt: now,
          draftUpdatedById: input.actorId,
        },
      })
    : await prisma.homepageContent.create({
        data: {
          id: "home",
          heroEyebrow: nextDraft.heroEyebrow,
          heroHeadline: nextDraft.heroHeadline,
          heroHeadlineAccent: nextDraft.heroHeadlineAccent,
          heroSupporting: nextDraft.heroSupporting,
          primaryCtaLabel: nextDraft.primaryCtaLabel,
          primaryCtaHref: nextDraft.primaryCtaHref,
          secondaryCtaLabel: nextDraft.secondaryCtaLabel,
          secondaryCtaHref: nextDraft.secondaryCtaHref,
          metaTitle: nextDraft.metaTitle,
          metaDescription: nextDraft.metaDescription,
          sections: nextDraft.sections,
          sectionVisibility: nextDraft.sectionVisibility,
          curatedServiceItems: nextDraft.curatedServiceItems,
          curatedTestimonialIds: nextDraft.curatedTestimonialIds,
          seoTitle: nextDraft.seoTitle,
          seoDescription: nextDraft.seoDescription,
          ogTitle: nextDraft.ogTitle,
          ogDescription: nextDraft.ogDescription,
          ogImagePath: nextDraft.ogImagePath,
          noIndex: nextDraft.noIndex,
          canonicalOverride: nextDraft.canonicalOverride,
          draftJson: nextDraft as unknown as Prisma.InputJsonValue,
          draftUpdatedAt: now,
          draftUpdatedById: input.actorId,
          updatedById: input.actorId,
        },
      });

  await createContentRevision({
    entityType: "HomepageContent",
    entityId: row.id,
    snapshot: {
      kind: "draft",
      draft: nextDraft,
      published: existing ? publishedFieldsFromRow(existing) : null,
    } as unknown as Prisma.InputJsonValue,
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "homepage.save_draft",
    entityType: "HomepageContent",
    entityId: row.id,
    metadata: { hasDraft: true },
  });
  return row;
}

export async function publishHomepage(input: { actorId: string }) {
  const existing = await prisma.homepageContent.findUniqueOrThrow({
    where: { id: "home" },
  });
  if (!hasHomepageDraft(existing)) {
    throw new Error("No unpublished Homepage draft to publish.");
  }
  const fields = effectiveHomepageFields(existing);

  const row = await prisma.homepageContent.update({
    where: { id: "home" },
    data: {
      heroEyebrow: fields.heroEyebrow,
      heroHeadline: fields.heroHeadline,
      heroHeadlineAccent: fields.heroHeadlineAccent,
      heroSupporting: fields.heroSupporting,
      primaryCtaLabel: fields.primaryCtaLabel,
      primaryCtaHref: fields.primaryCtaHref,
      secondaryCtaLabel: fields.secondaryCtaLabel,
      secondaryCtaHref: fields.secondaryCtaHref,
      metaTitle: fields.metaTitle,
      metaDescription: fields.metaDescription,
      sections: fields.sections,
      sectionVisibility: fields.sectionVisibility,
      curatedServiceItems: fields.curatedServiceItems,
      curatedTestimonialIds: fields.curatedTestimonialIds,
      seoTitle: fields.seoTitle,
      seoDescription: fields.seoDescription,
      ogTitle: fields.ogTitle,
      ogDescription: fields.ogDescription,
      ogImagePath: fields.ogImagePath,
      noIndex: fields.noIndex,
      canonicalOverride: fields.canonicalOverride,
      draftJson: Prisma.JsonNull,
      draftUpdatedAt: null,
      draftUpdatedById: null,
      updatedById: input.actorId,
    },
  });

  await createContentRevision({
    entityType: "HomepageContent",
    entityId: row.id,
    snapshot: snapshot(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "homepage.publish",
    entityType: "HomepageContent",
    entityId: row.id,
  });
  revalidateHomepage();
  return row;
}

export async function discardHomepageDraft(input: { actorId: string }) {
  const row = await prisma.homepageContent.update({
    where: { id: "home" },
    data: {
      draftJson: Prisma.JsonNull,
      draftUpdatedAt: null,
      draftUpdatedById: null,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "homepage.discard_draft",
    entityType: "HomepageContent",
    entityId: row.id,
  });
  return row;
}
