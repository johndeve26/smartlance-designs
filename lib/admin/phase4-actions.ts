"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan, can } from "@/lib/admin/rbac";
import {
  archiveMediaAsset,
  permanentlyDeleteMediaAsset,
  updateMediaMetadata,
  uploadMediaAsset,
} from "@/lib/repositories/mediaRepository";
import {
  publishNavigationMenu,
  saveNavigationDraft,
  type NavDraftItem,
} from "@/lib/repositories/navigationRepository";
import {
  createManualRedirect,
  permanentlyDeleteRedirect,
  resolveRedirectChain,
  updateRedirect,
} from "@/lib/repositories/redirectsRepository";
import {
  updateSiteSettings,
  type SiteSettingsUpdateInput,
} from "@/lib/repositories/siteSettingsRepository";
import { updateManagedPage } from "@/lib/repositories/managedPagesRepository";
import { runLinkHealthCheck } from "@/lib/ops/link-health";
import type { NavigationMenuKey, RedirectType } from "@prisma/client";
import { isMediaStorageConfigured } from "@/lib/media/storage";

export async function uploadMediaAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_media");
  if (!isMediaStorageConfigured()) {
    return {
      ok: false as const,
      error:
        "Media storage is not configured. Set MEDIA_STORAGE_PROVIDER and related env vars.",
    };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: "Choose an image file to upload." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const row = await uploadMediaAsset({
      buffer,
      originalFilename: file.name,
      reportedMime: file.type,
      altText: String(formData.get("altText") || "") || null,
      title: String(formData.get("title") || "") || null,
      caption: String(formData.get("caption") || "") || null,
      actorId: user.id,
    });
    revalidatePath("/admin/media");
    return { ok: true as const, id: row.id, publicUrl: row.publicUrl };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

export async function updateMediaMetadataAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_media");
  const id = String(formData.get("id") || "");
  try {
    await updateMediaMetadata({
      id,
      altText: String(formData.get("altText") ?? ""),
      caption: String(formData.get("caption") || "") || null,
      title: String(formData.get("title") || "") || null,
      actorId: user.id,
    });
    revalidatePath("/admin/media");
    revalidatePath(`/admin/media/${id}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function archiveMediaAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_media");
  const id = String(formData.get("id") || "");
  await archiveMediaAsset({ id, actorId: user.id });
  revalidatePath("/admin/media");
  return { ok: true as const };
}

export async function deleteMediaAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser();
  assertCan(user.role, "media_permanent_delete");
  const id = String(formData.get("id") || "");
  const force = String(formData.get("force") || "") === "1";
  try {
    await permanentlyDeleteMediaAsset({ id, actorId: user.id, force });
    revalidatePath("/admin/media");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function saveNavigationAction(input: {
  menuKey: NavigationMenuKey;
  itemsJson: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_navigation");
  let items: NavDraftItem[];
  try {
    items = JSON.parse(input.itemsJson) as NavDraftItem[];
  } catch {
    return { ok: false as const, error: "Invalid navigation JSON." };
  }
  try {
    await saveNavigationDraft({
      menuKey: input.menuKey,
      items,
      actorId: user.id,
    });
    revalidatePath("/admin/navigation");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function publishNavigationAction(menuKey: NavigationMenuKey) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_navigation");
  if (!can(user.role, "publish") && user.role !== "CONTENT_MANAGER") {
    // Content managers can save drafts; publishing structural nav prefers publish capability
    if (user.role !== "SUPER_ADMIN" && user.role !== "EDITOR") {
      return { ok: false as const, error: "Publishing navigation requires Editor or Super Admin." };
    }
  }
  try {
    const result = await publishNavigationMenu({
      menuKey,
      actorId: user.id,
    });
    revalidatePath("/admin/navigation");
    return {
      ok: true as const,
      warnings: result.issues.filter((i) => i.severity === "warning"),
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Publish failed",
    };
  }
}

export async function createRedirectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_redirects");
  try {
    const result = await createManualRedirect({
      sourcePath: String(formData.get("sourcePath") || ""),
      destination: String(formData.get("destination") || ""),
      type: (String(formData.get("type") || "PERMANENT_301") as RedirectType),
      reason: String(formData.get("reason") || "") || undefined,
      actorId: user.id,
    });
    revalidatePath("/admin/redirects");
    return { ok: true as const, warning: result.warning };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

export async function disableRedirectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_redirects");
  const id = String(formData.get("id") || "");
  await updateRedirect({ id, status: "DISABLED", actorId: user.id });
  revalidatePath("/admin/redirects");
  return { ok: true as const };
}

export async function deleteRedirectAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser();
  assertCan(user.role, "settings_critical");
  const id = String(formData.get("id") || "");
  try {
    await permanentlyDeleteRedirect({ id, actorId: user.id });
    revalidatePath("/admin/redirects");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function testRedirectAction(path: string) {
  await assertSameOrigin();
  await requireAdminUser("manage_redirects");
  return resolveRedirectChain(path);
}

export async function saveSettingsAction(data: SiteSettingsUpdateInput) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  try {
    await updateSiteSettings({
      data,
      actorId: user.id,
      isSuperAdmin: can(user.role, "settings_critical"),
    });
    revalidatePath("/admin/settings");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function saveManagedPageAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_seo");
  const key = String(formData.get("key") || "");
  const noIndex = String(formData.get("noIndex") || "") === "1";
  if (noIndex && !can(user.role, "settings_critical")) {
    return {
      ok: false as const,
      error: "Only Super Admin can set noindex on managed pages.",
    };
  }
  try {
    await updateManagedPage({
      key,
      actorId: user.id,
      data: {
        seoTitle: String(formData.get("seoTitle") || "") || null,
        seoDescription: String(formData.get("seoDescription") || "") || null,
        ogImagePath: String(formData.get("ogImagePath") || "") || null,
        noIndex,
        canonicalOverride:
          String(formData.get("canonicalOverride") || "") || null,
      },
    });
    revalidatePath("/admin/seo");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function runLinkHealthAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("run_link_health");
  const run = await runLinkHealthCheck({ actorId: user.id });
  revalidatePath("/admin/link-health");
  return { ok: true as const, id: run.id, summary: run.summary };
}
