"use server";

import { revalidatePath } from "next/cache";
import type { EnquiryStatus } from "@prisma/client";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan, can } from "@/lib/admin/rbac";
import { isFormRateLimited } from "@/lib/forms";
import {
  addEnquiryNote,
  anonymizeEnquiry,
  exportEnquiriesCsv,
  permanentlyDeleteEnquiry,
  retryEnquiryNotification,
  updateEnquiryStatus,
} from "@/lib/enquiries/service";

function revalidateEnquiryPaths(id: string, type: "CONTACT" | "WEBSITE_REVIEW") {
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  if (type === "CONTACT") {
    revalidatePath("/admin/enquiries/contact");
    revalidatePath(`/admin/enquiries/contact/${id}`);
  } else {
    revalidatePath("/admin/enquiries/reviews");
    revalidatePath(`/admin/enquiries/reviews/${id}`);
  }
}

export async function changeEnquiryStatusAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_enquiries");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as EnquiryStatus;
  const type = String(formData.get("type") || "CONTACT") as
    | "CONTACT"
    | "WEBSITE_REVIEW";
  const allowed: EnquiryStatus[] = [
    "NEW",
    "REVIEWING",
    "REPLIED",
    "QUALIFIED",
    "CLOSED",
    "SPAM",
  ];
  if (!allowed.includes(status)) {
    return { ok: false as const, error: "Invalid status." };
  }
  try {
    await updateEnquiryStatus({ id, status, actorId: user.id });
    revalidateEnquiryPaths(id, type);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Status update failed",
    };
  }
}

export async function addEnquiryNoteAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_enquiries");
  const enquiryId = String(formData.get("enquiryId") || "");
  const body = String(formData.get("body") || "");
  const type = String(formData.get("type") || "CONTACT") as
    | "CONTACT"
    | "WEBSITE_REVIEW";
  try {
    await addEnquiryNote({ enquiryId, body, actorId: user.id });
    revalidateEnquiryPaths(enquiryId, type);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not add note",
    };
  }
}

export async function retryEnquiryNotificationAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_enquiries");
  const id = String(formData.get("id") || "");
  const type = String(formData.get("type") || "CONTACT") as
    | "CONTACT"
    | "WEBSITE_REVIEW";
  if (isFormRateLimited(`enquiry-retry:${user.id}:${id}`, 5, 15 * 60 * 1000)) {
    return {
      ok: false as const,
      error: "Too many notification retries. Please wait before trying again.",
    };
  }
  try {
    const status = await retryEnquiryNotification({ id, actorId: user.id });
    revalidateEnquiryPaths(id, type);
    return { ok: true as const, status };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Retry failed",
    };
  }
}

export async function anonymizeEnquiryAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser();
  assertCan(user.role, "enquiry_destructive");
  const id = String(formData.get("id") || "");
  const type = String(formData.get("type") || "CONTACT") as
    | "CONTACT"
    | "WEBSITE_REVIEW";
  try {
    await anonymizeEnquiry({ id, actorId: user.id });
    revalidateEnquiryPaths(id, type);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Anonymize failed",
    };
  }
}

export async function deleteEnquiryAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser();
  assertCan(user.role, "enquiry_destructive");
  const id = String(formData.get("id") || "");
  const type = String(formData.get("type") || "CONTACT") as
    | "CONTACT"
    | "WEBSITE_REVIEW";
  try {
    await permanentlyDeleteEnquiry({ id, actorId: user.id });
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin");
    if (type === "CONTACT") revalidatePath("/admin/enquiries/contact");
    else revalidatePath("/admin/enquiries/reviews");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function exportEnquiriesAction(input: {
  type?: "CONTACT" | "WEBSITE_REVIEW";
  status?: EnquiryStatus;
  includeSpam?: boolean;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser();
  if (!can(user.role, "export_enquiries")) {
    return { ok: false as const, error: "Export requires Super Admin." };
  }
  try {
    const csv = await exportEnquiriesCsv({
      filters: {
        type: input.type,
        status: input.status,
        includeSpam: input.includeSpam,
        pageSize: 5000,
      },
      actorId: user.id,
    });
    return { ok: true as const, csv };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Export failed",
    };
  }
}
