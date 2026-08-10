"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/admin/session";
import {
  clientDeclineContractSchema,
  clientRequestContractCorrectionSchema,
  clientSignContractSchema,
} from "@/lib/contracts/schema";
import {
  declineContractAsClient,
  requestContractCorrection,
  signContractAsClient,
} from "@/lib/contracts/signing";
import { requirePortalUser } from "@/lib/portal/session";

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function portalSignContractAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = clientSignContractSchema.safeParse({
    ...parseForm(formData),
    consentAcknowledged: formData.get("consentAcknowledged") === "true",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await signContractAsClient({
      contractId: parsed.data.contractId,
      portalUserId: user.id,
      contactId: user.contactId,
      consentAcknowledged: parsed.data.consentAcknowledged,
      typedSignatureName: parsed.data.typedSignatureName,
      signerTitle: parsed.data.signerTitle,
    });
    revalidatePath("/portal/contracts");
    revalidatePath(`/portal/contracts/${parsed.data.contractId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not sign contract.",
    };
  }
}

export async function portalDeclineContractAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = clientDeclineContractSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await declineContractAsClient({
      contractId: parsed.data.contractId,
      portalUserId: user.id,
      contactId: user.contactId,
      comment: parsed.data.comment || null,
    });
    revalidatePath("/portal/contracts");
    revalidatePath(`/portal/contracts/${parsed.data.contractId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not decline contract.",
    };
  }
}

export async function portalRequestContractCorrectionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();

  const parsed = clientRequestContractCorrectionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await requestContractCorrection({
      contractId: parsed.data.contractId,
      portalUserId: user.id,
      contactId: user.contactId,
      comment: parsed.data.comment,
    });
    revalidatePath("/portal/contracts");
    revalidatePath(`/portal/contracts/${parsed.data.contractId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not submit correction request.",
    };
  }
}
