"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan, can } from "@/lib/admin/rbac";
import { isFormRateLimited } from "@/lib/forms";
import {
  adminUnsubscribeSubscriber,
  exportSubscribersCsv,
} from "@/lib/audience/service";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export async function adminUnsubscribeSubscriberAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_audience");
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing subscriber id." };

  try {
    await adminUnsubscribeSubscriber({ id, actorId: user.id });
    await writeAuditLog({
      actorId: user.id,
      action: "subscriber_manual_unsubscribe",
      entityType: "Subscriber",
      entityId: id,
      metadata: {},
    });
    revalidatePath("/admin/audience");
    revalidatePath(`/admin/audience/${id}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Unsubscribe failed.",
    };
  }
}

export async function exportSubscribersAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("view_audience");
  assertCan(user.role, "export_audience");

  if (isFormRateLimited(`subscriber-export:${user.id}`, 3, 15 * 60 * 1000)) {
    return { ok: false as const, error: "Export rate limit reached. Try again later." };
  }

  try {
    const csv = await exportSubscribersCsv({ actorId: user.id });
    return { ok: true as const, csv };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Export failed.",
    };
  }
}

export async function canExportAudienceAction() {
  const user = await requireAdminUser("view_audience");
  return can(user.role, "export_audience");
}
