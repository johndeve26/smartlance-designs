"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import {
  publishInsight,
  saveInsightDraft,
  unpublishInsight,
} from "@/lib/repositories/insightsRepository";
import {
  publishResource,
  saveResourceDraft,
  unpublishResource,
} from "@/lib/repositories/resourcesRepository";
import {
  publishService,
  unpublishService,
} from "@/lib/repositories/servicesRepository";
import {
  publishSolution,
  saveSolutionDraft,
  unpublishSolution,
} from "@/lib/repositories/solutionsRepository";
import {
  publishPlatform,
  savePlatformDraft,
  unpublishPlatform,
} from "@/lib/repositories/platformsRepository";
import {
  publishIndustry,
  saveIndustry,
  unpublishIndustry,
} from "@/lib/repositories/industriesRepository";
import {
  publishWork,
  saveWorkDraft,
  unpublishWork,
} from "@/lib/repositories/workRepository";
import {
  publishTestimonial,
  saveTestimonial,
  unpublishTestimonial,
} from "@/lib/repositories/testimonialsRepository";
import type { ResourceKind } from "@prisma/client";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export type ContentFamily =
  | "insight"
  | "resource"
  | "service"
  | "solution"
  | "platform"
  | "industry"
  | "work"
  | "testimonial";

const MAX_BULK = 50;

const LIST_PATH: Record<ContentFamily, string> = {
  insight: "/admin/insights",
  resource: "/admin/resources",
  service: "/admin/services",
  solution: "/admin/solutions",
  platform: "/admin/platforms",
  industry: "/admin/industries",
  work: "/admin/work",
  testimonial: "/admin/testimonials",
};

function uniqueIds(ids: string[]) {
  return [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))];
}

function slugStamp(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

async function publishOne(family: ContentFamily, id: string, actorId: string) {
  switch (family) {
    case "insight":
      return publishInsight({ id, actorId });
    case "resource":
      return publishResource({ id, actorId });
    case "service":
      return publishService({ id, actorId });
    case "solution":
      return publishSolution({ id, actorId });
    case "platform":
      return publishPlatform({ id, actorId });
    case "industry":
      return publishIndustry({ id, actorId });
    case "work":
      return publishWork({ id, actorId });
    case "testimonial":
      return publishTestimonial({ id, actorId });
    default:
      throw new Error("Unknown family");
  }
}

async function archiveOne(family: ContentFamily, id: string, actorId: string) {
  switch (family) {
    case "insight":
      return unpublishInsight({ id, actorId });
    case "resource":
      return unpublishResource({ id, actorId });
    case "service":
      return unpublishService({ id, actorId });
    case "solution":
      return unpublishSolution({ id, actorId });
    case "platform":
      return unpublishPlatform({ id, actorId });
    case "industry":
      return unpublishIndustry({ id, actorId });
    case "work":
      return unpublishWork({ id, actorId });
    case "testimonial":
      return unpublishTestimonial({ id, actorId });
    default:
      throw new Error("Unknown family");
  }
}

export async function bulkContentStatusAction(input: {
  family: ContentFamily;
  action: "publish" | "archive";
  ids: string[];
}): Promise<{ ok: boolean; message: string }> {
  await assertSameOrigin();
  const user = await requireAdminUser("publish");
  if (!can(user.role, "publish")) {
    return { ok: false, message: "Publish permission required." };
  }

  const ids = uniqueIds(input.ids).slice(0, MAX_BULK);
  if (!ids.length) {
    return { ok: false, message: "No rows selected." };
  }

  let okCount = 0;
  const errors: string[] = [];
  for (const id of ids) {
    try {
      if (input.action === "publish") {
        await publishOne(input.family, id, user.id);
      } else {
        await archiveOne(input.family, id, user.id);
      }
      okCount += 1;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Failed");
    }
  }

  await writeAuditLog({
    actorId: user.id,
    action:
      input.action === "publish"
        ? "content.bulk_publish"
        : "content.bulk_archive",
    entityType: input.family,
    entityId: null,
    metadata: {
      requested: ids.length,
      succeeded: okCount,
      failed: ids.length - okCount,
    },
  });

  revalidatePath(LIST_PATH[input.family]);
  if (input.family === "resource") {
    revalidatePath("/admin/resources");
  }

  if (okCount === 0) {
    return {
      ok: false,
      message: errors[0] || "No records updated.",
    };
  }

  const verb = input.action === "publish" ? "Published" : "Archived";
  const extra =
    errors.length > 0 ? ` ${errors.length} failed (${errors[0]}).` : "";
  return {
    ok: true,
    message: `${verb} ${okCount} of ${ids.length}.${extra}`,
  };
}

export async function createInsightDraftAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("edit_draft");
  const slug = slugStamp("untitled-insight");
  const row = await saveInsightDraft({
    actorId: user.id,
    data: {
      title: "Untitled insight",
      slug,
      description: "Draft description — update before publishing.",
      bodyMarkdown: "## Draft\n\nReplace this body before publishing.",
      categoryLabel: "Website Design",
      originalPublishedAt: new Date(),
    },
  });
  revalidatePath("/admin/insights");
  redirect(`/admin/insights/${row.id}`);
}

