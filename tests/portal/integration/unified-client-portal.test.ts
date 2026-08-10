import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import { createProject } from "@/lib/agency/projects";
import { createManualInvoice, issueInvoice } from "@/lib/billing/invoices";
import { grantInvoiceAccess, hasInvoiceAccess } from "@/lib/billing/portal-access";
import { getPortalBillingHome } from "@/lib/portal/billing";
import { createProposal } from "@/lib/proposals/proposals";
import { saveDraftVersion } from "@/lib/proposals/versions";
import { sendProposalToClient } from "@/lib/proposals/send";
import { acceptProposal } from "@/lib/proposals/acceptance";
import { grantProposalAccess } from "@/lib/proposals/portal-access";
import { grantContractAccess } from "@/lib/contracts/portal-access";
import {
  createChangeRequest,
  beginAssessment,
  saveAssessment,
  sendForClientApproval,
} from "@/lib/change-requests/change-requests";
import { grantChangeRequestAccess } from "@/lib/change-requests/portal-access";
import { getPortalAttentionItems } from "@/lib/portal/attention";
import { getPortalTimeline } from "@/lib/portal/timeline";
import { getPortalFiles } from "@/lib/portal/files";
import { getPortalHome, listPortalProjects } from "@/lib/portal/home";
import { getPortalApprovals } from "@/lib/portal/approvals";
import { getPortalDocuments } from "@/lib/portal/documents";
import { getPortalProjectWorkspace } from "@/lib/portal/project-workspace";
import { listAccessibleProjectIds } from "@/lib/portal/access";

const PREFIX = "[portal-v2-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

type PortalContact = {
  contactId: string;
  portalUserId: string;
};

