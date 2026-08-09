"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import {
  ADMIN_PREVIEW_COOKIE,
  createPreviewToken,
} from "@/lib/admin/crypto";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import {
  discardHomepageDraft,
  publishHomepage,
  saveHomepageDraft,
} from "@/lib/repositories/homepageRepository";
import {
  changeServiceSlug,
  publishService,
  saveServiceDraft,
  unpublishService,
} from "@/lib/repositories/servicesRepository";
import {
  changeSolutionSlug,
  publishSolution,
  saveSolutionDraft,
  unpublishSolution,
} from "@/lib/repositories/solutionsRepository";
import {
  changePlatformSlug,
  publishPlatform,
  savePlatformDraft,
  unpublishPlatform,
} from "@/lib/repositories/platformsRepository";

export type ContentActionState = {
  error?: string;
  success?: string;
};

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v || null;
}

function bool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function int(fd: FormData, key: string, fallback = 0) {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseJsonField(
  fd: FormData,
  key: string,
  fallback?: Prisma.InputJsonValue,
): Prisma.InputJsonValue | undefined {
  const raw = str(fd, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    throw new Error(`Invalid JSON in field "${key}"`);
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

export async function setPreviewCookie(entityType: string, entityId: string) {
  const token = createPreviewToken(entityType, entityId);
  const jar = await cookies();
  jar.set(ADMIN_PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return token;
}

/* ─── Homepage ─────────────────────────────────────────────────────────── */

function homepageFieldsFromForm(formData: FormData) {
  return {
    heroEyebrow: str(formData, "heroEyebrow"),
    heroHeadline: str(formData, "heroHeadline"),
    heroHeadlineAccent: optStr(formData, "heroHeadlineAccent"),
    heroSupporting: str(formData, "heroSupporting"),
    primaryCtaLabel: str(formData, "primaryCtaLabel") || "Contact",
    primaryCtaHref: str(formData, "primaryCtaHref") || "/contact",
    secondaryCtaLabel: str(formData, "secondaryCtaLabel") || "Work",
    secondaryCtaHref: str(formData, "secondaryCtaHref") || "/work",
    sections: parseJsonField(formData, "sections", {}),
    sectionVisibility: parseJsonField(formData, "sectionVisibility", {}),
    curatedServiceItems: parseJsonField(formData, "curatedServiceItems", []),
    curatedTestimonialIds: parseJsonField(
      formData,
      "curatedTestimonialIds",
      [],
    ),
    metaTitle: optStr(formData, "metaTitle"),
    metaDescription: optStr(formData, "metaDescription"),
    ...seoFromForm(formData),
  };
}

export async function saveHomepageAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");

  try {
    await saveHomepageDraft({
      actorId: actor.id,
      data: homepageFieldsFromForm(formData),
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to save homepage draft",
    );
  }

  redirect("/admin/homepage?saved=1");
}

export async function publishHomepageAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");

  // Persist latest form as draft first when fields are present
  if (str(formData, "heroHeadline")) {
    await saveHomepageDraft({
      actorId: actor.id,
      data: homepageFieldsFromForm(formData),
    });
  }

  try {
    await publishHomepage({ actorId: actor.id });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to publish homepage",
    );
  }

  redirect("/admin/homepage?published=1");
}

export async function discardHomepageDraftAction(_formData: FormData) {
  void _formData;
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  await discardHomepageDraft({ actorId: actor.id });
  redirect("/admin/homepage?discarded=1");
}

export async function previewHomepageAction(_formData: FormData) {
  void _formData;
  await assertSameOrigin();
  await requireAdminUser("preview");
  const token = await setPreviewCookie("HomepageContent", "home");
  redirect(
    `/admin/preview/homepage/home?preview=${encodeURIComponent(token)}`,
  );
}

/* ─── Services ─────────────────────────────────────────────────────────── */

function serviceFieldsFromForm(fd: FormData) {
  const slug = str(fd, "slug");
  return {
    slug,
    href: str(fd, "href") || `/services/${slug}`,
    title: str(fd, "title"),
    shortTitle: optStr(fd, "shortTitle"),
    category: str(fd, "category") || "core",
    group: str(fd, "group") || "websites",
    icon: str(fd, "icon") || "layers",
    summary: str(fd, "summary"),
    description: str(fd, "description"),
    tagline: optStr(fd, "tagline"),
    narrativeTitle: optStr(fd, "narrativeTitle"),
    narrative: optStr(fd, "narrative"),
    seoConnection: optStr(fd, "seoConnection"),
    audience: optStr(fd, "audience"),
    platformsNote: optStr(fd, "platformsNote"),
    visualVariant: optStr(fd, "visualVariant"),
    featured: bool(fd, "featured"),
    navigationFeatured: bool(fd, "navigationFeatured"),
    displayOrder: int(fd, "displayOrder"),
    capabilities: parseJsonField(fd, "capabilities"),
    idealFor: parseJsonField(fd, "idealFor"),
    problems: parseJsonField(fd, "problems"),
    deliverables: parseJsonField(fd, "deliverables"),
    process: parseJsonField(fd, "process"),
    evaluationItems: parseJsonField(fd, "evaluationItems"),
    faqs: parseJsonField(fd, "faqs"),
    relatedProjectSlugs: parseJsonField(fd, "relatedProjectSlugs"),
    relatedServiceSlugs: parseJsonField(fd, "relatedServiceSlugs"),
    relatedSeoSlugs: parseJsonField(fd, "relatedSeoSlugs"),
    relatedPlatformSlugs: parseJsonField(fd, "relatedPlatformSlugs"),
    relatedSolutionSlugs: parseJsonField(fd, "relatedSolutionSlugs"),
    ctaTitle: optStr(fd, "ctaTitle"),
    ctaDescription: optStr(fd, "ctaDescription"),
    primaryCtaLabel: optStr(fd, "primaryCtaLabel"),
    primaryCtaHref: optStr(fd, "primaryCtaHref"),
    secondaryCtaLabel: optStr(fd, "secondaryCtaLabel"),
    secondaryCtaHref: optStr(fd, "secondaryCtaHref"),
    seoTitle: str(fd, "seoTitle") || str(fd, "title"),
    seoDescription: str(fd, "seoDescription") || str(fd, "summary"),
    ogTitle: optStr(fd, "ogTitle"),
    ogDescription: optStr(fd, "ogDescription"),
    ogImagePath: optStr(fd, "ogImagePath"),
    noIndex: bool(fd, "noIndex"),
    canonicalOverride: optStr(fd, "canonicalOverride"),
  };
}

export async function saveServiceDraftAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = optStr(formData, "id") ?? undefined;

  let row;
  try {
    const data = serviceFieldsFromForm(formData);
    if (!data.title || !data.slug || !data.summary || !data.description) {
      throw new Error("Title, slug, summary, and description are required.");
    }
    row = await saveServiceDraft({
      id,
      data,
      actorId: actor.id,
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to save service",
    );
  }

  redirect(
    id
      ? `/admin/services/${row.id}?saved=1`
      : `/admin/services/${row.id}?saved=1&aiAction=improve`,
  );
}

export async function publishServiceAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing service id");

  // Persist latest form values as draft first when fields are present
  if (str(formData, "title")) {
    await saveServiceDraft({
      id,
      data: serviceFieldsFromForm(formData),
      actorId: actor.id,
    });
  }

  await publishService({ id, actorId: actor.id });
  redirect(`/admin/services/${id}?published=1`);
}

export async function unpublishServiceAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing service id");
  await unpublishService({ id, actorId: actor.id });
  redirect(`/admin/services/${id}?unpublished=1`);
}

