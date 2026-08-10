"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/admin/session";
import { z } from "zod";
import { requirePortalUser } from "@/lib/portal/session";
import {
  createSupportRequest,
  addClientSupportMessage,
  confirmSupportResolution,
  stillNeedHelp,
} from "@/lib/client-success/support";
import { uploadAgencyFile } from "@/lib/agency/files";
import { prisma } from "@/lib/db";
import { isFormRateLimited } from "@/lib/forms";

const createSchema = z.object({
  websiteId: z.string().cuid(),
  category: z.enum([
    "WEBSITE_CHANGE",
    "CONTENT_UPDATE",
    "TECHNICAL_ISSUE",
    "QUESTION",
    "ACCESS_HELP",
    "NEW_FEATURE",
    "OTHER",
  ]),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(20000),
});

export async function portalCreateSupportRequestAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  if (isFormRateLimited(`portal-support:${user.id}`, 10, 60 * 60 * 1000)) {
    return { ok: false as const, error: "Too many support requests. Please try again later." };
  }

  const parsed = createSchema.safeParse({
    websiteId: formData.get("websiteId"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    subject: formData.get("subject"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const request = await createSupportRequest({
      ...parsed.data,
      portalUserId: user.id,
      contactId: user.contactId,
    });

    const website = await prisma.agencyManagedWebsite.findUnique({
      where: { id: parsed.data.websiteId },
      select: { primaryProjectId: true },
    });

    const files = formData.getAll("attachments");
    if (website?.primaryProjectId && files.length) {
      let count = 0;
      for (const entry of files) {
        if (!(entry instanceof File) || !entry.size) continue;
        if (count >= 5) break;
        const buffer = Buffer.from(await entry.arrayBuffer());
        const stored = await uploadAgencyFile({
          projectId: website.primaryProjectId,
          filename: entry.name,
          mimeType: entry.type || "application/octet-stream",
          buffer,
          createdById: (
            await prisma.agencyProject.findUniqueOrThrow({
              where: { id: website.primaryProjectId },
              select: { ownerId: true },
            })
          ).ownerId,
        });
        await prisma.agencySupportRequestFile.create({
          data: {
            supportRequestId: request.id,
            projectFileId: stored.id,
            submittedByPortalUserId: user.id,
            clientVisible: true,
          },
        });
        count++;
      }
    }

    revalidatePath("/portal/support");
    revalidatePath("/portal");
    return { ok: true as const, id: request.id, supportNumber: request.supportNumber };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not submit support request.",
    };
  }
}

export async function portalReplySupportAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = z
    .object({
      supportRequestId: z.string().cuid(),
      body: z.string().trim().min(1).max(20000),
    })
    .safeParse({
      supportRequestId: formData.get("supportRequestId"),
      body: formData.get("body"),
    });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid message." };
  }

  if (isFormRateLimited(`portal-support-reply:${user.id}`, 30, 60 * 60 * 1000)) {
    return { ok: false as const, error: "Too many messages. Please try again later." };
  }

  try {
    await addClientSupportMessage({
      supportRequestId: parsed.data.supportRequestId,
      portalUserId: user.id,
      body: parsed.data.body,
    });
    revalidatePath(`/portal/support/${parsed.data.supportRequestId}`);
    revalidatePath("/portal");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not send message.",
    };
  }
}

export async function portalConfirmSupportResolvedAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();
  const id = String(formData.get("supportRequestId") ?? "");
  if (!id) return { ok: false as const, error: "Missing request." };
  try {
    await confirmSupportResolution({ supportRequestId: id, portalUserId: user.id });
    revalidatePath(`/portal/support/${id}`);
    revalidatePath("/portal/support");
    revalidatePath("/portal");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not confirm resolution.",
    };
  }
}

export async function portalStillNeedHelpAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();
  const parsed = z
    .object({
      supportRequestId: z.string().cuid(),
      message: z.string().trim().min(1).max(20000),
    })
    .safeParse({
      supportRequestId: formData.get("supportRequestId"),
      message: formData.get("message"),
    });
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };
  try {
    await stillNeedHelp({
      supportRequestId: parsed.data.supportRequestId,
      portalUserId: user.id,
      message: parsed.data.message,
    });
    revalidatePath(`/portal/support/${parsed.data.supportRequestId}`);
    revalidatePath("/portal");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not reopen request.",
    };
  }
}
