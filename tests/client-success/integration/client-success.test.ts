import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import { createProject } from "@/lib/agency/projects";
import { createManagedWebsite, createCareEvent } from "@/lib/client-success/websites";
import {
  createSupportRequest,
  addClientSupportMessage,
  confirmSupportResolution,
  stillNeedHelp,
  markSupportWaitingOnClient,
  resolveSupportRequest,
  linkSupportToChangeRequest,
} from "@/lib/client-success/support";
import {
  grantWebsiteAccess,
  revokeWebsiteAccess,
  listAccessibleWebsiteIds,
} from "@/lib/client-success/website-access";
import { listPortalWebsites, getPortalWebsiteDetail, listPortalWebsiteCareEvents } from "@/lib/portal/websites";
import { listPortalSupportHome, getPortalSupportDetail } from "@/lib/portal/support";
import { getPortalAttentionItems } from "@/lib/portal/attention";
import { getPortalHome } from "@/lib/portal/home";
import { getPortalTimeline } from "@/lib/portal/timeline";
import { canAccessAgencyFile } from "@/lib/agency/files";
import { uploadAgencyFile } from "@/lib/agency/files";
import { generateSupportRequestNumber } from "@/lib/client-success/support-number";

const PREFIX = "[client-success-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanup(db: PrismaClient) {
  await db.agencySupportRequestFile.deleteMany({
    where: { supportRequest: { website: { name: { startsWith: PREFIX } } } },
  });
  await db.agencySupportMessage.deleteMany({
    where: { supportRequest: { website: { name: { startsWith: PREFIX } } } },
  });
  await db.agencySupportRequest.deleteMany({
    where: { website: { name: { startsWith: PREFIX } } },
  });
  await db.agencyWebsiteCareEvent.deleteMany({
    where: { website: { name: { startsWith: PREFIX } } },
  });
  await db.agencyManagedWebsiteClientAccess.deleteMany({
    where: { website: { name: { startsWith: PREFIX } } },
  });
  await db.agencyManagedWebsite.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.agencyProjectFile.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectClientAccess.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProject.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await db.clientPortalUser.deleteMany({
    where: { contact: { sourceDetail: { startsWith: PREFIX } } },
  });
  await db.crmContact.deleteMany({ where: { sourceDetail: { startsWith: PREFIX } } });
  await db.crmCompany.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

