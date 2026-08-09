"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { createPortalInviteSchema, revokePortalAccessSchema } from "@/lib/agency/schema";
import { createInvite, revokeAccess } from "@/lib/portal/invite";

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createPortalInviteAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = createPortalInviteSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const { invite, token } = await createInvite({
      contactId: parsed.data.contactId,
      projectId: parsed.data.projectId || null,
      role: parsed.data.role,
      createdById: user.id,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "portal.invite.create",
      entityType: "ClientPortalInvite",
      entityId: invite.id,
      metadata: {
        contactId: parsed.data.contactId,
        projectId: parsed.data.projectId || null,
      },
    });

    if (parsed.data.projectId) {
      revalidatePath(`/admin/agency/projects/${parsed.data.projectId}`);
    }
    revalidatePath("/admin/agency/projects");

    return { ok: true as const, inviteId: invite.id, token };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create portal invite.",
    };
  }
}

export async function revokePortalAccessAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const parsed = revokePortalAccessSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await revokeAccess({
      ...parsed.data,
      actorUserId: user.id,
    });

    if (result.revoked) {
      await writeAuditLog({
        actorId: user.id,
        action: "portal.access.revoke",
        entityType: "AgencyProjectClientAccess",
        entityId: result.accessId,
        metadata: {
          projectId: parsed.data.projectId,
          contactId: parsed.data.contactId,
        },
      });
    }

    revalidatePath(`/admin/agency/projects/${parsed.data.projectId}`);
    return { ok: true as const, revoked: result.revoked };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not revoke portal access.",
    };
  }
}