export async function changeServiceSlugAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("slug_redirect");
  const id = str(formData, "id");
  const newSlug = str(formData, "newSlug");
  if (!id || !newSlug) throw new Error("Missing slug fields");
  await changeServiceSlug({ id, newSlug, actorId: actor.id });
  redirect(`/admin/services/${id}?slug=1`);
}

export async function previewServiceAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("preview");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing service id");
  const token = await setPreviewCookie("Service", id);
  redirect(`/admin/preview/service/${id}?preview=${encodeURIComponent(token)}`);
}

/* ─── Solutions ────────────────────────────────────────────────────────── */

function solutionFieldsFromForm(fd: FormData) {
  return {
    name: str(fd, "name"),
    title: str(fd, "title"),
    shortDescription: str(fd, "shortDescription"),
    category: str(fd, "category") || "growth",
    icon: str(fd, "icon") || "layers",
    featured: bool(fd, "featured"),
    displayOrder: int(fd, "displayOrder"),
    eyebrow: optStr(fd, "eyebrow"),
    heroStatement: optStr(fd, "heroStatement"),
    heroSupporting: optStr(fd, "heroSupporting"),
    problemSymptoms: parseJsonField(fd, "problemSymptoms"),
    possibleCauses: parseJsonField(fd, "possibleCauses"),
    whatWeReview: parseJsonField(fd, "whatWeReview"),
    process: parseJsonField(fd, "process"),
    measurementPoints: parseJsonField(fd, "measurementPoints"),
    relatedServiceHrefs: parseJsonField(fd, "relatedServiceHrefs", []),
    relatedPlatformSlugs: parseJsonField(fd, "relatedPlatformSlugs"),
    relatedIndustrySlugs: parseJsonField(fd, "relatedIndustrySlugs"),
    relatedProjectSlugs: parseJsonField(fd, "relatedProjectSlugs"),
    relatedArticleSlugs: parseJsonField(fd, "relatedArticleSlugs"),
    relatedServiceReasons: parseJsonField(fd, "relatedServiceReasons"),
    relatedSolutions: parseJsonField(fd, "relatedSolutions"),
    faqs: parseJsonField(fd, "faqs"),
    pageKind: optStr(fd, "pageKind"),
    pageContent: parseJsonField(fd, "pageContent"),
    ctaTitle: optStr(fd, "ctaTitle"),
    ctaDescription: optStr(fd, "ctaDescription"),
    primaryCtaLabel: optStr(fd, "primaryCtaLabel"),
    primaryCtaHref: optStr(fd, "primaryCtaHref"),
    secondaryCtaLabel: optStr(fd, "secondaryCtaLabel"),
    secondaryCtaHref: optStr(fd, "secondaryCtaHref"),
    ...seoFromForm(fd),
  };
}

