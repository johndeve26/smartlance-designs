/**
 * Prospect Experience V1 — Live acceptance suite.
 * Requires TEST_DATABASE_URL (see tests/crm/integration/guard.ts).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import {
  createIntegrationAdmin,
} from "../../crm/integration/fixtures";
import { normalizeCrmEmail } from "@/lib/crm/normalize";
import { findActiveLeadForContact } from "@/lib/crm/leads";
import { createProject } from "@/lib/agency/projects";
import { listAccessibleProjectIds } from "@/lib/portal/access";
import { createProposal } from "@/lib/proposals/proposals";
import {
  grantProposalAccess,
  hasProposalAccess,
  listAccessibleProposals,
} from "@/lib/proposals/portal-access";
import {
  createBrief,
  getBriefForAccess,
  saveBrief,
} from "@/lib/prospect/briefs/service";
import { claimProspectResource } from "@/lib/prospect/claim";
import {
  getReviewForAccess,
  listReviewsForUser,
} from "@/lib/prospect/reviews/service";
import {
  adminRequestClarification,
  getRequestForUser,
  submitProspectRequest,
  respondToClarification,
} from "@/lib/prospect/requests/service";
import { upsertProspectProfile } from "@/lib/prospect/profile";
import { createClaimToken, hashClaimToken } from "@/lib/prospect/tokens";
import { getBriefSectionCount } from "@/lib/prospect/brief/schema";

const PREFIX = "[prospect-live]";
const describeLive = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanup(db: PrismaClient) {
  await db.agencyProspectRequestActivity.deleteMany({
    where: { request: { requestNumber: { startsWith: "PR-" } } },
  });
  await db.agencyProspectRequestMessage.deleteMany({
    where: { request: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalClientAccess.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposalVersion.deleteMany({
    where: { proposal: { title: { startsWith: PREFIX } } },
  });
  await db.agencyProposal.deleteMany({
    where: { title: { startsWith: PREFIX } },
  });
  await db.agencyProspectRequest.deleteMany({
    where: { title: { startsWith: PREFIX } },
  });
  await db.agencyWebsiteBrief.deleteMany({
    where: { title: { startsWith: PREFIX } },
  });
  await db.agencyWebsiteReviewFindingEvidence.deleteMany({
    where: { finding: { review: { normalizedDomain: { startsWith: "prospect-live" } } } },
  });
  await db.agencyWebsiteReviewFinding.deleteMany({
    where: { review: { normalizedDomain: { startsWith: "prospect-live" } } },
  });
  await db.agencyWebsiteReviewEvidence.deleteMany({
    where: { review: { normalizedDomain: { startsWith: "prospect-live" } } },
  });
  await db.agencyWebsiteReviewPage.deleteMany({
    where: { review: { normalizedDomain: { startsWith: "prospect-live" } } },
  });
  await db.agencyWebsiteReview.deleteMany({
    where: { normalizedDomain: { startsWith: "prospect-live" } },
  });
  await db.agencyProjectClientAccess.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProject.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.crmLead.deleteMany({
    where: { contact: { emailNormalized: { contains: "prospect-live" } } },
  });
  await db.subscriber.deleteMany({
    where: { emailNormalized: { contains: "prospect-live" } },
  });
  await db.agencyProspectProfile.deleteMany({
    where: { portalUser: { email: { contains: "prospect-live" } } },
  });
  await db.clientPortalSession.deleteMany({
    where: { portalUser: { email: { contains: "prospect-live" } } },
  });
  await db.clientPortalInvite.deleteMany({
    where: { portalUser: { email: { contains: "prospect-live" } } },
  });
  await db.clientPortalUser.deleteMany({
    where: { email: { contains: "prospect-live" } },
  });
  await db.crmContact.deleteMany({
    where: { emailNormalized: { contains: "prospect-live" } },
  });
  await db.crmCompany.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function createPortalUser(
  db: PrismaClient,
  adminId: string,
  label: string,
  companyId?: string,
) {
  const email = `${PREFIX}${label}-${Date.now()}@test.local`;
  const normalized = normalizeCrmEmail(email)!;
  const contact = await db.crmContact.create({
    data: {
      firstName: "Test",
      lastName: "Prospect",
      email,
      emailNormalized: normalized,
      lifecycleStage: "PROSPECT",
      source: "PROSPECT_WORKSPACE",
      companyId: companyId ?? null,
      createdById: adminId,
    },
  });
  const portalUser = await db.clientPortalUser.create({
    data: { contactId: contact.id, email, status: "ACTIVE" },
  });
  return { contactId: contact.id, portalUserId: portalUser.id, email };
}

describeLive("Prospect V1 live acceptance", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = await getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  afterAll(async () => {
    await cleanup(db);
    await disconnectIntegrationPrisma();
  });

  beforeEach(async () => {
    await cleanup(db);
  });

  // --- IDENTITY ---

  it("anonymous review → authenticated claim", async () => {
    const token = createClaimToken();
    const review = await db.agencyWebsiteReview.create({
      data: {
        websiteUrl: "https://prospect-live-claim.com",
        normalizedDomain: "prospect-live-claim.com",
        claimTokenHash: hashClaimToken(token),
        status: "COMPLETED",
      },
    });

    const { portalUserId } = await createPortalUser(db, adminId, "claim");

    await claimProspectResource({
      type: "review",
      resourceId: review.id,
      claimToken: token,
      portalUserId,
    });

    const listed = await listReviewsForUser(portalUserId);
    expect(listed.some((r) => r.id === review.id)).toBe(true);
  });

  it("claim token replay rejected", async () => {
    const token = createClaimToken();
    const review = await db.agencyWebsiteReview.create({
      data: {
        websiteUrl: "https://prospect-live-replay.com",
        normalizedDomain: "prospect-live-replay.com",
        claimTokenHash: hashClaimToken(token),
        status: "COMPLETED",
      },
    });

    const u1 = await createPortalUser(db, adminId, "replay1");
    const u2 = await createPortalUser(db, adminId, "replay2");

    await claimProspectResource({
      type: "review",
      resourceId: review.id,
      claimToken: token,
      portalUserId: u1.portalUserId,
    });

    await expect(
      claimProspectResource({
        type: "review",
        resourceId: review.id,
        claimToken: token,
        portalUserId: u2.portalUserId,
      }),
    ).rejects.toThrow();
  });

  it("same external identity becomes Client without duplicate ClientPortalUser", async () => {
    const { contactId, portalUserId, email } = await createPortalUser(
      db,
      adminId,
      "convert",
    );

    const project = (await createProject({
      name: `${PREFIX} Client project`,
      primaryContactId: contactId,
      serviceType: "WEBSITE_DESIGN",
      ownerId: adminId,
      createdById: adminId,
    }))!;

    await db.agencyProjectClientAccess.create({
      data: {
        projectId: project.id,
        contactId,
        portalUserId,
        role: "CLIENT_MEMBER",
        grantedById: adminId,
      },
    });

    const users = await db.clientPortalUser.findMany({ where: { contactId } });
    expect(users).toHaveLength(1);
    expect(users[0]!.id).toBe(portalUserId);
    expect(users[0]!.email).toBe(email);

    const projectIds = await listAccessibleProjectIds(portalUserId);
    expect(projectIds).toContain(project.id);
  });

  // --- OWNERSHIP ---

  it("Prospect A cannot read Review/Brief/Request belonging to Prospect B", async () => {
    const token = createClaimToken();
    const review = await db.agencyWebsiteReview.create({
      data: {
        websiteUrl: "https://prospect-live-iso.com",
        normalizedDomain: "prospect-live-iso.com",
        claimTokenHash: hashClaimToken(token),
        status: "COMPLETED",
      },
    });

    const a = await createPortalUser(db, adminId, "owner-a");
    const b = await createPortalUser(db, adminId, "owner-b");

    await claimProspectResource({
      type: "review",
      resourceId: review.id,
      claimToken: token,
      portalUserId: a.portalUserId,
    });

    expect(await getReviewForAccess(review.id, { portalUserId: b.portalUserId })).toBeNull();

    const { briefId, claimToken: briefToken } = await createBrief({});
    await claimProspectResource({
      type: "brief",
      resourceId: briefId,
      claimToken: briefToken!,
      portalUserId: a.portalUserId,
    });
    expect(await getBriefForAccess(briefId, { portalUserId: b.portalUserId })).toBeNull();

    await db.agencyWebsiteBrief.update({
      where: { id: briefId },
      data: { title: `${PREFIX} iso brief`, portalUserId: a.portalUserId },
    });
    const { request } = await submitProspectRequest({
      portalUserId: a.portalUserId,
      briefId,
      submissionIdempotencyKey: "iso-req-1",
      sourceDetail: "WEBSITE_BRIEF",
    });
    expect(await getRequestForUser(request.id, b.portalUserId)).toBeNull();
  });

  it("same company does not grant implicit access", async () => {
    const company = await db.crmCompany.create({
      data: { name: `${PREFIX} Shared Co` },
    });
    const a = await createPortalUser(db, adminId, "co-a", company.id);
    const b = await createPortalUser(db, adminId, "co-b", company.id);

    const review = await db.agencyWebsiteReview.create({
      data: {
        portalUserId: a.portalUserId,
        websiteUrl: "https://prospect-live-co.com",
        normalizedDomain: "prospect-live-co.com",
        status: "COMPLETED",
      },
    });

    expect(await getReviewForAccess(review.id, { portalUserId: b.portalUserId })).toBeNull();
  });

  // --- BRIEF ---

  it("authenticated brief save and reload", async () => {
    const { portalUserId } = await createPortalUser(db, adminId, "brief-save");
    const { briefId } = await createBrief({ portalUserId });

    await saveBrief({
      briefId,
      portalUserId,
      answers: {
        "project-name": `${PREFIX} Save test`,
        "business-name": "Acme",
        "project-type": "redesign",
      },
    });

    const loaded = await getBriefForAccess(briefId, { portalUserId });
    expect(loaded?.answers["project-name"]).toBe(`${PREFIX} Save test`);
    expect(loaded?.totalSectionCount).toBe(getBriefSectionCount());
  });

  it("submitted brief snapshot stays immutable after draft edits", async () => {
    const { portalUserId } = await createPortalUser(db, adminId, "snap");
    const { briefId } = await createBrief({ portalUserId });
    await db.agencyWebsiteBrief.update({
      where: { id: briefId },
      data: {
        title: `${PREFIX} Snapshot test`,
        answersJson: { "project-name": "Original title" },
      },
    });

    const { request } = await submitProspectRequest({
      portalUserId,
      briefId,
      submissionIdempotencyKey: "snap-key-1",
      sourceDetail: "WEBSITE_BRIEF",
    });

    await db.agencyWebsiteBrief.update({
      where: { id: briefId },
      data: { answersJson: { "project-name": "Changed after submit" } },
    });

    const stored = await db.agencyProspectRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
    const snapshotAnswers = (stored.briefSnapshotJson as { answers?: Record<string, string> })
      .answers;
    expect(snapshotAnswers?.["project-name"]).toBe("Original title");
  });

  it("anonymous brief claims correctly", async () => {
    const { briefId, claimToken } = await createBrief({});
    const { portalUserId } = await createPortalUser(db, adminId, "brief-claim");

    await claimProspectResource({
      type: "brief",
      resourceId: briefId,
      claimToken: claimToken!,
      portalUserId,
    });

    expect(await getBriefForAccess(briefId, { portalUserId })).not.toBeNull();
  });

  // --- REQUEST ---

  it("concurrent double submit creates one Request", async () => {
    const { portalUserId } = await createPortalUser(db, adminId, "dbl");
    const { briefId } = await createBrief({ portalUserId });
    await db.agencyWebsiteBrief.update({
      where: { id: briefId },
      data: { title: `${PREFIX} Double`, answersJson: {} },
    });

    const key = "concurrent-key";
    const [r1, r2] = await Promise.all([
      submitProspectRequest({
        portalUserId,
        briefId,
        submissionIdempotencyKey: key,
        sourceDetail: "WEBSITE_BRIEF",
      }),
      submitProspectRequest({
        portalUserId,
        briefId,
        submissionIdempotencyKey: key,
        sourceDetail: "WEBSITE_BRIEF",
      }),
    ]);

    expect(r1.request.id).toBe(r2.request.id);
    expect(
      await db.agencyProspectRequest.count({ where: { submissionIdempotencyKey: key } }),
    ).toBe(1);
  });

  it("CRM handoff dedupes Contact and reuses active Lead", async () => {
    const email = `${PREFIX}crm@test.local`;
    const { portalUserId, contactId } = await createPortalUser(db, adminId, "crm");
    await db.crmContact.update({
      where: { id: contactId },
      data: { emailNormalized: normalizeCrmEmail(email), email },
    });
    await db.clientPortalUser.update({
      where: { id: portalUserId },
      data: { email },
    });

    const { briefId: b1 } = await createBrief({ portalUserId });
    await db.agencyWebsiteBrief.update({
      where: { id: b1 },
      data: { title: `${PREFIX} CRM 1`, answersJson: {} },
    });
    await submitProspectRequest({
      portalUserId,
      briefId: b1,
      submissionIdempotencyKey: "crm-1",
      sourceDetail: "FREE_WEBSITE_REVIEW",
    });

    const { briefId: b2 } = await createBrief({ portalUserId });
    await db.agencyWebsiteBrief.update({
      where: { id: b2 },
      data: { title: `${PREFIX} CRM 2`, answersJson: {} },
    });
    await submitProspectRequest({
      portalUserId,
      briefId: b2,
      submissionIdempotencyKey: "crm-2",
      sourceDetail: "WEBSITE_BRIEF",
    });

    const contacts = await db.crmContact.count({
      where: { emailNormalized: normalizeCrmEmail(email) },
    });
    expect(contacts).toBe(1);

    const leads = await db.crmLead.findMany({ where: { contactId } });
    expect(leads.length).toBeGreaterThanOrEqual(1);
    const active = await findActiveLeadForContact(contactId);
    expect(active).not.toBeNull();
  });

  it("clarification history preserved; prospect DTO has no CRM internals", async () => {
    const { portalUserId } = await createPortalUser(db, adminId, "clar");
    const { briefId } = await createBrief({ portalUserId });
    await db.agencyWebsiteBrief.update({
      where: { id: briefId },
      data: { title: `${PREFIX} Clarify`, answersJson: {} },
    });

    const { request } = await submitProspectRequest({
      portalUserId,
      briefId,
      submissionIdempotencyKey: "clar-key",
      sourceDetail: "PROSPECT_WORKSPACE",
    });

    await adminRequestClarification({
      requestId: request.id,
      adminUserId: adminId,
      body: "Do you have existing content to migrate?",
    });

    await respondToClarification({
      requestId: request.id,
      portalUserId,
      body: "Yes, about 20 blog posts.",
    });

    const detail = await getRequestForUser(request.id, portalUserId);
    expect(detail!.messages).toHaveLength(2);
    expect(JSON.stringify(detail)).not.toMatch(/UNQUALIFIED|DISCOVERY|WON|NEW/);
    expect(detail!.statusLabel).toBe("Being reviewed");
  });

  // --- CRM ---

  it("prospect signup does not create Subscriber", async () => {
    const email = `${PREFIX}nosub@test.local`;
    const { contactId, portalUserId } = await createPortalUser(db, adminId, "nosub");
    await upsertProspectProfile({
      portalUserId,
      firstName: "No",
      lastName: "Sub",
    });
    await db.crmContact.update({
      where: { id: contactId },
      data: { email, emailNormalized: normalizeCrmEmail(email) },
    });

    const subs = await db.subscriber.count({
      where: { emailNormalized: normalizeCrmEmail(email)! },
    });
    expect(subs).toBe(0);
  });

  it("request preserves sourceDetail", async () => {
    const { portalUserId } = await createPortalUser(db, adminId, "src");
    const { briefId } = await createBrief({ portalUserId });
    await db.agencyWebsiteBrief.update({
      where: { id: briefId },
      data: { title: `${PREFIX} Source`, answersJson: {} },
    });

    const { request } = await submitProspectRequest({
      portalUserId,
      briefId,
      submissionIdempotencyKey: "src-key",
      sourceDetail: "FREE_WEBSITE_REVIEW",
    });

    const row = await db.agencyProspectRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
    expect(row.sourceDetail).toBe("FREE_WEBSITE_REVIEW");
  });

  // --- PROPOSAL HANDOFF ---

  it("linked proposal invisible without explicit access; visible after grant", async () => {
    const { portalUserId, contactId } = await createPortalUser(db, adminId, "prop");
    const { briefId } = await createBrief({ portalUserId });
    await db.agencyWebsiteBrief.update({
      where: { id: briefId },
      data: { title: `${PREFIX} Proposal link`, answersJson: {} },
    });

    const { request } = await submitProspectRequest({
      portalUserId,
      briefId,
      submissionIdempotencyKey: "prop-key",
      sourceDetail: "WEBSITE_BRIEF",
    });

    await db.agencyProspectRequest.update({
      where: { id: request.id },
      data: { contactId },
    });

    const { proposalId } = await (async () => {
      const proposal = await createProposal({
        title: `${PREFIX} Proposal link`,
        primaryContactId: contactId,
        sourceProspectRequestId: request.id,
        ownerId: adminId,
        createdById: adminId,
      });
      if (!proposal) throw new Error("proposal create failed");
      return { proposalId: proposal.id };
    })();

    let detail = await getRequestForUser(request.id, portalUserId);
    expect(detail!.linkedProposalId).toBeNull();
    expect(await hasProposalAccess({ proposalId, portalUserId })).toBe(false);
    expect((await listAccessibleProposals(portalUserId)).length).toBe(0);

    await grantProposalAccess({
      proposalId,
      contactId,
      grantedById: adminId,
    });

    detail = await getRequestForUser(request.id, portalUserId);
    expect(detail!.linkedProposalId).toBe(proposalId);
    expect(await hasProposalAccess({ proposalId, portalUserId })).toBe(true);

    const proposal = await db.agencyProposal.findUniqueOrThrow({
      where: { id: proposalId },
    });
    expect(proposal.sourceProspectRequestId).toBe(request.id);
  });

  // --- PROSPECT → CLIENT ---

  it("prospect account alone does not unlock portal projects; grants do", async () => {
    const { portalUserId, contactId } = await createPortalUser(db, adminId, "portal");

    expect(await listAccessibleProjectIds(portalUserId)).toEqual([]);

    const project = (await createProject({
      name: `${PREFIX} Portal unlock`,
      primaryContactId: contactId,
      serviceType: "WEBSITE_DESIGN",
      ownerId: adminId,
      createdById: adminId,
    }))!;

    await db.agencyProjectClientAccess.create({
      data: {
        projectId: project.id,
        contactId,
        portalUserId,
        role: "CLIENT_MEMBER",
        grantedById: adminId,
      },
    });

    expect(await listAccessibleProjectIds(portalUserId)).toContain(project.id);

    const review = await db.agencyWebsiteReview.create({
      data: {
        portalUserId,
        websiteUrl: "https://prospect-live-hist.com",
        normalizedDomain: "prospect-live-hist.com",
        status: "COMPLETED",
      },
    });
    expect((await listReviewsForUser(portalUserId)).some((r) => r.id === review.id)).toBe(
      true,
    );
  });
});
