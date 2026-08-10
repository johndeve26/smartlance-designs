"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { listAdminUsersForSelect } from "@/lib/agency/projects";
import {
  archiveProposal,
  createDraftVersion,
  createProposal,
  getProposalById,
  returnProposalToDraft,
  revokeProposalAccess,
  saveDraftVersion,
  sendProposalToClient,
  submitForInternalReview,
  updateProposal,
  convertAcceptedProposalToProject,
  grantProposalAccess,
  resendProposalNotification,
} from "@/lib/proposals";
import {
  convertAcceptedProposalSchema,
  createProposalSchema,
  createProposalVersionSchema,
  grantProposalAccessSchema,
  proposalStatusActionSchema,
  revokeProposalAccessSchema,
  saveProposalVersionSchema,
  sendProposalSchema,
  updateProposalSchema,
} from "@/lib/proposals/schema";

function revalidateProposals(proposalId?: string) {
  revalidatePath("/admin/agency/proposals");
  revalidatePath("/admin/agency");
  if (proposalId) {
    revalidatePath(`/admin/agency/proposals/${proposalId}`);
  }
}

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");

  const parsed = createProposalSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const proposal = await createProposal({
      title: parsed.data.title,
      primaryContactId: parsed.data.primaryContactId,
      companyId: parsed.data.companyId || null,
      dealId: parsed.data.dealId || null,
      ownerId: parsed.data.ownerId || user.id,
      createdById: user.id,
      currency: parsed.data.currency,
      summary: parsed.data.summary || null,
      internalNotes: parsed.data.internalNotes || null,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "proposal.create",
      entityType: "AgencyProposal",
      entityId: proposal!.id,
    });

    revalidateProposals(proposal!.id);
    return { ok: true as const, id: proposal!.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create proposal.",
    };
  }
}

export async function updateProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");

  const parsed = updateProposalSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await updateProposal({
      proposalId: parsed.data.proposalId,
      title: parsed.data.title,
      summary: parsed.data.summary ?? undefined,
      internalNotes: parsed.data.internalNotes ?? undefined,
      ownerId: parsed.data.ownerId || undefined,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : parsed.data.expiresAt === "" ? null : undefined,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "proposal.update",
      entityType: "AgencyProposal",
      entityId: parsed.data.proposalId,
    });

    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update proposal.",
    };
  }
}

export async function saveProposalVersionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");

  const raw = parseForm(formData);
  let lineItems = [];
  let scopeItems = [];
  let deliverables = [];
  let sections = [];
  try {
    lineItems = JSON.parse(String(raw.lineItemsJson || "[]"));
    scopeItems = JSON.parse(String(raw.scopeItemsJson || "[]"));
    deliverables = JSON.parse(String(raw.deliverablesJson || "[]"));
    sections = JSON.parse(String(raw.sectionsJson || "[]"));
  } catch {
    return { ok: false as const, error: "Invalid structured proposal data." };
  }

  const parsed = saveProposalVersionSchema.safeParse({ ...raw, lineItems, scopeItems, deliverables, sections });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const versionId = parsed.data.versionId;
  if (!versionId) {
    return { ok: false as const, error: "Version ID is required." };
  }

  try {
    await saveDraftVersion({
      proposalId: parsed.data.proposalId,
      versionId,
      title: parsed.data.title,
      intro: parsed.data.intro || null,
      scopeSummary: parsed.data.scopeSummary || null,
      timelineSummary: parsed.data.timelineSummary || null,
      estimatedStart: parsed.data.estimatedStart ? new Date(parsed.data.estimatedStart) : null,
      estimatedDuration: parsed.data.estimatedDuration || null,
      assumptionsText: parsed.data.assumptionsText || null,
      exclusionsText: parsed.data.exclusionsText || null,
      revisionPolicy: parsed.data.revisionPolicy || null,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      discountAmount: parsed.data.discountAmount ?? null,
      taxAmount: parsed.data.taxAmount ?? null,
      lineItems: parsed.data.lineItems,
      scopeItems: parsed.data.scopeItems,
      deliverables: parsed.data.deliverables,
      sections: parsed.data.sections,
    });

    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not save proposal version.",
    };
  }
}

