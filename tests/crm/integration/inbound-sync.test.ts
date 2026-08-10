import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  cleanupCrmIntegrationFixtures,
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "./db";
import {
  createEmailSequenceFixture,
  createIntegrationAdmin,
  createIntegrationContact,
  TEST_PREFIX,
} from "./fixtures";
import {
  buildTestRawEmail,
  createMockInboundProvider,
  ensureInboundSettingsEnabled,
} from "./inbound-fixtures";
import { hasIntegrationDatabase } from "./guard";
import { runInboundEmailSync } from "@/lib/email/inbound/sync";

const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

describeIntegration("CRM inbound sync — live DB", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    await cleanupCrmIntegrationFixtures(db);
    await ensureInboundSettingsEnabled(db, adminId);
  });

  afterAll(async () => {
    await cleanupCrmIntegrationFixtures(db);
    await disconnectIntegrationPrisma();
  });

  it("imports verified thread reply, stops sequence, creates review task", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${TEST_PREFIX}reply@example.com`,
    });
    const lead = await db.crmLead.create({
      data: {
        contactId: contact.id,
        status: "ATTEMPTING",
        temperature: "COLD",
        interestSummary: `${TEST_PREFIX} lead`,
      },
    });
    const outboundMsgId = `${TEST_PREFIX}out-${Date.now()}@crm.test`;
    const outbound = await db.crmEmail.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        origin: "SEQUENCE",
        direction: "OUTBOUND",
        subject: `${TEST_PREFIX} Hello`,
        bodyText: "Hi",
        deliveryStatus: "SENT",
        internetMessageId: outboundMsgId,
        sentAt: new Date(),
        createdById: adminId,
      },
    });
    const { enrollment } = await createEmailSequenceFixture(db, adminId, contact.id);

    const raw = buildTestRawEmail({
      from: contact.email!,
      to: "inbox@test.local",
      subject: `Re: ${TEST_PREFIX} Hello`,
      body: "Thanks for reaching out",
      messageId: `${TEST_PREFIX}in-${Date.now()}@example.com`,
      inReplyTo: outboundMsgId,
    });

    const provider = createMockInboundProvider([{ uid: 101, source: raw }]);
    const result = await runInboundEmailSync({ provider, db });

    expect(result.imported).toBe(1);
    expect(result.verifiedReplies).toBe(1);

    const inbound = await db.crmEmail.findFirst({
      where: { direction: "INBOUND", replyToOutboundId: outbound.id },
    });
    expect(inbound?.matchConfidence).toBe("EXACT_THREAD");
    expect(inbound?.contactId).toBe(contact.id);
    expect(inbound?.leadId).toBe(lead.id);

    const updatedLead = await db.crmLead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(updatedLead.status).toBe("ATTEMPTING");
    expect(updatedLead.temperature).toBe("COLD");

    const updatedEnrollment = await db.crmSequenceEnrollment.findUniqueOrThrow({
      where: { id: enrollment.id },
    });
    expect(updatedEnrollment.status).toBe("STOPPED");
    expect(updatedEnrollment.stopReason).toBe("REPLY_RECEIVED");

    const tasks = await db.crmTask.findMany({
      where: { contactId: contact.id, taskType: "REPLY_REQUIRED", status: "OPEN" },
    });
    expect(tasks.length).toBe(1);
    expect(tasks[0]?.title).toMatch(/^Reply to /);

    const thread = await db.crmEmailThread.findFirst({
      where: { contactId: contact.id },
    });
    expect(thread?.workflowStatus).toBe("NEEDS_REPLY");
    expect(thread?.needsReplySince).toBeTruthy();

    const activities = await db.crmActivity.findMany({
      where: { contactId: contact.id, type: "EMAIL_RECEIVED" },
    });
    expect(activities.length).toBe(1);

    const result2 = await runInboundEmailSync({ provider, db });
    expect(result2.duplicates).toBeGreaterThanOrEqual(1);
    expect(result2.imported).toBe(0);

    const tasksAfter = await db.crmTask.count({
      where: { contactId: contact.id, taskType: "REPLY_REQUIRED", status: "OPEN" },
    });
    expect(tasksAfter).toBe(1);
  });

  it("stores unmatched sender without creating Contact or Lead", async () => {
    const raw = buildTestRawEmail({
      from: `${TEST_PREFIX}unknown@example.com`,
      to: "inbox@test.local",
      subject: `${TEST_PREFIX} Unsolicited`,
      body: "Hello",
      messageId: `${TEST_PREFIX}unknown-${Date.now()}@example.com`,
    });

    const provider = createMockInboundProvider([{ uid: 201, source: raw }]);
    const result = await runInboundEmailSync({ provider, db });

    expect(result.imported).toBe(1);
    const inbound = await db.crmEmail.findFirst({
      where: { fromAddress: { contains: TEST_PREFIX }, direction: "INBOUND" },
    });
    expect(inbound?.reviewStatus).toBe("UNMATCHED");
    expect(inbound?.contactId).toBeNull();

    const contacts = await db.crmContact.count({
      where: { email: { contains: "unknown@example.com" } },
    });
    expect(contacts).toBe(0);
  });

  it("marks automated responses and pauses sequence", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${TEST_PREFIX}ooo@example.com`,
    });
    await createEmailSequenceFixture(db, adminId, contact.id);

    const raw = buildTestRawEmail({
      from: contact.email!,
      to: "inbox@test.local",
      subject: `${TEST_PREFIX} Out of office`,
      body: "I am away",
      messageId: `${TEST_PREFIX}ooo-${Date.now()}@example.com`,
      autoSubmitted: "auto-replied",
    });

    const provider = createMockInboundProvider([{ uid: 301, source: raw }]);
    await runInboundEmailSync({ provider, db });

    const inbound = await db.crmEmail.findFirst({
      where: { fromAddress: contact.email, direction: "INBOUND" },
    });
    expect(inbound?.isAutomated).toBe(true);
    expect(inbound?.reviewStatus).toBe("AUTOMATED");

    const enrollment = await db.crmSequenceEnrollment.findFirst({
      where: { contactId: contact.id },
    });
    expect(enrollment?.status).toBe("PAUSED");
    expect(enrollment?.stopReason).toBe("AUTOMATED_REPLY");
  });
});
