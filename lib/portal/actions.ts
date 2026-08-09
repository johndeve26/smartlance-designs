"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/admin/session";
import { z } from "zod";
import {
  markRequirementReceivedSchema,
  portalReviewDeliverableSchema,
  updateAgencyProjectSchema,
} from "@/lib/agency/schema";
import {
  approveDeliverableByClient,
  getDeliverableById,
  requestDeliverableChanges,
} from "@/lib/agency/deliverables";
import { markRequirementReceived } from "@/lib/agency/requirements";
import { submitDeliverableReview } from "@/lib/portal/projects";
import { requestPortalMagicLink } from "@/lib/portal/auth";
import { assertProjectAccess } from "@/lib/portal/access";
import { requirePortalUser } from "@/lib/portal/session";

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function requestPortalLoginAction(formData: FormData) {
  await assertSameOrigin();
  const email = String(formData.get("email") ?? "");
  const result = await requestPortalMagicLink(email);
  if (!result.ok) return result;
  return { ok: true as const };
}

export async function reviewDeliverableAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = z.object({
    deliverableId: z.string().cuid(),
    decision: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
    comment: z.string().trim().max(8000).optional().or(z.literal("")),
  }).safeParse(parseForm(formData));

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await submitDeliverableReview({
      portalUserId: user.id,
      deliverableId: parsed.data.deliverableId,
      decision: parsed.data.decision,
      comment: parsed.data.comment || null,
    });
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not submit review.",
    };
  }
}

export async function portalApproveDeliverableAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = portalReviewDeliverableSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const deliverable = await getDeliverableById(parsed.data.deliverableId);
    if (!deliverable) {
      return { ok: false as const, error: "Deliverable not found." };
    }

    await assertProjectAccess({
      projectId: deliverable.projectId,
      portalUserId: user.id,
      contactId: user.contactId,
    });

    await approveDeliverableByClient({
      deliverableId: parsed.data.deliverableId,
      versionId: parsed.data.versionId,
      reviewerContactId: user.contactId,
      reviewerPortalUserId: user.id,
      comment: parsed.data.comment || null,
    });

    revalidatePath(`/portal/projects/${deliverable.projectId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not approve deliverable.",
    };
  }
}

export async function portalRequestChangesAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = portalReviewDeliverableSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const deliverable = await getDeliverableById(parsed.data.deliverableId);
    if (!deliverable) {
      return { ok: false as const, error: "Deliverable not found." };
    }

    await assertProjectAccess({
      projectId: deliverable.projectId,
      portalUserId: user.id,
      contactId: user.contactId,
    });

    await requestDeliverableChanges({
      deliverableId: parsed.data.deliverableId,
      versionId: parsed.data.versionId,
      reviewerContactId: user.contactId,
      reviewerPortalUserId: user.id,
      comment: parsed.data.comment || null,
    });

    revalidatePath(`/portal/projects/${deliverable.projectId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not submit change request.",
    };
  }
}

export async function portalMarkRequirementReceivedAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = markRequirementReceivedSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const requirement = await import("@/lib/db").then((m) =>
      m.prisma.agencyClientRequirement.findUniqueOrThrow({
        where: { id: parsed.data.requirementId },
      }),
    );

    await assertProjectAccess({
      projectId: requirement.projectId,
      portalUserId: user.id,
      contactId: user.contactId,
    });

    if (!requirement.clientVisible) {
      return { ok: false as const, error: "Requirement not available in portal." };
    }

    await markRequirementReceived({
      requirementId: parsed.data.requirementId,
      actorPortalUserId: user.id,
    });

    revalidatePath(`/portal/projects/${requirement.projectId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not mark requirement received.",
    };
  }
}