export async function createProposalVersionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");

  const parsed = createProposalVersionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const proposal = await getProposalById(parsed.data.proposalId);
    if (!proposal) throw new Error("Proposal not found.");

    const sourceVersionId =
      parsed.data.sourceVersionId ||
      proposal.currentVersionId ||
      proposal.versions[0]?.id;

    const version = await createDraftVersion({
      proposalId: parsed.data.proposalId,
      createdById: user.id,
      title: proposal.title,
      currency: proposal.currency,
      sourceVersionId: sourceVersionId ?? undefined,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "proposal.version.create",
      entityType: "AgencyProposalVersion",
      entityId: version.id,
      metadata: { proposalId: parsed.data.proposalId },
    });

    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const, versionId: version.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create version.",
    };
  }
}

export async function sendProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_proposals");

  const raw = parseForm(formData);
  const contactIds = String(raw.contactIds || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = sendProposalSchema.safeParse({ ...raw, contactIds });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await sendProposalToClient({
      proposalId: parsed.data.proposalId,
      versionId: parsed.data.versionId,
      actorUserId: user.id,
      contactIds: parsed.data.contactIds,
      decisionMakerContactId: parsed.data.decisionMakerContactId,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "proposal.send",
      entityType: "AgencyProposal",
      entityId: parsed.data.proposalId,
      metadata: { versionId: result.versionId, notificationFailed: result.notificationFailed },
    });

    revalidateProposals(parsed.data.proposalId);
    return {
      ok: true as const,
      notificationFailed: result.notificationFailed,
      notifications: result.notifications,
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not send proposal.",
    };
  }
}

export async function resendProposalNotificationAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("send_proposals");

  const proposalId = String(formData.get("proposalId") || "");
  const contactId = String(formData.get("contactId") || "");
  if (!proposalId || !contactId) {
    return { ok: false as const, error: "Missing proposal or contact." };
  }

  try {
    const user = await requireAdminUser("send_proposals");
    const result = await resendProposalNotification({
      proposalId,
      contactId,
      actorUserId: user.id,
    });
    return { ok: result.success, error: result.success ? undefined : result.errorMessage };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not resend notification.",
    };
  }
}

export async function submitProposalReviewAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");
  const parsed = proposalStatusActionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid proposal." };
  }
  try {
    await submitForInternalReview(parsed.data.proposalId, user.id);
    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function returnProposalDraftAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");
  const parsed = proposalStatusActionSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false as const, error: "Invalid proposal." };
  try {
    await returnProposalToDraft(parsed.data.proposalId, user.id);
    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function archiveProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");
  const parsed = proposalStatusActionSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false as const, error: "Invalid proposal." };
  try {
    await archiveProposal(parsed.data.proposalId, user.id);
    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function grantProposalAccessAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");
  const parsed = grantProposalAccessSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await grantProposalAccess({
      ...parsed.data,
      grantedById: user.id,
    });
    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function revokeProposalAccessAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_proposals");
  const parsed = revokeProposalAccessSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };
  try {
    await revokeProposalAccess(parsed.data);
    await writeAuditLog({
      actorId: user.id,
      action: "proposal.access.revoke",
      entityType: "AgencyProposalClientAccess",
      entityId: parsed.data.proposalId,
      metadata: { contactId: parsed.data.contactId },
    });
    revalidateProposals(parsed.data.proposalId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function convertAcceptedProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");

  const raw = parseForm(formData);
  const grantIds = String(raw.grantProjectAccessContactIds || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = convertAcceptedProposalSchema.safeParse({
    ...raw,
    grantProjectAccessContactIds: grantIds.length ? grantIds : undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const result = await convertAcceptedProposalToProject({
      proposalId: parsed.data.proposalId,
      actorUserId: user.id,
      name: parsed.data.name,
      templateId: parsed.data.templateId || null,
      grantProjectAccessContactIds: parsed.data.grantProjectAccessContactIds,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "proposal.convert_project",
      entityType: "AgencyProject",
      entityId: result.project.id,
      metadata: { proposalId: parsed.data.proposalId, created: result.created },
    });

    revalidateProposals(parsed.data.proposalId);
    revalidatePath("/admin/agency/projects");
    revalidatePath(`/admin/agency/projects/${result.project.id}`);
    return { ok: true as const, projectId: result.project.id, created: result.created };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create project.",
    };
  }
}

export { listAdminUsersForSelect };
