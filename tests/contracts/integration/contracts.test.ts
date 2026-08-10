import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import { createProposal } from "@/lib/proposals/proposals";
import { saveDraftVersion } from "@/lib/proposals/versions";
import { sendProposalToClient } from "@/lib/proposals/send";
import { acceptProposal } from "@/lib/proposals/acceptance";
import {
  createContractFromAcceptance,
  createManualContract,
} from "@/lib/contracts/contracts";
import { sendContractToSigners } from "@/lib/contracts/send";
import { signContractAsClient } from "@/lib/contracts/signing";
import { voidContract } from "@/lib/contracts/status";
import { generateAgencyContractNumber } from "@/lib/contracts/contract-number";
import { hasContractAccess, grantContractAccess } from "@/lib/contracts/portal-access";
import { createContractVersion } from "@/lib/contracts/versions";

const PREFIX = "[contract-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanup(db: PrismaClient) {
  await db.agencyContractActivity.deleteMany({
    where: { contract: { title: { startsWith: PREFIX } } },
  });
  await db.agencyContractSignature.deleteMany({
    where: { contract: { title: { startsWith: PREFIX } } },
  });
  await db.agencyContractResponse.deleteMany({
    where: { contract: { title: { startsWith: PREFIX } } },
  });
  await db.agencyContractSigner.deleteMany({
    where: { contract: { title: { startsWith: PREFIX } } },
  });
  await db.agencyContractClientAccess.deleteMany({
    where: { contract: { title: { startsWith: PREFIX } } },
  });
  await db.agencyContractVersion.deleteMany({
    where: { contract: { title: { startsWith: PREFIX } } },
  });
  await db.agencyContract.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.agencyContractTemplateVersion.deleteMany({
    where: { template: { name: { startsWith: PREFIX } } },
  });
  await db.agencyContractTemplate.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.agencyProposalActivity.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalAcceptance.deleteMany({
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
  await db.clientPortalUser.deleteMany({
    where: { contact: { email: { contains: PREFIX } } },
  });
  await db.crmContact.deleteMany({ where: { email: { contains: PREFIX } } });
}

describeIntegration("Agency Contracts V2.1 — live DB", () => {
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

  it("allocates unique contract numbers concurrently", async () => {
    const numbers = await Promise.all(
      Array.from({ length: 20 }, () => generateAgencyContractNumber(db)),
    );
    expect(new Set(numbers).size).toBe(20);
  });

  it("rejects contract from unaccepted proposal", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-draft-${Date.now()}@example.com`,
    });
    const proposal = await createProposal({
      title: `${PREFIX} Draft proposal`,
      primaryContactId: contact.id,
      ownerId: adminId,
      createdById: adminId,
      currency: "USD",
    });

    await expect(
      createContractFromAcceptance({
        proposalId: proposal!.id,
        createdById: adminId,
        ownerId: adminId,
        clientSignerContactId: contact.id,
      }),
    ).rejects.toThrow(/accepted/i);
  });

  it("creates contract from acceptance and signs with idempotency", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-sign-${Date.now()}@example.com`,
    });
    const portalUser = await db.clientPortalUser.create({
      data: { contactId: contact.id, email: contact.email!, status: "ACTIVE" },
    });

    const proposal = await createProposal({
      title: `${PREFIX} Accepted proposal`,
      primaryContactId: contact.id,
      ownerId: adminId,
      createdById: adminId,
      currency: "USD",
    });
    const version = proposal!.versions[0];
    await saveDraftVersion({
      proposalId: proposal!.id,
      versionId: version.id,
      title: proposal!.title,
      lineItems: [
        {
          name: "Core",
          quantity: 1,
          unitPrice: 3000,
          type: "SERVICE",
          isOptional: false,
          isSelectedByDefault: false,
          position: 0,
        },
      ],
      scopeItems: [
        { title: "Scope", description: "Website build", position: 0, included: true, clientVisible: true },
      ],
      deliverables: [],
      sections: [],
    });
    await sendProposalToClient({
      proposalId: proposal!.id,
      actorUserId: adminId,
      contactIds: [contact.id],
      decisionMakerContactId: contact.id,
    });
    await acceptProposal({
      proposalId: proposal!.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
      selectedOptionalItemIds: [],
      termsAcknowledged: true,
    });

    const contract = await createContractFromAcceptance({
      proposalId: proposal!.id,
      createdById: adminId,
      ownerId: adminId,
      title: `${PREFIX} Service Agreement`,
      clientSignerContactId: contact.id,
    });
    expect(contract?.proposalAcceptanceId).toBeTruthy();

    await sendContractToSigners({
      contractId: contract!.id,
      actorUserId: adminId,
    });

    const other = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-other-${Date.now()}@example.com`,
    });
    const otherPortal = await db.clientPortalUser.create({
      data: { contactId: other.id, email: other.email!, status: "ACTIVE" },
    });
    expect(
      await hasContractAccess({
        contractId: contract!.id,
        portalUserId: otherPortal.id,
      }),
    ).toBe(false);

    const first = await signContractAsClient({
      contractId: contract!.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
      consentAcknowledged: true,
      typedSignatureName: "Jane Client",
    });
    const second = await signContractAsClient({
      contractId: contract!.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
      consentAcknowledged: true,
      typedSignatureName: "Jane Client",
    });
    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);

    const sigCount = await db.agencyContractSignature.count({
      where: { contractId: contract!.id },
    });
    expect(sigCount).toBe(1);

    const updated = await db.agencyContract.findUniqueOrThrow({
      where: { id: contract!.id },
    });
    expect(updated.status).toBe("SIGNED");
  });

  it("blocks signature after void", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-void-${Date.now()}@example.com`,
    });
    const portalUser = await db.clientPortalUser.create({
      data: { contactId: contact.id, email: contact.email!, status: "ACTIVE" },
    });

    const manual = await createManualContract({
      title: `${PREFIX} Manual void test`,
      createdById: adminId,
      ownerId: adminId,
      content: "Terms",
    });
    await db.agencyContractSigner.create({
      data: {
        contractId: manual!.id,
        contractVersionId: manual!.versions[0]!.id,
        signerType: "CLIENT",
        portalUserId: portalUser.id,
        contactId: contact.id,
        nameSnapshot: contact.displayName ?? "Client",
        emailSnapshot: contact.email!,
        role: "CLIENT_SIGNATORY",
        isRequired: true,
      },
    });
    await grantContractAccess({
      contractId: manual!.id,
      contactId: contact.id,
      role: "CLIENT_SIGNATORY",
      grantedById: adminId,
    });
    await sendContractToSigners({ contractId: manual!.id, actorUserId: adminId });
    await voidContract({
      contractId: manual!.id,
      actorUserId: adminId,
      reason: "Test void",
    });

    await expect(
      signContractAsClient({
        contractId: manual!.id,
        portalUserId: portalUser.id,
        contactId: contact.id,
        consentAcknowledged: true,
        typedSignatureName: "Jane Client",
      }),
    ).rejects.toThrow();
  });

  it("invalidates signatures on new version", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}-v2-${Date.now()}@example.com`,
    });
    const portalUser = await db.clientPortalUser.create({
      data: { contactId: contact.id, email: contact.email!, status: "ACTIVE" },
    });

    const manual = await createManualContract({
      title: `${PREFIX} Version supersession`,
      createdById: adminId,
      ownerId: adminId,
      content: "V1 terms",
    });
    const v1 = manual!.versions[0]!;
    await db.agencyContractSigner.create({
      data: {
        contractId: manual!.id,
        contractVersionId: v1.id,
        signerType: "CLIENT",
        portalUserId: portalUser.id,
        contactId: contact.id,
        nameSnapshot: "Client",
        emailSnapshot: contact.email!,
        role: "CLIENT_SIGNATORY",
        isRequired: true,
      },
    });
    await grantContractAccess({
      contractId: manual!.id,
      contactId: contact.id,
      role: "CLIENT_SIGNATORY",
      grantedById: adminId,
    });
    await sendContractToSigners({ contractId: manual!.id, actorUserId: adminId });

    const v2 = await createContractVersion({
      contractId: manual!.id,
      createdById: adminId,
      sourceVersionId: v1.id,
    });
    await sendContractToSigners({
      contractId: manual!.id,
      versionId: v2.id,
      actorUserId: adminId,
    });

    await expect(
      signContractAsClient({
        contractId: manual!.id,
        portalUserId: portalUser.id,
        contactId: contact.id,
        consentAcknowledged: true,
        typedSignatureName: "Jane Client",
      }),
    ).resolves.toMatchObject({ fullySigned: true });
  });
});
