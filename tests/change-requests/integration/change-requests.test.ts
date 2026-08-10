import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import { createProject } from "@/lib/agency/projects";
import { decimalToMinorUnits } from "@/lib/money/minor-units";
import {
  createChangeRequest,
  saveAssessment,
  sendForClientApproval,
  approveChangeRequest,
  declineChangeRequest,
  approveInScopeChange,
  beginAssessment,
} from "@/lib/change-requests/change-requests";
import { applyChangeRequestToProject } from "@/lib/change-requests/apply";
import { createChangeRequestInvoice } from "@/lib/change-requests/invoices";
import { getProjectCommercialScopeSummary } from "@/lib/change-requests/commercial-summary";
import { generateAgencyChangeRequestNumber } from "@/lib/change-requests/change-request-number";
import { hasChangeRequestApproverAccess } from "@/lib/change-requests/portal-access";

const PREFIX = "[cr-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanup(db: PrismaClient) {
  await db.agencyChangeRequestActivity.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestApplication.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestWorkItem.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestApproval.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestDecision.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestAssessment.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestClientAccess.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyChangeRequestRevision.deleteMany({
    where: { changeRequest: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyProjectTask.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyInvoiceLineItem.deleteMany({
    where: { invoice: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyInvoice.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyChangeRequest.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectClientAccess.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProposalAcceptance.deleteMany({
    where: {
      OR: [
        { proposal: { title: { startsWith: PREFIX } } },
        { contact: { sourceDetail: { startsWith: PREFIX } } },
      ],
    },
  });
  await db.agencyProposalClientAccess.deleteMany({
    where: {
      OR: [
        { proposal: { title: { startsWith: PREFIX } } },
        { contact: { sourceDetail: { startsWith: PREFIX } } },
      ],
    },
  });
  await db.agencyProposalLineItem.deleteMany({
    where: { version: { proposal: { title: { startsWith: PREFIX } } } },
  });
  await db.agencyProposalVersion.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposal.deleteMany({
    where: {
      OR: [
        { title: { startsWith: PREFIX } },
        { primaryContact: { sourceDetail: { startsWith: PREFIX } } },
      ],
    },
  });
  await db.clientPortalUser.deleteMany({
    where: { contact: { sourceDetail: { startsWith: PREFIX } } },
  });
  await db.agencyProject.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.crmContact.deleteMany({ where: { sourceDetail: { startsWith: PREFIX } } });
  await db.crmCompany.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

describeIntegration("change requests integration", () => {
  let db: PrismaClient;
  let adminId: string;
  let contactA: { id: string; portalUserId: string };
  let contactB: { id: string; portalUserId: string };
  let projectId: string;

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

    async function contactWithPortal(label: string) {
      const contact = await createIntegrationContact(db, adminId, {
        email: `${PREFIX}${label}-${Date.now()}@example.com`,
      });
      await db.crmContact.update({
        where: { id: contact.id },
        data: { sourceDetail: `${PREFIX} ${label}`, companyId: company.id },
      });
      const portalUser = await db.clientPortalUser.create({
        data: {
          contactId: contact.id,
          email: contact.email!,
          status: "ACTIVE",
        },
      });
      return { id: contact.id, portalUserId: portalUser.id };
    }

    contactA = await contactWithPortal("a");
    contactB = await contactWithPortal("b");

    const project = await createProject({
      name: `${PREFIX} Project`,
      primaryContactId: contactA.id,
      clientCompanyId: company.id,
      serviceType: "OTHER",
      ownerId: adminId,
      createdById: adminId,
    });
    if (!project) throw new Error("project missing");
    projectId = project.id;
    await db.agencyProjectClientAccess.create({
      data: {
        projectId,
        contactId: contactA.id,
        portalUserId: contactA.portalUserId,
        grantedById: adminId,
      },
    });
  });

  it("allocates unique CR numbers concurrently", async () => {
    const numbers = await Promise.all(
      Array.from({ length: 20 }, () => generateAgencyChangeRequestNumber(db)),
    );
    expect(new Set(numbers).size).toBe(20);
  });

  it("viewer without approver role cannot approve", async () => {
    const cr = await createChangeRequest({
      projectId,
      title: "Extra page",
      requestDescription: "Add landing page",
      origin: "CLIENT",
      createdById: adminId,
      requestedByPortalUserId: contactA.portalUserId,
      requestedByContactId: contactA.id,
      submit: true,
    });
    await beginAssessment({ changeRequestId: cr.id, actorUserId: adminId });
    await saveAssessment({
      changeRequestId: cr.id,
      actorUserId: adminId,
      classification: "OUT_OF_SCOPE",
      priceImpactMinor: 20000000,
      timelineImpactDays: 7,
      clientScopeImpactSummary: "Additional landing page",
    });
    await sendForClientApproval({
      changeRequestId: cr.id,
      actorUserId: adminId,
      approverContactIds: [contactB.id],
    });
    const viewerCanApprove = await hasChangeRequestApproverAccess({
      changeRequestId: cr.id,
      portalUserId: contactA.portalUserId,
    });
    expect(viewerCanApprove).toBe(false);
  });

  it("approver records immutable approval; proposal acceptance unchanged", async () => {
    const acceptance = await db.agencyProposalAcceptance.create({
      data: {
        proposalId: (
          await db.agencyProposal.create({
            data: {
              proposalNumber: `${PREFIX}-PR-1`,
              title: `${PREFIX} Base proposal`,
              companyId: (await db.crmCompany.findFirst({ where: { name: { startsWith: PREFIX } } }))!.id,
              primaryContactId: contactA.id,
              ownerId: adminId,
              createdById: adminId,
              currency: "NGN",
            },
          })
        ).id,
        acceptedVersionId: "dummy",
        portalUserId: contactA.portalUserId,
        contactId: contactA.id,
        acceptedTotal: 1000000,
        currency: "NGN",
        selectedOptionalItemIds: [],
      },
    });
    await db.agencyProject.update({
      where: { id: projectId },
      data: { sourceProposalAcceptanceId: acceptance.id },
    });

    const before = await db.agencyProposalAcceptance.findUniqueOrThrow({
      where: { id: acceptance.id },
    });

    const cr = await createChangeRequest({
      projectId,
      title: "Extra page",
      requestDescription: "Add landing page",
      origin: "ADMIN",
      createdById: adminId,
      submit: true,
    });
    await beginAssessment({ changeRequestId: cr.id, actorUserId: adminId });
    await saveAssessment({
      changeRequestId: cr.id,
      actorUserId: adminId,
      classification: "OUT_OF_SCOPE",
      priceImpactMinor: 20000000,
      timelineImpactDays: 7,
      clientScopeImpactSummary: "Additional landing page",
    });
    await sendForClientApproval({
      changeRequestId: cr.id,
      actorUserId: adminId,
      approverContactIds: [contactA.id],
    });

    await approveChangeRequest({
      changeRequestId: cr.id,
      portalUserId: contactA.portalUserId,
    });

    const approval = await db.agencyChangeRequestApproval.findUniqueOrThrow({
      where: { changeRequestId: cr.id },
    });
    expect(approval.approvedPriceImpactMinor).toBe(20000000);

    const after = await db.agencyProposalAcceptance.findUniqueOrThrow({
      where: { id: acceptance.id },
    });
    expect(after.acceptedTotal.toString()).toBe(before.acceptedTotal.toString());

    const summary = await getProjectCommercialScopeSummary(projectId);
    expect(summary.approvedChangesMinor).toBe(20000000);
    expect(summary.originalAcceptedValueMinor).toBe(
      decimalToMinorUnits(before.acceptedTotal, before.currency),
    );
  });

  it("double invoice create is idempotent", async () => {
    const cr = await createChangeRequest({
      projectId,
      title: "Paid change",
      requestDescription: "Scope add",
      origin: "ADMIN",
      createdById: adminId,
      submit: true,
    });
    await beginAssessment({ changeRequestId: cr.id, actorUserId: adminId });
    const assessment = await saveAssessment({
      changeRequestId: cr.id,
      actorUserId: adminId,
      classification: "OUT_OF_SCOPE",
      priceImpactMinor: 5000000,
    });
    await db.agencyChangeRequest.update({
      where: { id: cr.id },
      data: { status: "APPROVED", approvedAt: new Date(), classification: "OUT_OF_SCOPE" },
    });
    await db.agencyChangeRequestApproval.create({
      data: {
        changeRequestId: cr.id,
        assessmentId: assessment.id,
        portalUserId: contactA.portalUserId,
        contactId: contactA.id,
        clientNameSnapshot: "Client",
        clientEmailSnapshot: "client@test.com",
        approvedPriceImpactMinor: 5000000,
        currency: "NGN",
        consentTextSnapshot: "approved",
      },
    });

    const [a, b] = await Promise.all([
      createChangeRequestInvoice({ changeRequestId: cr.id, createdById: adminId }),
      createChangeRequestInvoice({ changeRequestId: cr.id, createdById: adminId }),
    ]);
    expect(a.id).toBe(b.id);
  });

  it("double apply creates work once", async () => {
    const cr = await createChangeRequest({
      projectId,
      title: "Task add",
      requestDescription: "Add task",
      origin: "ADMIN",
      createdById: adminId,
      submit: true,
    });
    await beginAssessment({ changeRequestId: cr.id, actorUserId: adminId });
    await saveAssessment({
      changeRequestId: cr.id,
      actorUserId: adminId,
      classification: "IN_SCOPE",
      priceImpactMinor: 0,
    });
    await approveInScopeChange({ changeRequestId: cr.id, actorUserId: adminId });
    await db.agencyChangeRequestWorkItem.create({
      data: {
        changeRequestId: cr.id,
        type: "TASK",
        title: "Build extra section",
        position: 0,
      },
    });

    await Promise.all([
      applyChangeRequestToProject({ changeRequestId: cr.id, appliedById: adminId }),
      applyChangeRequestToProject({ changeRequestId: cr.id, appliedById: adminId }),
    ]);

    const tasks = await db.agencyProjectTask.findMany({
      where: { changeRequestId: cr.id },
    });
    expect(tasks).toHaveLength(1);
  });
});
