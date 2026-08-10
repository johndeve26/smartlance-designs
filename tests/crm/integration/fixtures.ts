import type { PrismaClient } from "@prisma/client";
import { normalizeCrmEmail } from "@/lib/crm/normalize";
import { getOutreachSettings } from "@/lib/crm/outreach/settings";

const TEST_PREFIX = "[crm-it]";

export async function ensureOutreachSettings(db: PrismaClient) {
  await db.crmOutreachSettings.upsert({
    where: { id: "outreach" },
    create: {
      id: "outreach",
      maxDailySequenceEmails: 100,
      minContactEmailGapHours: 24,
      minStepDelayMinutes: 0,
      sendWeekdaysOnly: false,
      sendWindowStartUtc: 0,
      sendWindowEndUtc: 24,
      outreachPaused: false,
      trackEmailOpens: false,
      trackEmailClicks: true,
    },
    update: {
      minStepDelayMinutes: 0,
      sendWeekdaysOnly: false,
      sendWindowStartUtc: 0,
      sendWindowEndUtc: 24,
      outreachPaused: false,
      trackEmailClicks: true,
    },
  });
  return getOutreachSettings();
}

export async function createIntegrationAdmin(db: PrismaClient) {
  const email = `${TEST_PREFIX}admin-${Date.now()}@test.local`;
  return db.adminUser.create({
    data: {
      name: `${TEST_PREFIX} Admin`,
      email,
      passwordHash: "test-hash-not-used",
      role: "SUPER_ADMIN",
    },
  });
}

export async function createIntegrationContact(
  db: PrismaClient,
  adminId: string,
  overrides?: Partial<{ email: string; emailStatus: "SENDABLE" | "DO_NOT_EMAIL" }>,
) {
  const email = overrides?.email ?? `${TEST_PREFIX}${Date.now()}@example.com`;
  const emailNormalized = normalizeCrmEmail(email) ?? email.trim().toLowerCase();
  return db.crmContact.create({
    data: {
      firstName: "Test",
      lastName: "Contact",
      email,
      emailNormalized,
      emailStatus: overrides?.emailStatus ?? "SENDABLE",
      lifecycleStage: "PROSPECT",
      source: "MANUAL",
      sourceDetail: `${TEST_PREFIX} fixture`,
      createdById: adminId,
    },
  });
}

export async function createEmailSequenceFixture(
  db: PrismaClient,
  adminId: string,
  contactId: string,
) {
  const sequence = await db.crmSequence.create({
    data: {
      name: `${TEST_PREFIX} sequence ${Date.now()}`,
      status: "ACTIVE",
      version: 1,
      createdById: adminId,
      steps: {
        create: [
          {
            position: 0,
            type: "EMAIL",
            delayDays: 0,
            delayMinutes: 0,
            subject: `${TEST_PREFIX} Hello`,
            body: "Hi {{firstName}}",
          },
        ],
      },
    },
    include: { steps: true },
  });

  const step = sequence.steps[0]!;
  const enrollment = await db.crmSequenceEnrollment.create({
    data: {
      sequenceId: sequence.id,
      sequenceVersion: 1,
      contactId,
      status: "ACTIVE",
      currentStep: 0,
      nextRunAt: new Date(Date.now() - 60_000),
      createdById: adminId,
      stopNote: `${TEST_PREFIX} enrollment`,
    },
  });

  const execution = await db.crmSequenceExecution.create({
    data: {
      enrollmentId: enrollment.id,
      stepId: step.id,
      status: "PENDING",
      scheduledAt: new Date(Date.now() - 60_000),
      subjectSnap: `${TEST_PREFIX} Hello`,
      bodySnap: "Hi there",
    },
  });

  return { sequence, step, enrollment, execution };
}

export async function createTaskSequenceFixture(
  db: PrismaClient,
  adminId: string,
  contactId: string,
) {
  const sequence = await db.crmSequence.create({
    data: {
      name: `${TEST_PREFIX} task-seq ${Date.now()}`,
      status: "ACTIVE",
      version: 1,
      createdById: adminId,
      steps: {
        create: [
          {
            position: 0,
            type: "TASK",
            delayDays: 0,
            delayMinutes: 0,
            taskTitle: `${TEST_PREFIX} Review`,
          },
        ],
      },
    },
    include: { steps: true },
  });

  const step = sequence.steps[0]!;
  const enrollment = await db.crmSequenceEnrollment.create({
    data: {
      sequenceId: sequence.id,
      sequenceVersion: 1,
      contactId,
      status: "ACTIVE",
      currentStep: 0,
      nextRunAt: new Date(Date.now() - 60_000),
      createdById: adminId,
      stopNote: `${TEST_PREFIX} task enrollment`,
    },
  });

  const execution = await db.crmSequenceExecution.create({
    data: {
      enrollmentId: enrollment.id,
      stepId: step.id,
      status: "PENDING",
      scheduledAt: new Date(Date.now() - 60_000),
    },
  });

  return { sequence, step, enrollment, execution };
}

export { TEST_PREFIX };
