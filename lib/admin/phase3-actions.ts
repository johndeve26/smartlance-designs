"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { setPreviewCookie } from "@/lib/admin/content-actions";
import { workFieldsFromForm } from "@/lib/admin/work-form";
import {
  publishIndustry,
  saveIndustry,
  unpublishIndustry,
} from "@/lib/repositories/industriesRepository";
import {
  changeWorkSlug,
  discardWorkDraft,
  effectiveWorkFields,
  getWorkByIdAdmin,
  publishWork,
  saveWorkDraft,
  unpublishWork,
} from "@/lib/repositories/workRepository";
import {
  publishTestimonial,
  saveTestimonial,
  setTestimonialVerified,
  unpublishTestimonial,
} from "@/lib/repositories/testimonialsRepository";
import {
  changeInsightSlug,
  publishInsight,
  saveInsightDraft,
  unpublishInsight,
} from "@/lib/repositories/insightsRepository";
import {
  changeResourceSlug,
  getResourceByIdAdmin,
  publishResource,
  saveResourceDraft,
  unpublishResource,
} from "@/lib/repositories/resourcesRepository";
import {
  composeResourceSaveData,
  type ResourceColumnInput,
} from "@/lib/resources/canonical";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function bool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function optStr(fd: FormData, key: string) {
  const value = str(fd, key);
  return value || null;
}

function parseJsonArrayField(fd: FormData, key: string): unknown[] | undefined {
  const raw = str(fd, key);
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) {
      throw new Error(`${key} must be a JSON array.`);
    }
    return value;
  } catch (err) {
    if (err instanceof Error && err.message.includes("must be a JSON array")) throw err;
    throw new Error(`${key} must be valid JSON.`);
  }
}

function seoFromForm(fd: FormData) {
  return {
    seoTitle: optStr(fd, "seoTitle"),
    seoDescription: optStr(fd, "seoDescription"),
    ogTitle: optStr(fd, "ogTitle"),
    ogDescription: optStr(fd, "ogDescription"),
    ogImagePath: optStr(fd, "ogImagePath"),
    noIndex: bool(fd, "noIndex"),
    canonicalOverride: optStr(fd, "canonicalOverride"),
  };
}

export async function saveIndustryAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  const workIds = str(formData, "workIds")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await saveIndustry({
    id: id || undefined,
    actorId: actor.id,
    workIds,
    data: {
      name: str(formData, "name"),
      slug: str(formData, "slug"),
      description: str(formData, "description"),
      icon: str(formData, "icon") || "building",
      group: str(formData, "group") === "supported" ? "supported" : "proven",
      featured: bool(formData, "featured"),
      hasVerifiedProjectExperience: bool(formData, "hasVerifiedProjectExperience"),
      relatedServiceLinks: JSON.parse(str(formData, "relatedServiceLinks") || "[]"),
      relatedSolutionSlugs: JSON.parse(str(formData, "relatedSolutionSlugs") || "[]"),
      displayOrder: Number(formData.get("displayOrder") || 0),
      ...seoFromForm(formData),
    },
  });
  revalidatePath("/admin/industries");
}

export async function publishIndustryAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await publishIndustry({ id: str(formData, "id"), actorId: actor.id });
}

export async function unpublishIndustryAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await unpublishIndustry({ id: str(formData, "id"), actorId: actor.id });
}

export async function saveWorkAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  const existing = id ? await getWorkByIdAdmin(id) : null;
  const industryIds = existing?.industryLinks.map((link) => link.industryId) ?? [];
  const effective = existing
    ? effectiveWorkFields(existing, industryIds)
    : null;

  try {
    await saveWorkDraft({
      id: id || undefined,
      actorId: actor.id,
      industryIds: str(formData, "industryIds")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      data: workFieldsFromForm(formData, effective?.caseStudyContent ?? null),
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to save work draft");
  }

  redirect(id ? `/admin/work/${id}?saved=1` : "/admin/work?saved=1");
}

export async function publishWorkAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  const id = str(formData, "id");

  if (str(formData, "name")) {
    const existing = await getWorkByIdAdmin(id);
    const industryIds = existing?.industryLinks.map((link) => link.industryId) ?? [];
    const effective = existing
      ? effectiveWorkFields(existing, industryIds)
      : null;
    await saveWorkDraft({
      id,
      actorId: actor.id,
      industryIds: str(formData, "industryIds")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      data: workFieldsFromForm(formData, effective?.caseStudyContent ?? null),
    });
  }

  try {
    await publishWork({ id, actorId: actor.id });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to publish work");
  }

  redirect(`/admin/work/${id}?published=1`);
}

export async function discardWorkDraftAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  await discardWorkDraft({ id, actorId: actor.id });
  redirect(`/admin/work/${id}?discarded=1`);
}

export async function previewWorkAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("preview");
  const id = str(formData, "id");
  const token = await setPreviewCookie("WorkProject", id);
  redirect(`/admin/preview/work/${id}?preview=${encodeURIComponent(token)}`);
}

export async function unpublishWorkAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await unpublishWork({ id: str(formData, "id"), actorId: actor.id });
}

export async function changeWorkSlugAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("slug_redirect");
  await changeWorkSlug({
    id: str(formData, "id"),
    newSlug: str(formData, "newSlug"),
    actorId: actor.id,
  });
}

