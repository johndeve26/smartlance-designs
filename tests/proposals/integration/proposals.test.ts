import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import { createProposal } from "@/lib/proposals/proposals";
import { sendProposalToClient } from "@/lib/proposals/send";
import { acceptProposal } from "@/lib/proposals/acceptance";
import { convertAcceptedProposalToProject } from "@/lib/proposals/project-conversion";
import { grantProposalAccess, hasProposalAccess } from "@/lib/proposals/portal-access";
import { generateAgencyProposalNumber } from "@/lib/proposals/proposal-number";
import { saveDraftVersion } from "@/lib/proposals/versions";

const PREFIX = "[proposal-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanup(db: PrismaClient) {
  await db.agencyDeliverable.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProject.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.agencyProposalActivity.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalAcceptance.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalClientResponse.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalClientAccess.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalLineItem.deleteMany({
    where: { version: { proposal: { title: { startsWith: PREFIX } } } },
  });
  await db.agencyProposalVersion.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposal.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.clientPortalSession.deleteMany({
    where: { portalUser: { contact: { sourceDetail: { startsWith: PREFIX } } } },
  });
  await db.clientPortalUser.deleteMany({
    where: { contact: { sourceDetail: { startsWith: PREFIX } } },
  });
  await db.crmContact.deleteMany({ where: { email: { contains: PREFIX } } });
}

describeIntegration("Agency Proposals V2 — live DB", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    await cleanup(db);
  });

  afterAll(async () => {
    await cleanup(db);
    await disconnectIntegrationPrisma();
  });

  it("allocates unique proposal numbers concurrently", async () => {
    const numbers = await Promise.all(
      Array.from({ length: 20 }, () => generateAgencyProposalNumber(db)),
    );
    expect(new Set(numbers).size).toBe(20);
  });

  it("accepts proposal with optional items and creates idempotent project", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}${Date.now()}@example.com`,
    });

    const portalUser = await db.clientPortalUser.create({
      data: {
        contactId: contact.id,
        email: contact.email!,
        status: "ACTIVE",
      },
    });

    const proposal = await createProposal({
      title: `${PREFIX} Website`,
      primaryContactId: contact.id,
      ownerId: adminId,
      createdById: adminId,
      currency: "USD",
    });
    expect(proposal).toBeTruthy();

    const version = proposal!.versions[0];
    await saveDraftVersion({
      proposalId: proposal!.id,
      versionId: version.id,
      title: proposal!.title,
      scopeSummary: "Core website scope",
      lineItems: [
        {
          name: "Core",
          quantity: 1,
          unitPrice: 5000,
          type: "SERVICE",
          isOptional: false,
          isSelectedByDefault: false,
          position: 0,
        },
        {
          name: "SEO",
          quantity: 1,
          unitPrice: 800,
          type: "ADD_ON",
          isOptional: true,
          isSelectedByDefault: false,
          position: 1,
        },
      ],
      scopeItems: [],
      deliverables: [],
      sections: [],
    });

    await sendProposalToClient({
      proposalId: proposal!.id,
      actorUserId: adminId,
      contactIds: [contact.id],
      decisionMakerContactId: contact.id,
    });

    const other = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-other-${Date.now()}@example.com`,
    });
    const otherPortal = await db.clientPortalUser.create({
      data: { contactId: other.id, email: other.email!, status: "ACTIVE" },
    });

    expect(
      await hasProposalAccess({
        proposalId: proposal!.id,
        portalUserId: otherPortal.id,
      }),
    ).toBe(false);

    const updatedVersion = await db.agencyProposalVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: { lineItems: true },
    });
    const optionalItem = updatedVersion.lineItems.find((l) => l.isOptional);

    await acceptProposal({
      proposalId: proposal!.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
      selectedOptionalItemIds: optionalItem ? [optionalItem.id] : [],
      termsAcknowledged: true,
    });

    const first = await convertAcceptedProposalToProject({
      proposalId: proposal!.id,
      actorUserId: adminId,
      name: `${PREFIX} Delivery Project`,
    });
    const second = await convertAcceptedProposalToProject({
      proposalId: proposal!.id,
      actorUserId: adminId,
    });
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(first.project.id).toBe(second.project.id);
  });
});