export async function createResourceDraftAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("edit_draft");
  const typeParam = String(formData.get("type") || "").trim();
  const TYPE_MAP: Record<string, ResourceKind> = {
    guides: "guide",
    comparisons: "comparison",
    checklists: "checklist",
    glossary: "glossary",
    templates: "template",
    tools: "tool",
  };
  const kind = TYPE_MAP[typeParam];
  if (!kind) throw new Error("Invalid resource type.");

  const slug = slugStamp(`untitled-${kind}`);
  const hrefMap: Record<ResourceKind, string> = {
    guide: `/guides/${slug}`,
    comparison: `/compare/${slug}`,
    checklist: `/checklists/${slug}`,
    glossary: `/glossary/${slug}`,
    template: `/templates/${slug}`,
    tool: `/tools/${slug}`,
  };

  const row = await saveResourceDraft({
    actorId: user.id,
    data: {
      type: kind,
      title: `Untitled ${kind}`,
      slug,
      description: "Draft resource — update before publishing.",
      href: hrefMap[kind],
      payload: { title: `Untitled ${kind}`, slug },
    },
  });
  revalidatePath("/admin/resources");
  revalidatePath(`/admin/resources/${typeParam}`);
  redirect(`/admin/resources/${typeParam}/${row.id}`);
}

export async function createWorkDraftAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("edit_draft");
  const slug = slugStamp("untitled-project");
  const row = await saveWorkDraft({
    actorId: user.id,
    industryIds: [],
    data: {
      name: "Untitled project",
      slug,
      industryLabel: "General",
      challenge: "Describe the challenge.",
      solution: "Describe the solution.",
      servicesLabels: [],
      coverImagePath: null,
    },
  });
  revalidatePath("/admin/work");
  redirect(`/admin/work/${row.id}`);
}

export async function createTestimonialDraftAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("edit_draft");
  const row = await saveTestimonial({
    actorId: user.id,
    data: {
      name: "New testimonial",
      company: "Company",
      quote: "Add the quote here.",
      legacyId: slugStamp("t"),
      status: "DRAFT",
      verified: false,
    },
  });
  revalidatePath("/admin/testimonials");
  redirect(`/admin/testimonials/${row.id}`);
}

export async function createIndustryDraftAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("edit_draft");
  const slug = slugStamp("untitled-industry");
  const row = await saveIndustry({
    actorId: user.id,
    workIds: [],
    data: {
      name: "Untitled industry",
      slug,
      description: "Draft industry description.",
      icon: "building",
      group: "supported",
      featured: false,
      hasVerifiedProjectExperience: false,
      relatedServiceLinks: [],
      displayOrder: 999,
      status: "DRAFT",
    },
  });
  revalidatePath("/admin/industries");
  redirect(`/admin/industries/${row.id}`);
}

export async function createSolutionDraftAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("edit_draft");
  const slug = slugStamp("untitled-solution");
  const row = await saveSolutionDraft({
    actorId: user.id,
    data: {
      name: "Untitled solution",
      slug,
      title: "Untitled solution",
      shortDescription: "Draft solution summary.",
      category: "growth",
      icon: "spark",
      displayOrder: 999,
      relatedServiceHrefs: [],
      pageContent: {},
    },
  });
  revalidatePath("/admin/solutions");
  redirect(`/admin/solutions/${row.id}`);
}

export async function createPlatformDraftAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("edit_draft");
  const slug = slugStamp("untitled-platform");
  const row = await savePlatformDraft({
    actorId: user.id,
    data: {
      name: "Untitled platform",
      slug,
      href: `/platforms/${slug}`,
      title: "Untitled platform",
      summary: "Draft platform summary.",
      description: "Draft platform description.",
      icon: "layers",
      group: "core",
      platformMatch: "general",
      displayOrder: 999,
      audiences: [],
      capabilities: [],
      relatedServiceHrefs: [],
      seoTitle: "Untitled platform",
      seoDescription: "Draft platform SEO description.",
    },
  });
  revalidatePath("/admin/platforms");
  redirect(`/admin/platforms/${row.id}`);
}

/** Thin wrappers used by client tables */
export async function bulkPublishAction(family: ContentFamily, ids: string[]) {
  return bulkContentStatusAction({ family, action: "publish", ids });
}

export async function bulkArchiveAction(family: ContentFamily, ids: string[]) {
  return bulkContentStatusAction({ family, action: "archive", ids });
}