export async function saveTestimonialAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  const originalQuote = str(formData, "originalQuote") || str(formData, "quote");
  const quote = str(formData, "quote") || originalQuote;
  let themesJson: unknown = undefined;
  const themesRaw = str(formData, "themesJson");
  if (themesRaw) {
    try {
      themesJson = JSON.parse(themesRaw);
    } catch {
      throw new Error("Themes must be valid JSON.");
    }
  }
  await saveTestimonial({
    id: id || undefined,
    actorId: actor.id,
    data: {
      legacyId: str(formData, "legacyId"),
      quote,
      originalQuote: originalQuote || null,
      displayExcerpt: str(formData, "displayExcerpt") || null,
      name: str(formData, "name"),
      company: str(formData, "company"),
      role: str(formData, "role") || null,
      serviceLabel: str(formData, "serviceLabel") || null,
      workProjectId: str(formData, "workProjectId") || null,
      displayOrder: Number(formData.get("displayOrder") || 0),
      featured: bool(formData, "featured"),
      internalSource: str(formData, "internalSource") || null,
      internalVerificationNote:
        str(formData, "internalVerificationNote") || null,
      avatarPath: optStr(formData, "avatarPath"),
      ...(themesJson !== undefined
        ? { themesJson: themesJson as object }
        : {}),
    },
  });
  revalidatePath("/admin/testimonials");
  if (id) revalidatePath(`/admin/testimonials/${id}`);
}

export async function verifyTestimonialAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("verify_testimonial");
  await setTestimonialVerified({
    id: str(formData, "id"),
    verified: bool(formData, "verified"),
    note: str(formData, "note") || undefined,
    actorId: actor.id,
  });
}

export async function publishTestimonialAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await publishTestimonial({ id: str(formData, "id"), actorId: actor.id });
}

export async function unpublishTestimonialAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await unpublishTestimonial({ id: str(formData, "id"), actorId: actor.id });
}

export async function saveInsightAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  await saveInsightDraft({
    id: id || undefined,
    actorId: actor.id,
    data: {
      title: str(formData, "title"),
      slug: str(formData, "slug"),
      description: str(formData, "description"),
      bodyMarkdown: str(formData, "bodyMarkdown"),
      categoryLabel: str(formData, "categoryLabel"),
      author: str(formData, "author") || null,
      heroImagePath: str(formData, "heroImagePath") || null,
      heroImageAlt: str(formData, "heroImageAlt") || null,
      featured: bool(formData, "featured"),
      relatedServiceHrefs: str(formData, "relatedServiceHrefs")
        ? JSON.parse(str(formData, "relatedServiceHrefs"))
        : undefined,
      originalPublishedAt: new Date(str(formData, "originalPublishedAt")),
      ...seoFromForm(formData),
    },
  });
  revalidatePath("/admin/insights");
}

export async function publishInsightAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await publishInsight({ id: str(formData, "id"), actorId: actor.id });
}

export async function unpublishInsightAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await unpublishInsight({ id: str(formData, "id"), actorId: actor.id });
}

export async function changeInsightSlugAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("slug_redirect");
  await changeInsightSlug({
    id: str(formData, "id"),
    newSlug: str(formData, "newSlug"),
    actorId: actor.id,
  });
}

export async function saveResourceAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  const existing = id ? await getResourceByIdAdmin(id) : null;
  if (!existing) {
    throw new Error("Resource not found.");
  }

  let structuralPayload: unknown;
  try {
    structuralPayload = JSON.parse(str(formData, "payload"));
  } catch {
    throw new Error("Structured content must be valid JSON.");
  }

  const columns: ResourceColumnInput = {
    slug: str(formData, "slug"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    deck: optStr(formData, "deck"),
    author: optStr(formData, "author"),
    readingTime: optStr(formData, "readingTime"),
    heroImagePath: optStr(formData, "heroImagePath"),
    heroImageAlt: optStr(formData, "heroImageAlt"),
    relatedServiceHrefs: parseJsonArrayField(formData, "relatedServiceHrefs"),
    relatedSolutionSlugs: parseJsonArrayField(formData, "relatedSolutionSlugs"),
    relatedPlatformSlugs: parseJsonArrayField(formData, "relatedPlatformSlugs"),
    relatedInsightSlugs: parseJsonArrayField(formData, "relatedInsightSlugs"),
    relatedResourceIds: parseJsonArrayField(formData, "relatedResourceIds"),
    shortDefinition:
      existing.type === "glossary" ? optStr(formData, "shortDefinition") : undefined,
    aliases:
      existing.type === "glossary" && str(formData, "aliases")
        ? JSON.parse(str(formData, "aliases"))
        : undefined,
    featured: bool(formData, "featured"),
    featuredOnResources: bool(formData, "featuredOnResources"),
    featuredOrder: Number(formData.get("featuredOrder") || 0),
    ...seoFromForm(formData),
  };

  await saveResourceDraft({
    id,
    actorId: actor.id,
    data: composeResourceSaveData({
      type: existing.type,
      columns,
      structuralPayload,
      existing,
    }),
  });
  revalidatePath("/admin/resources");
}

export async function publishResourceAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await publishResource({ id: str(formData, "id"), actorId: actor.id });
}

export async function unpublishResourceAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await unpublishResource({ id: str(formData, "id"), actorId: actor.id });
}

export async function changeResourceSlugAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("slug_redirect");
  await changeResourceSlug({
    id: str(formData, "id"),
    newSlug: str(formData, "newSlug"),
    actorId: actor.id,
  });
}
