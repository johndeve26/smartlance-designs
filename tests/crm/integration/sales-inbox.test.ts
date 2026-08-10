import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  cleanupCrmIntegrationFixtures,
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "./db";
import {
  createIntegrationAdmin,
  createIntegrationContact,
  TEST_PREFIX,
} from "./fixtures";
import { hasIntegrationDatabase } from "./guard";
import { handleVerifiedInboundReply } from "@/lib/crm/inbound/reply-handler";
import {
  closeThread,
  snoozeThread,
  markThreadWaitingOnContact,
  markThreadDeliveryUncertain,
  recomputeThreadWorkflowFromMessages,
  normalizeExpiredSnoozes,
} from "@/lib/crm/inbox/workflow";
import { createThreadFollowUpTask } from "@/lib/crm/inbox/follow-up-tasks";
import { resolveAmbiguousThreadReply } from "@/lib/crm/inbox/reply-delivery";
import { updateLeadStatus } from "@/lib/crm/leads";

const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

describeIntegration("CRM V4.0.1 sales inbox — live DB", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    await cleanupCrmIntegrationFixtures(db);
  });

  afterAll(async () => {
    await cleanupCrmIntegrationFixtures(db);
    await disconnectIntegrationPrisma();
  });

  async function createThreadFixture() {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${TEST_PREFIX}inbox-${Date.now()}@example.com`,
    });
    const lead = await db.crmLead.create({
      data: {
        contactId: contact.id,
        status: "ATTEMPTING",
        temperature: "COLD",
        interestSummary: `${TEST_PREFIX} lead`,
      },
    });
    const thread = await db.crmEmailThread.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        subjectNormalized: `${TEST_PREFIX} Conversation`,
        workflowStatus: "WAITING_ON_CONTACT",
        lastOutboundAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
    return { contact, lead, thread };
  }

  it("verified inbound sets NEEDS_REPLY and one reply task", async () => {
    const { contact, lead, thread } = await createThreadFixture();
    const inbound = await db.crmEmail.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        threadId: thread.id,
        origin: "INBOUND_SYNC",
        direction: "INBOUND",
        subject: "Re: Hello",
        bodyText: "Thanks",
        deliveryStatus: "RECEIVED",
        matchConfidence: "EXACT_THREAD",
        receivedAt: new Date(),
        createdById: adminId,
      },
    });

    await handleVerifiedInboundReply({
      db,
      contactId: contact.id,
      leadId: lead.id,
      threadId: thread.id,
      inboundEmailId: inbound.id,
      subject: inbound.subject,
      bodyText: inbound.bodyText ?? "",
      receivedAt: inbound.receivedAt!,
      actorId: adminId,
      isAutomated: false,
      exactThread: true,
    });

    const updatedThread = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updatedThread.workflowStatus).toBe("NEEDS_REPLY");
    expect(updatedThread.snoozedUntil).toBeNull();

    const updatedLead = await db.crmLead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(updatedLead.status).toBe("ATTEMPTING");
    expect(updatedLead.temperature).toBe("COLD");

    const tasks = await db.crmTask.findMany({
      where: { emailThreadId: thread.id, taskType: "REPLY_REQUIRED", status: "OPEN" },
    });
    expect(tasks.length).toBe(1);

    for (let i = 0; i < 2; i++) {
      await handleVerifiedInboundReply({
        db,
        contactId: contact.id,
        leadId: lead.id,
        threadId: thread.id,
        inboundEmailId: `repeat-${i}`,
        subject: "Re: follow up",
        bodyText: "Also",
        receivedAt: new Date(),
        actorId: adminId,
        isAutomated: false,
        exactThread: true,
      });
    }

    const tasksAfter = await db.crmTask.count({
      where: { emailThreadId: thread.id, taskType: "REPLY_REQUIRED", status: "OPEN" },
    });
    expect(tasksAfter).toBe(1);
  });

  it("confirmed human reply sets WAITING_ON_CONTACT and completes reply task", async () => {
    const { contact, lead, thread } = await createThreadFixture();
    await db.crmEmailThread.update({
      where: { id: thread.id },
      data: { workflowStatus: "NEEDS_REPLY", needsReplySince: new Date() },
    });
    const task = await db.crmTask.create({
      data: {
        title: `${TEST_PREFIX} Reply required`,
        contactId: contact.id,
        leadId: lead.id,
        emailThreadId: thread.id,
        taskType: "REPLY_REQUIRED",
        status: "OPEN",
        createdById: adminId,
        assignedToId: adminId,
      },
    });

    const sentAt = new Date();
    await db.crmEmail.create({
      data: {
        contactId: contact.id,
        threadId: thread.id,
        origin: "THREAD_REPLY",
        direction: "OUTBOUND",
        subject: "Re: Hello",
        bodyText: "Answer",
        deliveryStatus: "SENT",
        sentAt,
        createdById: adminId,
      },
    });

    await markThreadWaitingOnContact({
      db,
      threadId: thread.id,
      outboundAt: sentAt,
      snippet: "Answer",
      actorId: adminId,
    });

    const updatedThread = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updatedThread.workflowStatus).toBe("WAITING_ON_CONTACT");

    const updatedTask = await db.crmTask.findUniqueOrThrow({ where: { id: task.id } });
    expect(updatedTask.status).toBe("COMPLETED");
  });

  it("closed thread reopens on verified inbound", async () => {
    const { contact, lead, thread } = await createThreadFixture();
    await closeThread({ threadId: thread.id, actorId: adminId });

    await handleVerifiedInboundReply({
      db,
      contactId: contact.id,
      leadId: lead.id,
      threadId: thread.id,
      inboundEmailId: "in-1",
      subject: "Re: Hello",
      bodyText: "New message",
      receivedAt: new Date(),
      actorId: adminId,
      isAutomated: false,
      exactThread: true,
    });

    const updated = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updated.workflowStatus).toBe("NEEDS_REPLY");
    expect(updated.closedAt).toBeNull();
  });

  it("snoozed thread unsnoozes on verified inbound", async () => {
    const { contact, lead, thread } = await createThreadFixture();
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 3);
    await snoozeThread({ threadId: thread.id, snoozedUntil: future, actorId: adminId });

    await handleVerifiedInboundReply({
      db,
      contactId: contact.id,
      leadId: lead.id,
      threadId: thread.id,
      inboundEmailId: "in-2",
      subject: "Re: Hello",
      bodyText: "While snoozed",
      receivedAt: new Date(),
      actorId: adminId,
      isAutomated: false,
      exactThread: true,
    });

    const updated = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updated.workflowStatus).toBe("NEEDS_REPLY");
    expect(updated.snoozedUntil).toBeNull();
  });

  it("custom snooze expires to derived state", async () => {
    const { thread } = await createThreadFixture();
    const past = new Date();
    past.setUTCMinutes(past.getUTCMinutes() - 5);
    await db.crmEmailThread.update({
      where: { id: thread.id },
      data: {
        workflowStatus: "SNOOZED",
        snoozedUntil: past,
        lastOutboundAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    await normalizeExpiredSnoozes(db);
    const updated = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updated.workflowStatus).toBe("WAITING_ON_CONTACT");
    expect(updated.snoozedUntil).toBeNull();
  });

  it("SENT_UNCONFIRMED does not complete reply task or set WAITING_ON_CONTACT", async () => {
    const { contact, thread } = await createThreadFixture();
    await db.crmEmailThread.update({
      where: { id: thread.id },
      data: { workflowStatus: "NEEDS_REPLY", needsReplySince: new Date() },
    });
    await db.crmTask.create({
      data: {
        title: `${TEST_PREFIX} Reply required`,
        contactId: contact.id,
        emailThreadId: thread.id,
        taskType: "REPLY_REQUIRED",
        status: "OPEN",
        createdById: adminId,
        assignedToId: adminId,
      },
    });

    const sentAt = new Date();
    const email = await db.crmEmail.create({
      data: {
        contactId: contact.id,
        threadId: thread.id,
        origin: "THREAD_REPLY",
        direction: "OUTBOUND",
        subject: "Re: Hello",
        bodyText: "Maybe sent",
        deliveryStatus: "SENT_UNCONFIRMED",
        sentAt,
        createdById: adminId,
      },
    });

    await markThreadDeliveryUncertain({
      db,
      threadId: thread.id,
      outboundAt: sentAt,
      emailId: email.id,
      actorId: adminId,
    });

    const updatedThread = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updatedThread.workflowStatus).toBe("NEEDS_REVIEW");

    const openReplyTasks = await db.crmTask.count({
      where: { emailThreadId: thread.id, taskType: "REPLY_REQUIRED", status: "OPEN" },
    });
    expect(openReplyTasks).toBe(1);
  });

  it("operator resolves SENT_UNCONFIRMED to WAITING_ON_CONTACT once", async () => {
    const { contact, thread } = await createThreadFixture();
    await db.crmEmailThread.update({
      where: { id: thread.id },
      data: { workflowStatus: "NEEDS_REVIEW" },
    });
    await db.crmTask.create({
      data: {
        title: `${TEST_PREFIX} Reply required`,
        contactId: contact.id,
        emailThreadId: thread.id,
        taskType: "REPLY_REQUIRED",
        status: "OPEN",
        createdById: adminId,
        assignedToId: adminId,
      },
    });

    const email = await db.crmEmail.create({
      data: {
        contactId: contact.id,
        threadId: thread.id,
        origin: "THREAD_REPLY",
        direction: "OUTBOUND",
        subject: "Re: Hello",
        bodyText: "Maybe sent",
        deliveryStatus: "SENT_UNCONFIRMED",
        sentAt: new Date(),
        createdById: adminId,
      },
    });

    await resolveAmbiguousThreadReply({ emailId: email.id, actorId: adminId });

    const resolved = await db.crmEmail.findUniqueOrThrow({ where: { id: email.id } });
    expect(resolved.deliveryStatus).toBe("SENT");

    const updatedThread = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updatedThread.workflowStatus).toBe("WAITING_ON_CONTACT");

    const openReplyTasks = await db.crmTask.count({
      where: { emailThreadId: thread.id, taskType: "REPLY_REQUIRED", status: "OPEN" },
    });
    expect(openReplyTasks).toBe(0);
  });

  it("creates follow-up task from thread without workflow or lead side effects", async () => {
    const { contact, lead, thread } = await createThreadFixture();
    const dueAt = new Date();
    dueAt.setUTCDate(dueAt.getUTCDate() + 1);

    const task = await createThreadFollowUpTask({
      threadId: thread.id,
      dueAt,
      actorId: adminId,
    });

    expect(task.emailThreadId).toBe(thread.id);
    expect(task.contactId).toBe(contact.id);
    expect(task.leadId).toBe(lead.id);
    expect(task.taskType).toBe("FOLLOW_UP");

    const updatedThread = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updatedThread.workflowStatus).toBe("WAITING_ON_CONTACT");

    const updatedLead = await db.crmLead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(updatedLead.status).toBe("ATTEMPTING");
  });

  it("Bad Timing + optional follow-up via domain services", async () => {
    const { contact, lead, thread } = await createThreadFixture();
    const dueAt = new Date();
    dueAt.setUTCDate(dueAt.getUTCDate() + 7);

    await updateLeadStatus({ leadId: lead.id, status: "BAD_TIMING", actorId: adminId });
    await createThreadFollowUpTask({ threadId: thread.id, dueAt, actorId: adminId });

    const updatedLead = await db.crmLead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(updatedLead.status).toBe("BAD_TIMING");

    const followUps = await db.crmTask.count({
      where: { emailThreadId: thread.id, taskType: "FOLLOW_UP", status: "OPEN" },
    });
    expect(followUps).toBe(1);

    const enrollments = await db.crmSequenceEnrollment.count({
      where: { contactId: contact.id, status: "ACTIVE" },
    });
    expect(enrollments).toBe(0);
  });

  it("recompute resolves outbound vs inbound race by message timestamps", async () => {
    const { contact, lead, thread } = await createThreadFixture();
    const base = Date.now();

    await db.crmEmail.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        threadId: thread.id,
        origin: "THREAD_REPLY",
        direction: "OUTBOUND",
        subject: "Re: Hello",
        bodyText: "Our reply",
        deliveryStatus: "SENT",
        sentAt: new Date(base + 1000),
        createdById: adminId,
      },
    });

    await db.crmEmail.create({
      data: {
        contactId: contact.id,
        leadId: lead.id,
        threadId: thread.id,
        origin: "INBOUND_SYNC",
        direction: "INBOUND",
        subject: "Re: Hello",
        bodyText: "Their reply",
        deliveryStatus: "RECEIVED",
        receivedAt: new Date(base + 2000),
        isAutomated: false,
        createdById: adminId,
      },
    });

    await closeThread({ threadId: thread.id, actorId: adminId });

    await recomputeThreadWorkflowFromMessages({
      db,
      threadId: thread.id,
      actorId: adminId,
    });

    const updated = await db.crmEmailThread.findUniqueOrThrow({ where: { id: thread.id } });
    expect(updated.workflowStatus).toBe("NEEDS_REPLY");
  });

  it("concurrent inbound handling does not duplicate reply tasks", async () => {
    const { contact, lead, thread } = await createThreadFixture();

    await Promise.all(
      Array.from({ length: 5 }).map((_, i) =>
        handleVerifiedInboundReply({
          db,
          contactId: contact.id,
          leadId: lead.id,
          threadId: thread.id,
          inboundEmailId: `concurrent-${i}`,
          subject: "Re: Hello",
          bodyText: "Msg",
          receivedAt: new Date(Date.now() + i),
          actorId: adminId,
          isAutomated: false,
          exactThread: true,
        }),
      ),
    );

    const count = await db.crmTask.count({
      where: { emailThreadId: thread.id, taskType: "REPLY_REQUIRED", status: "OPEN" },
    });
    expect(count).toBe(1);
  });
});
