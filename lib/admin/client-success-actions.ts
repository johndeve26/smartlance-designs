"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/admin/session";
import { requireAdminUser } from "@/lib/admin/session";
import { z } from "zod";
import { createManagedWebsite, createCareEvent } from "@/lib/client-success/websites";
import { grantWebsiteAccess, revokeWebsiteAccess } from "@/lib/client-success/website-access";
import {
  addSmartlanceSupportMessage,
  markSupportWaitingOnClient,
  resolveSupportRequest,
  linkSupportToChangeRequest,
} from "@/lib/client-success/support";
import { prisma } from "@/lib/db";

export async function adminCreateManagedWebsiteAction(formData: FormData) {
  await assertSameOrigin();
  const admin = await requireAdminUser("manage_websites");

  const parsed = z
    .object({
      name: z.string().trim().min(2).max(200),
      domain: z.string().trim().min(3).max(253),
      productionUrl: z.string().trim().optional(),
      companyId: z.string().cuid().optional(),
      primaryProjectId: z.string().cuid().optional(),
      platform: z
        .enum(["WORDPRESS", "SHOPIFY", "WEBFLOW", "FRAMER", "CUSTOM", "OTHER"])
        .optional(),
      careStatus: z.enum(["NOT_ENROLLED", "ACTIVE", "PAUSED", "ENDED"]).optional(),
      carePlanName: z.string().trim().optional(),
      primaryContactId: z.string().cuid().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      domain: formData.get("domain"),
      productionUrl: formData.get("productionUrl") || undefined,
      companyId: formData.get("companyId") || undefined,
      primaryProjectId: formData.get("primaryProjectId") || undefined,
      platform: formData.get("platform") || undefined,
      careStatus: formData.get("careStatus") || undefined,
      carePlanName: formData.get("carePlanName") || undefined,
      primaryContactId: formData.get("primaryContactId") || undefined,
    });

  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  try {
    const website = await createManagedWebsite({
      ...parsed.data,
      createdById: admin.id,
    });
    revalidatePath("/admin/agency/websites");
    return { ok: true as const, id: website.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create website.",
    };
  }
}

export async function adminCreateCareEventAction(formData: FormData) {
  await assertSameOrigin();
  const admin = await requireAdminUser("manage_websites");

  const parsed = z
    .object({
      websiteId: z.string().cuid(),
      type: z.enum([
        "MAINTENANCE",
        "UPDATE",
        "BACKUP",
        "SECURITY",
        "PERFORMANCE",
        "CONTENT",
        "DEPLOYMENT",
        "DOMAIN",
        "SSL",
        "OTHER",
      ]),
      title: z.string().trim().min(2).max(200),
      clientSummary: z.string().trim().optional(),
      internalNotes: z.string().trim().optional(),
      status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NEEDS_ATTENTION"]).optional(),
      clientVisible: z.enum(["true", "false"]).optional(),
    })
    .safeParse({
      websiteId: formData.get("websiteId"),
      type: formData.get("type"),
      title: formData.get("title"),
      clientSummary: formData.get("clientSummary") || undefined,
      internalNotes: formData.get("internalNotes") || undefined,
      status: formData.get("status") || undefined,
      clientVisible: formData.get("clientVisible") || undefined,
    });

  if (!parsed.success) return { ok: false as const, error: "Invalid input." };

  try {
    await createCareEvent({
      websiteId: parsed.data.websiteId,
      type: parsed.data.type,
      status: parsed.data.status,
      title: parsed.data.title,
      clientSummary: parsed.data.clientSummary,
      internalNotes: parsed.data.internalNotes,
      performedById: admin.id,
      clientVisible: parsed.data.clientVisible !== "false",
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
    });
    revalidatePath(`/admin/agency/websites/${parsed.data.websiteId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create care event.",
    };
  }
}

export async function adminGrantWebsiteAccessAction(formData: FormData) {
  await assertSameOrigin();
  const admin = await requireAdminUser("manage_websites");
  const websiteId = String(formData.get("websiteId") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  const role = String(formData.get("role") ?? "MEMBER") as "VIEWER" | "MEMBER" | "WEBSITE_ADMIN";
  if (!websiteId || !contactId) return { ok: false as const, error: "Missing fields." };
  try {
    await grantWebsiteAccess({ websiteId, contactId, role, grantedById: admin.id });
    revalidatePath(`/admin/agency/websites/${websiteId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not grant access.",
    };
  }
}

export async function adminRevokeWebsiteAccessAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_websites");
  const websiteId = String(formData.get("websiteId") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  if (!websiteId || !contactId) return { ok: false as const, error: "Missing fields." };
  await revokeWebsiteAccess({ websiteId, contactId });
  revalidatePath(`/admin/agency/websites/${websiteId}`);
  return { ok: true as const };
}

export async function adminSupportReplyAction(formData: FormData) {
  await assertSameOrigin();
  const admin = await requireAdminUser("manage_support");
  const parsed = z
    .object({
      supportRequestId: z.string().cuid(),
      body: z.string().trim().min(1).max(20000),
      action: z.enum(["reply", "waiting", "resolve"]).optional(),
    })
    .safeParse({
      supportRequestId: formData.get("supportRequestId"),
      body: formData.get("body"),
      action: formData.get("action") || "reply",
    });
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };

  try {
    if (parsed.data.action === "waiting") {
      await markSupportWaitingOnClient({
        supportRequestId: parsed.data.supportRequestId,
        adminUserId: admin.id,
        message: parsed.data.body,
      });
    } else if (parsed.data.action === "resolve") {
      await resolveSupportRequest({
        supportRequestId: parsed.data.supportRequestId,
        adminUserId: admin.id,
        message: parsed.data.body,
      });
    } else {
      await addSmartlanceSupportMessage({
        supportRequestId: parsed.data.supportRequestId,
        adminUserId: admin.id,
        body: parsed.data.body,
      });
    }
    revalidatePath(`/admin/agency/support/${parsed.data.supportRequestId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update support request.",
    };
  }
}

export async function adminLinkSupportChangeAction(formData: FormData) {
  await assertSameOrigin();
  const admin = await requireAdminUser("manage_support");
  const supportRequestId = String(formData.get("supportRequestId") ?? "");
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  if (!supportRequestId || !changeRequestId) {
    return { ok: false as const, error: "Missing fields." };
  }
  await linkSupportToChangeRequest({ supportRequestId, changeRequestId, adminUserId: admin.id });
  revalidatePath(`/admin/agency/support/${supportRequestId}`);
  return { ok: true as const };
}

export async function adminListContactsForWebsite(companyId?: string | null) {
  await requireAdminUser("manage_websites");
  return prisma.crmContact.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { displayName: "asc" },
    take: 100,
    select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
  });
}
