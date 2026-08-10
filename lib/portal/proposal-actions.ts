"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/admin/session";
import {
  acceptProposal,
  declineProposal,
  requestProposalChanges,
} from "@/lib/proposals/acceptance";
import {
  clientAcceptProposalSchema,
  clientDeclineProposalSchema,
  clientRequestChangesSchema,
} from "@/lib/proposals/schema";
import { requirePortalUser } from "@/lib/portal/session";

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function portalAcceptProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const raw = parseForm(formData);
  const selectedOptionalItemIds = String(raw.selectedOptionalItemIds || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = clientAcceptProposalSchema.safeParse({
    proposalId: raw.proposalId,
    selectedOptionalItemIds,
    termsAcknowledged: raw.termsAcknowledged === "true",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await acceptProposal({
      proposalId: parsed.data.proposalId,
      portalUserId: user.id,
      contactId: user.contactId,
      selectedOptionalItemIds: parsed.data.selectedOptionalItemIds,
      termsAcknowledged: parsed.data.termsAcknowledged,
    });
    revalidatePath("/portal");
    revalidatePath("/portal/proposals");
    revalidatePath(`/portal/proposals/${parsed.data.proposalId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not accept proposal.",
    };
  }
}

export async function portalDeclineProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = clientDeclineProposalSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await declineProposal({
      proposalId: parsed.data.proposalId,
      portalUserId: user.id,
      contactId: user.contactId,
      comment: parsed.data.comment || null,
    });
    revalidatePath("/portal/proposals");
    revalidatePath(`/portal/proposals/${parsed.data.proposalId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not decline proposal.",
    };
  }
}

export async function portalRequestChangesAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = clientRequestChangesSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await requestProposalChanges({
      proposalId: parsed.data.proposalId,
      portalUserId: user.id,
      contactId: user.contactId,
      comment: parsed.data.comment,
    });
    revalidatePath("/portal/proposals");
    revalidatePath(`/portal/proposals/${parsed.data.proposalId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not submit change request.",
    };
  }
}