async function cleanup(db: PrismaClient) {
  await db.agencyChangeRequestActivity.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestAssessment.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestClientAccess.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequest.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyContractClientAccess.deleteMany({
    where: { contract: { title: { startsWith: PREFIX } } },
  });
  await db.agencyContract.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.agencyProposalAcceptance.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalClientAccess.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalVersion.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposal.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.agencyDeliverableReview.deleteMany({
    where: { deliverable: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyProjectFile.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyDeliverableVersion.deleteMany({
    where: { deliverable: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyDeliverable.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectTask.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyClientRequirement.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectActivity.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectUpdate.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyInvoiceClientAccess.deleteMany({
    where: { invoice: { memo: { startsWith: PREFIX } } },
  });
  await db.agencyInvoiceLineItem.deleteMany({
    where: { invoice: { memo: { startsWith: PREFIX } } },
  });
  await db.agencyInvoice.deleteMany({ where: { memo: { startsWith: PREFIX } } });
  await db.agencyProjectClientAccess.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.clientPortalUser.deleteMany({
    where: { contact: { sourceDetail: { startsWith: PREFIX } } },
  });
  await db.agencyProject.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.crmContact.deleteMany({ where: { sourceDetail: { startsWith: PREFIX } } });
  await db.crmCompany.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function createPortalContact(
  db: PrismaClient,
  adminId: string,
  companyId: string,
  label: string,
): Promise<PortalContact> {
  const contact = await createIntegrationContact(db, adminId, {
    email: `${PREFIX}${label}-${Date.now()}@example.com`,
  });
  await db.crmContact.update({
    where: { id: contact.id },
    data: { sourceDetail: `${PREFIX} ${label}`, companyId },
  });
  const portalUser = await db.clientPortalUser.create({
    data: { contactId: contact.id, email: contact.email!, status: "ACTIVE" },
  });
  return { contactId: contact.id, portalUserId: portalUser.id };
}

describeIntegration("Portal V2 live acceptance", () => {
  let db: PrismaClient;
  let adminId: string;
  let companyId: string;

  let member: PortalContact;
  let viewer: PortalContact;
  let approver: PortalContact;
  let decisionMaker: PortalContact;
  let signatory: PortalContact;
  let billingViewer: PortalContact;
  let billingAdmin: PortalContact;
  let otherClient: PortalContact;
  let sameCompanyNoAccess: PortalContact;

  let projectAId: string;
  let projectBId: string;
  let deliverableId: string;
  let invoiceId: string;
  let proposalId: string;
  let contractId: string;
  let changeRequestId: string;
  let storageKey: string;

  beforeAll(async () => {
    db = await getIntegrationPrisma();
  });

  afterAll(async () => {
    await disconnectIntegrationPrisma();
  });

  beforeEach(async () => {
    await cleanup(db);
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;

    const company = await db.crmCompany.create({
      data: { name: `${PREFIX} Co`, ownerId: adminId },
    });
    companyId = company.id;

    member = await createPortalContact(db, adminId, companyId, "member");
    viewer = await createPortalContact(db, adminId, companyId, "viewer");
    approver = await createPortalContact(db, adminId, companyId, "approver");
    decisionMaker = await createPortalContact(db, adminId, companyId, "decision");
    signatory = await createPortalContact(db, adminId, companyId, "signatory");
    billingViewer = await createPortalContact(db, adminId, companyId, "bill-view");
    billingAdmin = await createPortalContact(db, adminId, companyId, "bill-admin");
    otherClient = await createPortalContact(db, adminId, companyId, "other");
    sameCompanyNoAccess = await createPortalContact(db, adminId, companyId, "same-co");

    const projectA = await createProject({
      name: `${PREFIX} Project A`,
      primaryContactId: member.contactId,
      clientCompanyId: companyId,
      serviceType: "WEBSITE_DESIGN",
      ownerId: adminId,
      createdById: adminId,
    });
    const projectB = await createProject({
      name: `${PREFIX} Project B`,
      primaryContactId: otherClient.contactId,
      clientCompanyId: companyId,
      serviceType: "WEBSITE_DESIGN",
      ownerId: adminId,
      createdById: adminId,
    });
    if (!projectA || !projectB) throw new Error("projects missing");
    projectAId = projectA.id;
    projectBId = projectB.id;

    for (const row of [
      { contact: member, role: "CLIENT_MEMBER" as const },
      { contact: viewer, role: "VIEWER" as const },
      { contact: approver, role: "CLIENT_MEMBER" as const },
      { contact: decisionMaker, role: "CLIENT_MEMBER" as const },
      { contact: signatory, role: "CLIENT_MEMBER" as const },
      { contact: billingViewer, role: "CLIENT_MEMBER" as const },
      { contact: billingAdmin, role: "CLIENT_MEMBER" as const },
    ]) {
      await db.agencyProjectClientAccess.create({
        data: {
          projectId: projectAId,
          contactId: row.contact.contactId,
          portalUserId: row.contact.portalUserId,
          role: row.role,
          grantedById: adminId,
        },
      });
    }

    await db.agencyProjectClientAccess.create({
      data: {
        projectId: projectBId,
        contactId: otherClient.contactId,
        portalUserId: otherClient.portalUserId,
        role: "CLIENT_MEMBER",
        grantedById: adminId,
      },
    });

    const deliverable = await db.agencyDeliverable.create({
      data: {
        projectId: projectAId,
        title: `${PREFIX} Homepage design`,
        status: "READY_FOR_REVIEW",
        clientVisible: true,
        createdById: adminId,
      },
    });
    deliverableId = deliverable.id;

    const version = await db.agencyDeliverableVersion.create({
      data: {
        deliverableId: deliverable.id,
        versionNumber: 1,
        submittedAt: new Date(),
        createdById: adminId,
      },
    });

    storageKey = `${PREFIX}/files/${projectAId}/deliverable.pdf`;
    await db.agencyProjectFile.create({
      data: {
        projectId: projectAId,
        versionId: version.id,
        filename: "deliverable.pdf",
        mimeType: "application/pdf",
        byteSize: 1024,
        storageProvider: "LOCAL",
        storageKey,
        createdById: adminId,
      },
    });

    await db.agencyDeliverable.create({
      data: {
        projectId: projectAId,
        title: `${PREFIX} Internal only`,
        status: "READY_FOR_REVIEW",
        clientVisible: false,
        createdById: adminId,
      },
    });

    await db.agencyClientRequirement.create({
      data: {
        projectId: projectAId,
        title: `${PREFIX} Logo files`,
        type: "BRAND_ASSET",
        status: "REQUESTED",
        clientVisible: true,
      },
    });

    await db.agencyProjectTask.create({
      data: {
        projectId: projectAId,
        title: `${PREFIX} Internal task`,
        status: "TODO",
        clientVisible: false,
        createdById: adminId,
      },
    });

    await db.agencyProjectUpdate.create({
      data: {
        projectId: projectAId,
        title: `${PREFIX} Client update`,
        body: "Visible progress note",
        clientVisible: true,
        createdById: adminId,
      },
    });

    await db.agencyProjectUpdate.create({
      data: {
        projectId: projectAId,
        title: `${PREFIX} Internal update`,
        body: "Should not appear",
        clientVisible: false,
        createdById: adminId,
      },
    });

    const older = new Date("2026-08-01T10:00:00Z");
    const newer = new Date("2026-08-09T10:00:00Z");
    await db.agencyProjectActivity.createMany({
      data: [
        {
          projectId: projectAId,
          type: "DELIVERABLE_SUBMITTED",
          summary: "Older client event",
          clientVisible: true,
          actorUserId: adminId,
          createdAt: older,
        },
        {
          projectId: projectAId,
          type: "UPDATE_POSTED",
          summary: "Newer client event",
          clientVisible: true,
          actorUserId: adminId,
          createdAt: newer,
        },
        {
          projectId: projectAId,
          type: "HEALTH_CHANGED",
          summary: "Internal admin activity",
          clientVisible: false,
          actorUserId: adminId,
        },
        {
          projectId: projectBId,
          type: "UPDATE_POSTED",
          summary: "Other client event",
          clientVisible: true,
          actorUserId: adminId,
        },
      ],
    });

    const proposal = await createProposal({
      title: `${PREFIX} Website proposal`,
      primaryContactId: decisionMaker.contactId,
      companyId,
      ownerId: adminId,
      createdById: adminId,
      currency: "USD",
    });
    if (!proposal) throw new Error("proposal missing");
    proposalId = proposal.id;
    await saveDraftVersion({
      proposalId: proposal.id,
      versionId: proposal.versions[0]!.id,
      title: proposal.title,
      lineItems: [
        {
          name: "Design",
          quantity: 1,
          unitPrice: 1000,
          type: "SERVICE",
          isOptional: false,
          isSelectedByDefault: false,
          position: 0,
        },
      ],
      scopeItems: [
        { title: "Scope", description: "Website design", position: 0, included: true, clientVisible: true },
      ],
      deliverables: [],
      sections: [],
    });
    await sendProposalToClient({
      proposalId: proposal.id,
      actorUserId: adminId,
      contactIds: [viewer.contactId, decisionMaker.contactId],
      decisionMakerContactId: decisionMaker.contactId,
    });

    const acceptedProposal = await createProposal({
      title: `${PREFIX} Accepted proposal`,
      primaryContactId: member.contactId,
      companyId,
      ownerId: adminId,
      createdById: adminId,
      currency: "USD",
    });
    if (!acceptedProposal) throw new Error("accepted proposal missing");
    await saveDraftVersion({
      proposalId: acceptedProposal.id,
      versionId: acceptedProposal.versions[0]!.id,
      title: acceptedProposal.title,
      lineItems: [
        {
          name: "Core",
          quantity: 1,
          unitPrice: 500,
          type: "SERVICE",
          isOptional: false,
          isSelectedByDefault: false,
          position: 0,
        },
      ],
      scopeItems: [
        { title: "Scope", description: "Done", position: 0, included: true, clientVisible: true },
      ],
      deliverables: [],
      sections: [],
    });
    await sendProposalToClient({
      proposalId: acceptedProposal.id,
      actorUserId: adminId,
      contactIds: [member.contactId],
      decisionMakerContactId: member.contactId,
    });
    await acceptProposal({
      proposalId: acceptedProposal.id,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      selectedOptionalItemIds: [],
      termsAcknowledged: true,
    });
    await grantProposalAccess({
      proposalId: acceptedProposal.id,
      contactId: member.contactId,
      role: "VIEWER",
      grantedById: adminId,
    });

    const contract = await db.agencyContract.create({
      data: {
        contractNumber: `${PREFIX}-C-001`,
        title: `${PREFIX} Service Agreement`,
        companyId,
        primaryContactId: signatory.contactId,
        ownerId: adminId,
        createdById: adminId,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    contractId = contract.id;
    await grantContractAccess({
      contractId: contract.id,
      contactId: viewer.contactId,
      role: "VIEWER",
      grantedById: adminId,
    });
    await grantContractAccess({
      contractId: contract.id,
      contactId: signatory.contactId,
      role: "CLIENT_SIGNATORY",
      grantedById: adminId,
    });

    const signedContract = await db.agencyContract.create({
      data: {
        contractNumber: `${PREFIX}-C-002`,
        title: `${PREFIX} Signed Agreement`,
        companyId,
        primaryContactId: member.contactId,
        ownerId: adminId,
        createdById: adminId,
        status: "SIGNED",
        fullySignedAt: new Date("2026-07-01"),
      },
    });
    await grantContractAccess({
      contractId: signedContract.id,
      contactId: member.contactId,
      role: "VIEWER",
      grantedById: adminId,
    });

    const cr = await createChangeRequest({
      projectId: projectAId,
      title: `${PREFIX} Extra page`,
      requestDescription: "Add page",
      origin: "CLIENT",
      createdById: adminId,
      requestedByPortalUserId: member.portalUserId,
      requestedByContactId: member.contactId,
      submit: true,
    });
    changeRequestId = cr.id;
    await beginAssessment({ changeRequestId: cr.id, actorUserId: adminId });
    await saveAssessment({
      changeRequestId: cr.id,
      actorUserId: adminId,
      classification: "OUT_OF_SCOPE",
      priceImpactMinor: 200000,
      timelineImpactDays: 7,
      clientScopeImpactSummary: "Additional page",
    });
    await sendForClientApproval({
      changeRequestId: cr.id,
      actorUserId: adminId,
      approverContactIds: [approver.contactId],
    });
    await grantChangeRequestAccess({
      changeRequestId: cr.id,
      contactId: viewer.contactId,
      role: "VIEWER",
      grantedById: adminId,
    });

    const invoice = await createManualInvoice({
      createdById: adminId,
      primaryContactId: billingAdmin.contactId,
      companyId,
      currency: "USD",
      memo: `${PREFIX} invoice`,
      lineItems: [{ description: "Work", quantity: 1, unitAmountMinor: 250000, position: 0 }],
    });
    if (!invoice) throw new Error("invoice missing");
    await issueInvoice({ invoiceId: invoice.id, actorUserId: adminId });
    invoiceId = invoice.id;
    await grantInvoiceAccess({
      invoiceId: invoice.id,
      contactId: billingViewer.contactId,
      role: "VIEWER",
      grantedById: adminId,
    });
    await grantInvoiceAccess({
      invoiceId: invoice.id,
      contactId: billingAdmin.contactId,
      role: "BILLING_ADMIN",
      grantedById: adminId,
    });
  });

  describe("Attention aggregation", () => {
    it("returns only authorized items for the client", async () => {
      const attention = await getPortalAttentionItems(member.portalUserId, 30);
      expect(attention.every((a) => !a.projectId || a.projectId === projectAId)).toBe(true);
      expect(attention.some((a) => a.type === "DELIVERABLE_APPROVAL")).toBe(true);

      const otherAttention = await getPortalAttentionItems(otherClient.portalUserId, 30);
      expect(otherAttention.every((a) => a.projectId !== projectAId)).toBe(true);
    });

    it("uses authority-aware CTAs", async () => {
      const viewerAttention = await getPortalAttentionItems(viewer.portalUserId, 30);
      const deliverable = viewerAttention.find((a) => a.type === "DELIVERABLE_APPROVAL");
      expect(deliverable?.canAct).toBe(false);

      const memberAttention = await getPortalAttentionItems(member.portalUserId, 30);
      expect(
        memberAttention.find((a) => a.type === "DELIVERABLE_APPROVAL")?.canAct,
      ).toBe(true);

      const proposalAttention = await getPortalAttentionItems(decisionMaker.portalUserId, 30);
      expect(
        proposalAttention.find((a) => a.type === "PROPOSAL_DECISION")?.canAct,
      ).toBe(true);
      expect(
        viewerAttention.find((a) => a.type === "PROPOSAL_DECISION")?.canAct,
      ).toBe(false);

      const billingAttention = await getPortalAttentionItems(billingAdmin.portalUserId, 30);
      const invoiceItem = billingAttention.find((a) => a.type.startsWith("INVOICE"));
      expect(invoiceItem?.canAct).toBe(true);
      expect(
        (await getPortalAttentionItems(billingViewer.portalUserId, 30)).find((a) =>
          a.type.startsWith("INVOICE"),
        )?.canAct,
      ).toBe(false);
    });

    it("removes items immediately after revocation", async () => {
      await db.agencyProjectClientAccess.updateMany({
        where: { projectId: projectAId, portalUserId: member.portalUserId },
        data: { revokedAt: new Date() },
      });
      const attention = await getPortalAttentionItems(member.portalUserId, 30);
      expect(attention.every((a) => a.projectId !== projectAId)).toBe(true);
    });
  });

  describe("Projects", () => {
    it("isolates cross-client projects", async () => {
      const ids = await listAccessibleProjectIds(member.portalUserId);
      expect(ids).toContain(projectAId);
      expect(ids).not.toContain(projectBId);
    });

    it("never returns internal tasks or notes in workspace", async () => {
      const workspace = await getPortalProjectWorkspace(member.portalUserId, projectAId);
      expect(workspace).not.toBeNull();
      expect(JSON.stringify(workspace)).not.toContain("Internal task");
      expect(workspace!.latestUpdate?.title).not.toContain("Internal update");
    });

    it("denies workspace after access revocation", async () => {
      await db.agencyProjectClientAccess.updateMany({
        where: { projectId: projectAId, portalUserId: member.portalUserId },
        data: { revokedAt: new Date() },
      });
      await expect(getPortalProjectWorkspace(member.portalUserId, projectAId)).rejects.toThrow();
    });
  });

  describe("Approvals", () => {
    it("allows viewer to see deliverable but not act", async () => {
      const { pending } = await getPortalApprovals(viewer.portalUserId);
      const item = pending.find((p) => p.kind === "deliverable");
      expect(item).toBeTruthy();
      expect(item!.canAct).toBe(false);
    });

    it("respects contract signer authority", async () => {
      const viewerApprovals = await getPortalApprovals(viewer.portalUserId);
      const signatoryApprovals = await getPortalApprovals(signatory.portalUserId);
      const viewerContract = viewerApprovals.pending.find((p) => p.kind === "contract");
      const signatoryContract = signatoryApprovals.pending.find((p) => p.kind === "contract");
      expect(viewerContract?.canAct).toBe(false);
      expect(signatoryContract?.canAct).toBe(true);
    });

    it("respects change approver authority", async () => {
      const viewerApprovals = await getPortalApprovals(viewer.portalUserId);
      const approverApprovals = await getPortalApprovals(approver.portalUserId);
      expect(viewerApprovals.pending.some((p) => p.kind === "change_request")).toBe(false);
      expect(approverApprovals.pending.some((p) => p.kind === "change_request")).toBe(true);
    });

    it("respects deliverable approval authority for members", async () => {
      const { pending } = await getPortalApprovals(member.portalUserId);
      expect(pending.find((p) => p.kind === "deliverable")?.canAct).toBe(true);
    });
  });

  describe("Timeline", () => {
    it("orders events chronologically", async () => {
      const timeline = await getPortalTimeline({ portalUserId: member.portalUserId, limit: 20 });
      const clientEvents = timeline.filter((e) =>
        ["Older client event", "Newer client event"].includes(e.title),
      );
      expect(clientEvents.length).toBe(2);
      expect(clientEvents[0]!.title).toBe("Newer client event");
      expect(clientEvents[1]!.title).toBe("Older client event");
    });

    it("excludes internal admin activity", async () => {
      const timeline = await getPortalTimeline({ portalUserId: member.portalUserId, limit: 20 });
      expect(timeline.some((e) => e.title.includes("Internal admin"))).toBe(false);
    });

    it("excludes cross-client events", async () => {
      const timeline = await getPortalTimeline({ portalUserId: member.portalUserId, limit: 20 });
      expect(timeline.every((e) => e.projectId !== projectBId)).toBe(true);
      expect(timeline.some((e) => e.title === "Other client event")).toBe(false);
    });
  });

  describe("Files", () => {
    it("returns only authorized files without storage keys", async () => {
      const files = await getPortalFiles({ portalUserId: member.portalUserId });
      expect(files.length).toBeGreaterThan(0);
      expect(files.every((f) => f.projectId === projectAId)).toBe(true);
      expect(JSON.stringify(files)).not.toContain(storageKey);
      expect(files.every((f) => !("storageKey" in f))).toBe(true);
    });

    it("excludes internal-only deliverable files", async () => {
      const files = await getPortalFiles({ portalUserId: member.portalUserId });
      expect(files.every((f) => !f.name.includes("Internal only"))).toBe(true);
    });

    it("denies cross-project file listing", async () => {
      const files = await getPortalFiles({
        portalUserId: member.portalUserId,
        projectId: projectBId,
      });
      expect(files).toHaveLength(0);
    });
  });

  describe("Documents", () => {
    it("respects proposal access roles", async () => {
      const decisionDocs = await getPortalDocuments(decisionMaker.portalUserId);
      const viewerDocs = await getPortalDocuments(viewer.portalUserId);
      expect(decisionDocs.proposals.some((p) => p.id === proposalId && p.needsDecision)).toBe(
        true,
      );
      expect(viewerDocs.proposals.some((p) => p.id === proposalId && p.needsDecision)).toBe(false);
    });

    it("respects contract access and signature authority", async () => {
      const signatoryDocs = await getPortalDocuments(signatory.portalUserId);
      const viewerDocs = await getPortalDocuments(viewer.portalUserId);
      expect(signatoryDocs.contracts.some((c) => c.id === contractId && c.needsSignature)).toBe(
        true,
      );
      expect(viewerDocs.contracts.some((c) => c.id === contractId && c.needsSignature)).toBe(
        false,
      );
    });

    it("preserves historical accepted/signed records", async () => {
      const docs = await getPortalDocuments(member.portalUserId);
      expect(docs.proposals.some((p) => p.title.includes("Accepted proposal"))).toBe(true);
      expect(docs.contracts.some((c) => c.title.includes("Signed Agreement"))).toBe(true);
    });

    it("hides documents from unauthorized clients", async () => {
      const docs = await getPortalDocuments(otherClient.portalUserId);
      expect(docs.proposals.every((p) => !p.title.includes("Website proposal"))).toBe(true);
    });

    it("hides documents when explicit document access is revoked", async () => {
      await db.agencyProposalClientAccess.updateMany({
        where: { proposalId: proposalId, portalUserId: decisionMaker.portalUserId },
        data: { revokedAt: new Date() },
      });
      const docs = await getPortalDocuments(decisionMaker.portalUserId);
      expect(docs.proposals.every((p) => p.id !== proposalId)).toBe(true);
    });
  });

  describe("Billing", () => {
    it("grants invoice access independently from unrelated project-only users", async () => {
      expect(await hasInvoiceAccess({ invoiceId, portalUserId: billingAdmin.portalUserId })).toBe(
        true,
      );
      expect(await hasInvoiceAccess({ invoiceId, portalUserId: otherClient.portalUserId })).toBe(
        false,
      );
    });

    it("shows Pay CTA only for billing admin", async () => {
      const adminBilling = await getPortalBillingHome(billingAdmin.portalUserId);
      const viewerBilling = await getPortalBillingHome(billingViewer.portalUserId);
      const adminRow = adminBilling.outstanding.find((r) => r.invoice.id === invoiceId);
      const viewerRow = viewerBilling.outstanding.find((r) => r.invoice.id === invoiceId);
      expect(adminRow?.role).toBe("BILLING_ADMIN");
      expect(viewerRow?.role).toBe("VIEWER");

      const adminAttention = await getPortalAttentionItems(billingAdmin.portalUserId, 20);
      const viewerAttention = await getPortalAttentionItems(billingViewer.portalUserId, 20);
      expect(adminAttention.find((a) => a.id === `invoice-${invoiceId}`)?.canAct).toBe(true);
      expect(viewerAttention.find((a) => a.id === `invoice-${invoiceId}`)?.canAct).toBe(false);
    });
  });

  describe("Same-company isolation", () => {
    it("returns nothing without explicit access", async () => {
      expect(await listAccessibleProjectIds(sameCompanyNoAccess.portalUserId)).toHaveLength(0);
      const home = await getPortalHome(sameCompanyNoAccess.portalUserId);
      expect(home.projects).toHaveLength(0);
      expect(home.attention).toHaveLength(0);
      expect(await getPortalFiles({ portalUserId: sameCompanyNoAccess.portalUserId })).toHaveLength(
        0,
      );
    });
  });

  describe("Revocation", () => {
    async function assertRevoked(portalUserId: string) {
      expect(await listAccessibleProjectIds(portalUserId)).not.toContain(projectAId);
      const home = await getPortalHome(portalUserId);
      expect(home.projects.every((p) => p.id !== projectAId)).toBe(true);
      expect((await getPortalAttentionItems(portalUserId, 30)).every((a) => a.projectId !== projectAId)).toBe(true);
      expect((await listPortalProjects(portalUserId)).every((p) => p.id !== projectAId)).toBe(true);
      expect((await getPortalApprovals(portalUserId)).pending.every((p) => p.projectName !== `${PREFIX} Project A`)).toBe(true);
      expect((await getPortalFiles({ portalUserId })).every((f) => f.projectId !== projectAId)).toBe(true);
      const timeline = await getPortalTimeline({ portalUserId, limit: 20 });
      expect(timeline.every((e) => e.projectId !== projectAId)).toBe(true);
    }

    it("immediately stops exposing revoked resources across portal surfaces", async () => {
      await db.agencyProjectClientAccess.updateMany({
        where: { projectId: projectAId, portalUserId: member.portalUserId },
        data: { revokedAt: new Date() },
      });
      await assertRevoked(member.portalUserId);
    });
  });
});
