"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import {
  publishIndustry,
  saveIndustry,
  unpublishIndustry,
} from "@/lib/repositories/industriesRepository";
import {
  changeWorkSlug,
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
  publishResource,
  saveResourceDraft,
  unpublishResource,
} from "@/lib/repositories/resourcesRepository";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function bool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
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
      seoTitle: str(formData, "seoTitle") || null,
      seoDescription: str(formData, "seoDescription") || null,
      ogTitle: str(formData, "ogTitle") || null,
      ogDescription: str(formData, "ogDescription") || null,
      ogImagePath: str(formData, "ogImagePath") || null,
      noIndex: bool(formData, "noIndex"),
      canonicalOverride: str(formData, "canonicalOverride") || null,
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
  let approvedProjectFacts: unknown = undefined;
  const factsRaw = str(formData, "approvedProjectFacts");
  if (factsRaw) {
    try {
      approvedProjectFacts = JSON.parse(factsRaw);
    } catch {
      throw new Error("Approved project facts must be valid JSON.");
    }
  }
  await saveWorkDraft({
    id: id || undefined,
    actorId: actor.id,
    industryIds: str(formData, "industryIds")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    data: {
      name: str(formData, "name"),
      slug: str(formData, "slug"),
      industryLabel: str(formData, "industryLabel"),
      challenge: str(formData, "challenge"),
      solution: str(formData, "solution"),
      shortDescription: str(formData, "shortDescription") || null,
      resultSummary: str(formData, "resultSummary") || null,
      results: str(formData, "results")
        ? JSON.parse(str(formData, "results"))
        : undefined,
      servicesLabels: JSON.parse(str(formData, "servicesLabels") || "[]"),
      coverImagePath: str(formData, "coverImagePath") || null,
      heroImagePath: str(formData, "heroImagePath") || null,
      featured: bool(formData, "featured"),
      featuredHomepage: bool(formData, "featuredHomepage"),
      featuredWorkArchive: bool(formData, "featuredWorkArchive"),
      seoTitle: str(formData, "seoTitle"),
      seoDescription: str(formData, "seoDescription"),
      relatedServiceHrefs: str(formData, "relatedServiceHrefs")
        ? JSON.parse(str(formData, "relatedServiceHrefs"))
        : undefined,
      approvedForAI: bool(formData, "approvedForAI"),
      approvedProjectFacts:
        approvedProjectFacts === undefined
          ? undefined
          : (approvedProjectFacts as object),
    },
  });
  revalidatePath("/admin/work");
  if (id) revalidatePath(`/admin/work/${id}`);
}

export async function publishWorkAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  await publishWork({ id: str(formData, "id"), actorId: actor.id });
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
      seoTitle: str(formData, "seoTitle") || null,
      seoDescription: str(formData, "seoDescription") || null,
      relatedServiceHrefs: str(formData, "relatedServiceHrefs")
        ? JSON.parse(str(formData, "relatedServiceHrefs"))
        : undefined,
      originalPublishedAt: new Date(str(formData, "originalPublishedAt")),
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
  const payload = JSON.parse(str(formData, "payload"));
  await saveResourceDraft({
    id: id || undefined,
    actorId: actor.id,
    data: {
      title: str(formData, "title"),
      slug: str(formData, "slug"),
      description: str(formData, "description"),
      deck: str(formData, "deck") || null,
      payload,
      featured: bool(formData, "featured"),
      featuredOnResources: bool(formData, "featuredOnResources"),
      seoTitle: str(formData, "seoTitle") || null,
      seoDescription: str(formData, "seoDescription") || null,
      shortDefinition: str(formData, "shortDefinition") || null,
      aliases: str(formData, "aliases")
        ? JSON.parse(str(formData, "aliases"))
        : undefined,
    },
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