export async function saveSolutionDraftAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing solution id");

  try {
    await saveSolutionDraft({
      id,
      data: solutionFieldsFromForm(formData),
      actorId: actor.id,
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to save solution",
    );
  }

  redirect(`/admin/solutions/${id}?saved=1`);
}

export async function publishSolutionAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing solution id");
  if (str(formData, "title")) {
    await saveSolutionDraft({
      id,
      data: solutionFieldsFromForm(formData),
      actorId: actor.id,
    });
  }
  await publishSolution({ id, actorId: actor.id });
  redirect(`/admin/solutions/${id}?published=1`);
}

export async function unpublishSolutionAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing solution id");
  await unpublishSolution({ id, actorId: actor.id });
  redirect(`/admin/solutions/${id}?unpublished=1`);
}

export async function changeSolutionSlugAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("slug_redirect");
  const id = str(formData, "id");
  const newSlug = str(formData, "newSlug");
  if (!id || !newSlug) throw new Error("Missing slug fields");
  await changeSolutionSlug({ id, newSlug, actorId: actor.id });
  redirect(`/admin/solutions/${id}?slug=1`);
}

export async function previewSolutionAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("preview");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing solution id");
  const token = await setPreviewCookie("Solution", id);
  redirect(
    `/admin/preview/solution/${id}?preview=${encodeURIComponent(token)}`,
  );
}