async function createPortalUser(db: PrismaClient, adminId: string, companyId: string, label: string) {
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

describeIntegration("Client Success V1 live acceptance", () => {
  let db: PrismaClient;
  let adminId: string;
  let companyId: string;
  let member: { contactId: string; portalUserId: string };
  let viewer: { contactId: string; portalUserId: string };
  let otherClient: { contactId: string; portalUserId: string };
  let sameCompanyNoAccess: { contactId: string; portalUserId: string };
  let projectId: string;
  let websiteId: string;

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

    member = await createPortalUser(db, adminId, companyId, "member");
    viewer = await createPortalUser(db, adminId, companyId, "viewer");
    otherClient = await createPortalUser(db, adminId, companyId, "other");
    sameCompanyNoAccess = await createPortalUser(db, adminId, companyId, "no-access");

    const project = await createProject({
      name: `${PREFIX} Launch Project`,
      primaryContactId: member.contactId,
      clientCompanyId: companyId,
      serviceType: "WEBSITE_DESIGN",
      ownerId: adminId,
      createdById: adminId,
    });
    if (!project) throw new Error("Failed to create project");
    projectId = project.id;

    const website = await createManagedWebsite({
      name: `${PREFIX} Acme Properties`,
      domain: `acme-${Date.now()}.example.com`,
      productionUrl: "https://acme.example.com",
      companyId,
      primaryProjectId: projectId,
      careStatus: "ACTIVE",
      carePlanName: "Website Care",
      createdById: adminId,
    });
    websiteId = website.id;

    await grantWebsiteAccess({
      websiteId,
      contactId: member.contactId,
      role: "MEMBER",
      grantedById: adminId,
    });
    await grantWebsiteAccess({
      websiteId,
      contactId: viewer.contactId,
      role: "VIEWER",
      grantedById: adminId,
    });
  });

  it("lists only authorized managed websites", async () => {
    const websites = await listPortalWebsites(member.portalUserId);
    expect(websites.some((w) => w.id === websiteId)).toBe(true);
    expect(websites[0]?.domain).not.toContain("http");
  });

  it("denies same-company user without website grant", async () => {
    const websites = await listPortalWebsites(sameCompanyNoAccess.portalUserId);
    expect(websites).toHaveLength(0);
    expect(await getPortalWebsiteDetail(sameCompanyNoAccess.portalUserId, websiteId)).toBeNull();
  });

  it("denies cross-client website access", async () => {
    const otherWebsite = await createManagedWebsite({
      name: `${PREFIX} Other Site`,
      domain: `other-${Date.now()}.example.com`,
      createdById: adminId,
    });
    await grantWebsiteAccess({
      websiteId: otherWebsite.id,
      contactId: otherClient.contactId,
      role: "MEMBER",
      grantedById: adminId,
    });

    const memberSites = await listPortalWebsites(member.portalUserId);
    expect(memberSites.some((w) => w.id === otherWebsite.id)).toBe(false);
  });

  it("revokes website access immediately", async () => {
    await revokeWebsiteAccess({ websiteId, contactId: member.contactId });
    expect(await listAccessibleWebsiteIds(member.portalUserId)).not.toContain(websiteId);
    expect(await listPortalWebsites(member.portalUserId)).toHaveLength(0);
  });

  it("website DTO excludes internal notes", async () => {
    await createCareEvent({
      websiteId,
      type: "MAINTENANCE",
      title: "Hidden notes event",
      clientSummary: "Maintenance completed",
      internalNotes: "SSH key rotated — secret",
      performedById: adminId,
      clientVisible: true,
      completedAt: new Date(),
    });

    const events = await listPortalWebsiteCareEvents(member.portalUserId, websiteId);
    expect(events.some((e) => e.summary?.includes("SSH"))).toBe(false);
    expect(JSON.stringify(events)).not.toContain("internalNotes");
  });

  it("generates unique concurrent support numbers", async () => {
    const numbers = await Promise.all(
      Array.from({ length: 20 }, () => generateSupportRequestNumber()),
    );
    expect(new Set(numbers).size).toBe(20);
    numbers.forEach((n) => expect(n).toMatch(/^SUP-\d{4}-\d{4,}$/));
  });

  it("creates support request with session identity", async () => {
    const sr = await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "TECHNICAL_ISSUE",
      priority: "NORMAL",
      subject: "Form not sending",
      description: "Contact form fails on submit.",
    });

    expect(sr.supportNumber).toMatch(/^SUP-/);
    expect(sr.submittedByPortalUserId).toBe(member.portalUserId);
    expect(sr.status).toBe("OPEN");
  });

  it("viewer cannot create support via domain guard", async () => {
    await expect(
      createSupportRequest({
        websiteId,
        portalUserId: viewer.portalUserId,
        contactId: viewer.contactId,
        category: "QUESTION",
        priority: "NORMAL",
        subject: "Question",
        description: "Should fail for viewer.",
      }),
    ).rejects.toThrow(/permission/i);
  });

  it("rejects support for unauthorized website", async () => {
    const otherWebsite = await createManagedWebsite({
      name: `${PREFIX} Locked Site`,
      domain: `locked-${Date.now()}.example.com`,
      createdById: adminId,
    });

    await expect(
      createSupportRequest({
        websiteId: otherWebsite.id,
        portalUserId: member.portalUserId,
        contactId: member.contactId,
        category: "QUESTION",
        priority: "NORMAL",
        subject: "Spoof",
        description: "Should be rejected.",
      }),
    ).rejects.toThrow(/permission/i);
  });

  it("client can reply and waiting-on-client attention appears", async () => {
    const sr = await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "TECHNICAL_ISSUE",
      priority: "NORMAL",
      subject: "Need help",
      description: "Issue details.",
    });

    await markSupportWaitingOnClient({
      supportRequestId: sr.id,
      adminUserId: adminId,
      message: "Please send a screenshot.",
    });

    const attention = await getPortalAttentionItems(member.portalUserId, 20);
    expect(attention.some((a) => a.type === "SUPPORT_WAITING_ON_CLIENT")).toBe(true);

    await addClientSupportMessage({
      supportRequestId: sr.id,
      portalUserId: member.portalUserId,
      body: "Screenshot attached.",
    });

    const updated = await db.agencySupportRequest.findUniqueOrThrow({ where: { id: sr.id } });
    expect(updated.status).toBe("OPEN");
    expect(updated.waitingOn).toBe("SMARTLANCE");
  });

  it("resolves and client confirms closed", async () => {
    const sr = await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "CONTENT_UPDATE",
      priority: "NORMAL",
      subject: "Footer update",
      description: "Update address.",
    });

    await resolveSupportRequest({
      supportRequestId: sr.id,
      adminUserId: adminId,
      message: "Updated the footer.",
    });

    const detail = await getPortalSupportDetail(member.portalUserId, sr.id);
    expect(detail.request.canConfirmResolved).toBe(true);

    await confirmSupportResolution({ supportRequestId: sr.id, portalUserId: member.portalUserId });
    const closed = await db.agencySupportRequest.findUniqueOrThrow({ where: { id: sr.id } });
    expect(closed.status).toBe("CLOSED");
  });

  it("still need help reopens resolved request", async () => {
    const sr = await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "TECHNICAL_ISSUE",
      priority: "NORMAL",
      subject: "Bug",
      description: "Still broken.",
    });

    await resolveSupportRequest({ supportRequestId: sr.id, adminUserId: adminId });
    await stillNeedHelp({
      supportRequestId: sr.id,
      portalUserId: member.portalUserId,
      message: "Still not working.",
    });

    const reopened = await db.agencySupportRequest.findUniqueOrThrow({ where: { id: sr.id } });
    expect(reopened.status).toBe("OPEN");
  });

  it("support change link visible to authorized client without price", async () => {
    const sr = await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "NEW_FEATURE",
      priority: "NORMAL",
      subject: "Booking system",
      description: "Need booking.",
    });

    const cr = await db.agencyChangeRequest.create({
      data: {
        projectId,
        title: `${PREFIX} Booking scope`,
        requestDescription: "New booking module",
        status: "AWAITING_CLIENT_APPROVAL",
        changeRequestNumber: `CR-${Date.now()}`,
        createdById: adminId,
      },
    });

    await linkSupportToChangeRequest({
      supportRequestId: sr.id,
      changeRequestId: cr.id,
      adminUserId: adminId,
    });

    const detail = await getPortalSupportDetail(member.portalUserId, sr.id);
    expect(detail.changeRequest?.needsScopeReview).toBe(true);
    expect(JSON.stringify(detail)).not.toMatch(/amountDueMinor|priceImpactMinor/);
  });

  it("support file access isolated by website grant", async () => {
    const sr = await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "TECHNICAL_ISSUE",
      priority: "NORMAL",
      subject: "With file",
      description: "See attachment.",
    });

    const file = await uploadAgencyFile({
      projectId,
      filename: "screenshot.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-png"),
      createdById: adminId,
    });

    await db.agencySupportRequestFile.create({
      data: {
        supportRequestId: sr.id,
        projectFileId: file.id,
        submittedByPortalUserId: member.portalUserId,
        clientVisible: true,
      },
    });

    expect((await canAccessAgencyFile({ fileId: file.id, portalUserId: member.portalUserId })).ok).toBe(true);
    expect((await canAccessAgencyFile({ fileId: file.id, portalUserId: otherClient.portalUserId })).ok).toBe(false);
  });

  it("portal home includes websites section", async () => {
    const home = await getPortalHome(member.portalUserId);
    expect(home.websites.length).toBeGreaterThan(0);
    expect(home.websites[0]?.name).toContain("Acme");
  });

  it("timeline includes meaningful care and support events", async () => {
    await createCareEvent({
      websiteId,
      type: "MAINTENANCE",
      title: "Maintenance completed",
      clientSummary: "Routine maintenance done",
      performedById: adminId,
      clientVisible: true,
      completedAt: new Date(),
    });

    const sr = await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "QUESTION",
      priority: "NORMAL",
      subject: "Question",
      description: "General question.",
    });

    await resolveSupportRequest({ supportRequestId: sr.id, adminUserId: adminId });

    const timeline = await getPortalTimeline({ portalUserId: member.portalUserId, limit: 20 });
    expect(timeline.some((e) => e.type === "WEBSITE_CARE_COMPLETED")).toBe(true);
    expect(timeline.some((e) => e.type === "SUPPORT_RESOLVED")).toBe(true);
  });

  it("support list groups by status", async () => {
    await createSupportRequest({
      websiteId,
      portalUserId: member.portalUserId,
      contactId: member.contactId,
      category: "QUESTION",
      priority: "NORMAL",
      subject: "Open item",
      description: "Open.",
    });

    const list = await listPortalSupportHome(member.portalUserId);
    expect(list.open.length).toBeGreaterThan(0);
  });
});
