import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  cleanupCrmIntegrationFixtures,
  createBarrier,
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "./db";
import {
  createEmailSequenceFixture,
  createIntegrationAdmin,
  createIntegrationContact,
  createTaskSequenceFixture,
  ensureOutreachSettings,
} from "./fixtures";
import { hasIntegrationDatabase } from "./guard";
import { runSequenceSchedulerWithDeps } from "@/lib/crm/sequences/scheduler-runner";
import type { SendTransactionalEmailResult } from "@/lib/email/types";

const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function waitForPaused(gate: ReturnType<typeof createBarrier>, timeoutMs = 8000) {
  const start = Date.now();
  while (!gate.isPaused()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for scheduler claim hook.");
    }
    await new Promise((r) => setImmediate(r));
  }
}

describeIntegration("CRM scheduler — live DB concurrency", () => {
  let db: PrismaClient;
  let adminId: string;
  let sendCalls: string[] = [];

  beforeAll(async () => {
    db = getIntegrationPrisma();
    await ensureOutreachSettings(db);
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    sendCalls = [];
    await cleanupCrmIntegrationFixtures(db);
    await db.crmOutreachSettings.update({
      where: { id: "outreach" },
      data: { outreachPaused: false, maxDailySequenceEmails: 100 },
    });
  });

  afterAll(async () => {
    await cleanupCrmIntegrationFixtures(db);
    await disconnectIntegrationPrisma();
  });

  function mockSend(waitBarrier?: ReturnType<typeof createBarrier>) {
    return async (): Promise<SendTransactionalEmailResult> => {
      sendCalls.push(`send-${sendCalls.length + 1}`);
      if (waitBarrier?.isPaused()) {
        await waitBarrier.pause();
      }
      return { success: true, messageId: `msg-${sendCalls.length}`, provider: "smtp" };
    };
  }

  it("allows exactly one worker to claim a due execution", async () => {
    const contact = await createIntegrationContact(db, adminId);
    const { execution } = await createEmailSequenceFixture(db, adminId, contact.id);
    const gate = createBarrier();

    const transport = async () => ({
      kind: "smtp" as const,
      config: {
        host: "test",
        port: 587,
        securityMode: "STARTTLS" as const,
        username: null,
        password: null,
        fromName: "Test",
        fromEmail: "test@test.local",
        replyToEmail: null,
      },
    });

    const run = () =>
      runSequenceSchedulerWithDeps({
        db,
        sendEmail: mockSend(),
        resolveTransport: transport,
        hooks: {
          afterClaim: async () => {
            await gate.pause();
          },
        },
      });

    const p1 = run();
    await waitForPaused(gate);
    const p2 = run();
    gate.resume();
    const [r1, r2] = await Promise.all([p1, p2]);

    const updated = await db.crmSequenceExecution.findUniqueOrThrow({
      where: { id: execution.id },
    });

    expect(updated.status).toBe("SENT");
    expect(sendCalls.length).toBe(1);
    expect(r1.sent + r2.sent).toBe(1);
  });

  it("blocks send when contact suppressed after claim", async () => {
    const contact = await createIntegrationContact(db, adminId);
    const { execution, enrollment } = await createEmailSequenceFixture(
      db,
      adminId,
      contact.id,
    );

    await runSequenceSchedulerWithDeps({
      db,
      sendEmail: mockSend(),
      resolveTransport: async () => ({
        kind: "smtp" as const,
        config: {
          host: "test",
          port: 587,
          securityMode: "STARTTLS" as const,
          username: null,
          password: null,
          fromName: "Test",
          fromEmail: "test@test.local",
          replyToEmail: null,
        },
      }),
      hooks: {
        afterClaim: async () => {
          await db.crmContact.update({
            where: { id: contact.id },
            data: { emailStatus: "DO_NOT_EMAIL" },
          });
        },
      },
    });

    expect(sendCalls.length).toBe(0);
    const updated = await db.crmSequenceExecution.findUniqueOrThrow({
      where: { id: execution.id },
    });
    expect(updated.status).toBe("SKIPPED");
    const en = await db.crmSequenceEnrollment.findUniqueOrThrow({
      where: { id: enrollment.id },
    });
    expect(en.status).toBe("STOPPED");
  });

  it("creates exactly one task for concurrent task-step processing", async () => {
    const contact = await createIntegrationContact(db, adminId);
    await createTaskSequenceFixture(db, adminId, contact.id);

    await Promise.all([
      runSequenceSchedulerWithDeps({
        db,
        resolveTransport: async () => ({ kind: "none" }),
      }),
      runSequenceSchedulerWithDeps({
        db,
        resolveTransport: async () => ({ kind: "none" }),
      }),
    ]);

    const tasks = await db.crmTask.findMany({
      where: { contactId: contact.id, title: { startsWith: "[crm-it]" } },
    });
    expect(tasks.length).toBe(1);
  });

  it("does not auto-resend after SMTP success + finalization failure", async () => {
    const contact = await createIntegrationContact(db, adminId);
    const { execution } = await createEmailSequenceFixture(db, adminId, contact.id);

    await runSequenceSchedulerWithDeps({
      db,
      sendEmail: mockSend(),
      resolveTransport: async () => ({
        kind: "smtp" as const,
        config: {
          host: "test",
          port: 587,
          securityMode: "STARTTLS" as const,
          username: null,
          password: null,
          fromName: "Test",
          fromEmail: "test@test.local",
          replyToEmail: null,
        },
      }),
      hooks: {
        beforeFinalize: async () => {
          throw new Error("Simulated DB finalization failure");
        },
      },
    });

    expect(sendCalls.length).toBe(1);
    const updated = await db.crmSequenceExecution.findUniqueOrThrow({
      where: { id: execution.id },
    });
    expect(updated.status).toBe("AMBIGUOUS");

    sendCalls = [];
    await runSequenceSchedulerWithDeps({
      db,
      sendEmail: mockSend(),
      resolveTransport: async () => ({
        kind: "smtp" as const,
        config: {
          host: "test",
          port: 587,
          securityMode: "STARTTLS" as const,
          username: null,
          password: null,
          fromName: "Test",
          fromEmail: "test@test.local",
          replyToEmail: null,
        },
      }),
    });

    expect(sendCalls.length).toBe(0);
  });

  it("recovers stale PROCESSING executions safely", async () => {
    const contact = await createIntegrationContact(db, adminId);
    const { execution } = await createEmailSequenceFixture(db, adminId, contact.id);

    await db.crmSequenceExecution.update({
      where: { id: execution.id },
      data: {
        status: "PROCESSING",
        claimedAt: new Date(Date.now() - 10 * 60 * 1000),
        claimExpiresAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    });

    const result = await runSequenceSchedulerWithDeps({
      db,
      resolveTransport: async () => ({ kind: "none" }),
    });

    expect(result.staleRecovered).toBeGreaterThan(0);
    const updated = await db.crmSequenceExecution.findUniqueOrThrow({
      where: { id: execution.id },
    });
    expect(updated.status).toBe("PENDING");
  });
});