/* ─── Platforms ────────────────────────────────────────────────────────── */

function platformFieldsFromForm(fd: FormData) {
  const slug = str(fd, "slug");
  return {
    slug,
    href: str(fd, "href") || `/platforms/${slug}`,
    name: str(fd, "name"),
    title: str(fd, "title"),
    summary: str(fd, "summary"),
    description: str(fd, "description"),
    tagline: optStr(fd, "tagline"),
    icon: str(fd, "icon") || "layers",
    group: str(fd, "group") || "primary",
    prominence: optStr(fd, "prominence"),
    featured: bool(fd, "featured"),
    navigationFeatured: bool(fd, "navigationFeatured"),
    verifiedExperience: bool(fd, "verifiedExperience"),
    platformMatch: str(fd, "platformMatch") || "",
    displayOrder: int(fd, "displayOrder"),
    audiences: parseJsonField(fd, "audiences", []),
    whenItFits: parseJsonField(fd, "whenItFits"),
    capabilities: parseJsonField(fd, "capabilities", []),
    challenges: parseJsonField(fd, "challenges"),
    seoSection: parseJsonField(fd, "seoSection"),
    relatedServiceHrefs: parseJsonField(fd, "relatedServiceHrefs", []),
    relatedSeoHrefs: parseJsonField(fd, "relatedSeoHrefs"),
    faqs: parseJsonField(fd, "faqs"),
    legacyUrl: optStr(fd, "legacyUrl"),
    conversionNote: optStr(fd, "conversionNote"),
    migrationNote: optStr(fd, "migrationNote"),
    ctaTitle: optStr(fd, "ctaTitle"),
    ctaDescription: optStr(fd, "ctaDescription"),
    seoTitle: str(fd, "seoTitle") || str(fd, "title"),
    seoDescription: str(fd, "seoDescription") || str(fd, "summary"),
    ogTitle: optStr(fd, "ogTitle"),
    ogDescription: optStr(fd, "ogDescription"),
    ogImagePath: optStr(fd, "ogImagePath"),
    noIndex: bool(fd, "noIndex"),
    canonicalOverride: optStr(fd, "canonicalOverride"),
  };
}

export async function savePlatformDraftAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("edit_draft");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing platform id");

  try {
    await savePlatformDraft({
      id,
      data: platformFieldsFromForm(formData),
      actorId: actor.id,
    });
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Failed to save platform",
    );
  }

  redirect(`/admin/platforms/${id}?saved=1`);
}

export async function publishPlatformAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing platform id");
  if (str(formData, "title")) {
    await savePlatformDraft({
      id,
      data: platformFieldsFromForm(formData),
      actorId: actor.id,
    });
  }
  await publishPlatform({ id, actorId: actor.id });
  redirect(`/admin/platforms/${id}?published=1`);
}

export async function unpublishPlatformAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("publish");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing platform id");
  await unpublishPlatform({ id, actorId: actor.id });
  redirect(`/admin/platforms/${id}?unpublished=1`);
}

export async function changePlatformSlugAction(formData: FormData) {
  await assertSameOrigin();
  const actor = await requireAdminUser("slug_redirect");
  const id = str(formData, "id");
  const newSlug = str(formData, "newSlug");
  if (!id || !newSlug) throw new Error("Missing slug fields");
  await changePlatformSlug({ id, newSlug, actorId: actor.id });
  redirect(`/admin/platforms/${id}?slug=1`);
}

export async function previewPlatformAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("preview");
  const id = str(formData, "id");
  if (!id) throw new Error("Missing platform id");
  const token = await setPreviewCookie("Platform", id);
  redirect(
    `/admin/preview/platform/${id}?preview=${encodeURIComponent(token)}`,
  );
}
