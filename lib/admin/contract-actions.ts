"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  createContractFromAcceptance,
  createManualContract,
  getContractById,
  listContracts,
} from "@/lib/contracts/contracts";
import { sendContractToSigners, resendContractNotification } from "@/lib/contracts/send";
import {
  createContractVersion,
  saveDraftVersion,
} from "@/lib/contracts/versions";
import {
  returnContractToDraft,
  submitContractForReview,
  voidContract,
  archiveContract,
} from "@/lib/contracts/status";
import {
  createTemplate,
  createTemplateVersion,
} from "@/lib/contracts/templates";
import { signContractAsAdmin } from "@/lib/contracts/signing";
import { grantContractAccess, revokeContractAccess } from "@/lib/contracts/portal-access";
import {
  adminSignContractSchema,
  createContractFromAcceptanceSchema,
  createContractTemplateSchema,
  createContractVersionSchema,
  createManualContractSchema,
  saveContractVersionSchema,
  sendContractSchema,
  voidContractSchema,
} from "@/lib/contracts/schema";

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateContracts(contractId?: string) {
  revalidatePath("/admin/agency/contracts");
  revalidatePath("/admin/agency");
  if (contractId) {
    revalidatePath(`/admin/agency/contracts/${contractId}`);
  }
}

export async function createContractFromAcceptanceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");

  const parsed = createContractFromAcceptanceSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const contract = await createContractFromAcceptance({
      proposalId: parsed.data.proposalId,
      createdById: user.id,
      ownerId: user.id,
      title: parsed.data.title,
      contractType: parsed.data.contractType,
      templateVersionId: parsed.data.templateVersionId || null,
      clientSignerContactId: parsed.data.clientSignerContactId,
      agencySignerRequired: parsed.data.agencySignerRequired,
      agencySignerAdminId: parsed.data.agencySignerRequired ? user.id : undefined,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "contract.create_from_acceptance",
      entityType: "AgencyContract",
      entityId: contract!.id,
    });

    revalidateContracts(contract!.id);
    revalidatePath(`/admin/agency/proposals/${parsed.data.proposalId}`);
    return { ok: true as const, id: contract!.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create contract.",
    };
  }
}

export async function createManualContractAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");

  const parsed = createManualContractSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const contract = await createManualContract({
      title: parsed.data.title,
      createdById: user.id,
      ownerId: user.id,
      primaryContactId: parsed.data.primaryContactId || null,
      companyId: parsed.data.companyId || null,
      templateVersionId: parsed.data.templateVersionId || null,
      contractType: parsed.data.contractType,
      content: parsed.data.content,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "contract.create_manual",
      entityType: "AgencyContract",
      entityId: contract!.id,
    });

    revalidateContracts(contract!.id);
    return { ok: true as const, id: contract!.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create contract.",
    };
  }
}

export async function saveContractVersionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");

  const parsed = saveContractVersionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await saveDraftVersion({
      contractId: parsed.data.contractId,
      versionId: parsed.data.versionId,
      title: parsed.data.title,
      content: parsed.data.content,
      actorUserId: user.id,
    });
    revalidateContracts(parsed.data.contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not save version.",
    };
  }
}

export async function createContractVersionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");

  const parsed = createContractVersionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await createContractVersion({
      contractId: parsed.data.contractId,
      createdById: user.id,
      sourceVersionId: parsed.data.sourceVersionId,
    });
    revalidateContracts(parsed.data.contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create version.",
    };
  }
}

export async function sendContractAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_contracts");

  const parsed = sendContractSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await sendContractToSigners({
      contractId: parsed.data.contractId,
      versionId: parsed.data.versionId,
      actorUserId: user.id,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "contract.send",
      entityType: "AgencyContract",
      entityId: parsed.data.contractId,
    });

    revalidateContracts(parsed.data.contractId);
    revalidatePath("/portal/contracts");
    return {
      ok: true as const,
      notificationFailed: result.notificationFailed,
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not send contract.",
    };
  }
}

export async function voidContractAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");

  const parsed = voidContractSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await voidContract({
      contractId: parsed.data.contractId,
      actorUserId: user.id,
      reason: parsed.data.reason,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "contract.void",
      entityType: "AgencyContract",
      entityId: parsed.data.contractId,
    });

    revalidateContracts(parsed.data.contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not void contract.",
    };
  }
}

export async function submitContractReviewAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");
  const contractId = String(formData.get("contractId") || "");
  if (!contractId) return { ok: false as const, error: "Missing contract ID." };

  try {
    await submitContractForReview(contractId, user.id);
    revalidateContracts(contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not submit for review.",
    };
  }
}

export async function returnContractDraftAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");
  const contractId = String(formData.get("contractId") || "");
  if (!contractId) return { ok: false as const, error: "Missing contract ID." };

  try {
    await returnContractToDraft(contractId, user.id);
    revalidateContracts(contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not return to draft.",
    };
  }
}

export async function archiveContractAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");
  const contractId = String(formData.get("contractId") || "");
  if (!contractId) return { ok: false as const, error: "Missing contract ID." };

  try {
    await archiveContract(contractId, user.id);
    revalidateContracts(contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not archive contract.",
    };
  }
}

export async function resendContractNotificationAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("send_contracts");
  const contractId = String(formData.get("contractId") || "");
  const signerId = String(formData.get("signerId") || "");
  if (!contractId || !signerId) return { ok: false as const, error: "Missing fields." };

  try {
    const result = await resendContractNotification({ contractId, signerId });
    return { ok: result.success as boolean, error: result.errorMessage };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not resend notification.",
    };
  }
}

export async function adminSignContractAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("sign_contracts");

  const parsed = adminSignContractSchema.safeParse({
    ...parseForm(formData),
    consentAcknowledged: formData.get("consentAcknowledged") === "true",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await signContractAsAdmin({
      contractId: parsed.data.contractId,
      adminUserId: user.id,
      consentAcknowledged: parsed.data.consentAcknowledged,
      typedSignatureName: parsed.data.typedSignatureName,
      signerTitle: parsed.data.signerTitle,
    });
    revalidateContracts(parsed.data.contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not sign contract.",
    };
  }
}

export async function grantContractAccessAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");
  const contractId = String(formData.get("contractId") || "");
  const contactId = String(formData.get("contactId") || "");
  const role = String(formData.get("role") || "VIEWER");
  if (!contractId || !contactId) return { ok: false as const, error: "Missing fields." };

  try {
    await grantContractAccess({
      contractId,
      contactId,
      role: role as "CLIENT_SIGNATORY" | "VIEWER",
      grantedById: user.id,
    });
    revalidateContracts(contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not grant access.",
    };
  }
}

export async function revokeContractAccessAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contracts");
  const contractId = String(formData.get("contractId") || "");
  const contactId = String(formData.get("contactId") || "");
  if (!contractId || !contactId) return { ok: false as const, error: "Missing fields." };

  try {
    await revokeContractAccess({ contractId, contactId });
    await writeAuditLog({
      actorId: user.id,
      action: "contract.revoke_access",
      entityType: "AgencyContract",
      entityId: contractId,
    });
    revalidateContracts(contractId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not revoke access.",
    };
  }
}

export async function createContractTemplateAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contract_templates");

  const parsed = createContractTemplateSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const template = await createTemplate({
      name: parsed.data.name,
      description: parsed.data.description || null,
      content: parsed.data.content,
      createdById: user.id,
    });
    revalidatePath("/admin/agency/contract-templates");
    return { ok: true as const, id: template.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create template.",
    };
  }
}

export async function createContractTemplateVersionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_contract_templates");

  const templateId = String(formData.get("templateId") || "");
  const name = String(formData.get("name") || "");
  const content = String(formData.get("content") || "");
  if (!templateId || !name.trim() || !content.trim()) {
    return { ok: false as const, error: "Template ID, name, and content are required." };
  }

  try {
    await createTemplateVersion({
      templateId,
      name,
      content,
      createdById: user.id,
    });
    revalidatePath(`/admin/agency/contract-templates/${templateId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create template version.",
    };
  }
}

export { listContracts, getContractById };
