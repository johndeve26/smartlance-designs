import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

vi.mock("@/lib/onboarding/email", () => ({
  sendOnboardingInvitationEmail: vi.fn().mockResolvedValue({ ok: true }),
  sendOnboardingReminderEmail: vi.fn().mockResolvedValue({ ok: true }),
  sendClarificationEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import { createProject } from "@/lib/agency/projects";
import { hasProjectAccess } from "@/lib/portal/access";
import { getPortalProjectOnboarding } from "@/lib/portal/onboarding";
import {
  createOnboardingTemplate,
  addTemplateSection,
  addTemplateQuestion,
  addTemplateRequirement,
  createOnboardingTemplateVersion,
} from "@/lib/onboarding/templates";
import {
  startOnboarding,
  completeOnboarding,
  cancelOnboarding,
} from "@/lib/onboarding/onboarding";
import { runOnboardingReminderScheduler } from "@/lib/onboarding/reminders";
import {
  attachOnboardingFile,
  createRequirement,
  reviewOnboardingResponse,
  reviewRequirement,
  saveOnboardingResponse,
} from "@/lib/agency/requirements";
import { canAccessAgencyFile } from "@/lib/agency/files";
import { ONBOARDING_MAX_AUTOMATIC_REMINDERS } from "@/lib/onboarding/constants";

const PREFIX = "[onboarding-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanupOnboardingFixtures(db: PrismaClient) {
  await db.agencyOnboardingReminder.deleteMany({
    where: { onboarding: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingActivity.deleteMany({
    where: { onboarding: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingFileSubmission.deleteMany({
    where: { onboarding: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingResponse.deleteMany({
    where: { onboarding: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingQuestion.deleteMany({
    where: { onboarding: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingSection.deleteMany({
    where: { onboarding: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyClientRequirement.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectOnboarding.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyOnboardingTemplateQuestion.deleteMany({
    where: { version: { template: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingTemplateRequirement.deleteMany({
    where: { version: { template: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingTemplateSection.deleteMany({
    where: { version: { template: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyOnboardingTemplateVersion.deleteMany({
    where: { template: { name: { startsWith: PREFIX } } },
  });
  await db.agencyOnboardingTemplate.deleteMany({
    where: { name: { startsWith: PREFIX } },
  });
  await db.agencyProjectFile.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
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

async function buildTemplate(adminId: string, label: string) {
  const template = await createOnboardingTemplate({
    name: `${PREFIX} ${label}`,
    createdById: adminId,
  });
  const versionId = template.currentVersionId!;
  const section = await addTemplateSection({
    versionId,
    title: "Business",
  });
  await addTemplateQuestion({
    versionId,
    sectionId: section.id,
    key: "company_name",
    label: "Company name",
    type: "SHORT_TEXT",
    required: true,
  });
  await addTemplateRequirement({
    versionId,
    sectionId: section.id,
    sourceKey: "brand_logo",
    title: "Logo files",
    type: "BRAND_ASSET",
    required: true,
  });
  return { template, versionId, sectionId: section.id };
}

async function buildProject(db: PrismaClient, adminId: string, label: string) {
  const contact = await createIntegrationContact(db, adminId, {
    email: `${PREFIX}${label}-${Date.now()}@example.com`,
  });
  await db.crmContact.update({
    where: { id: contact.id },
    data: { sourceDetail: `${PREFIX} ${label}` },
  });
  const project = await createProject({
    name: `${PREFIX} ${label}`,
    primaryContactId: contact.id,
    serviceType: "OTHER",
    ownerId: adminId,
    createdById: adminId,
  });
  if (!project) throw new Error("project missing");
  return { project, contact };
}

describeIntegration("Agency Onboarding V3 — live PostgreSQL", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    vi.stubEnv("AGENCY_PRIVATE_STORAGE_DRIVER", "local");
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    await cleanupOnboardingFixtures(db);
  });

  afterAll(async () => {
    await cleanupOnboardingFixtures(db);
    await disconnectIntegrationPrisma();
  });

  it("allows exactly one active onboarding under concurrent start", async () => {
    const { versionId } = await buildTemplate(adminId, "concurrent-start");
    const { project } = await buildProject(db, adminId, "concurrent-start");

    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        startOnboarding({
          projectId: project.id,
          templateVersionId: versionId,
          createdById: adminId,
          sendEmail: false,
        }),
      ),
    );

    const fulfilled = attempts.filter((a) => a.status === "fulfilled");
    const rejected = attempts.filter((a) => a.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected.length).toBe(7);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason?.message).toMatch(/already has active onboarding/i);
    }

    const activeCount = await db.agencyProjectOnboarding.count({
      where: {
        projectId: project.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    });
    expect(activeCount).toBe(1);
  });

  it("keeps instantiated onboarding unchanged when template is edited afterward", async () => {
    const { template, versionId } = await buildTemplate(adminId, "snapshot");
    const { project } = await buildProject(db, adminId, "snapshot");

    const started = await startOnboarding({
      projectId: project.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });
    const originalLabel = started!.questions[0]!.label;

    const v2 = await createOnboardingTemplateVersion({
      templateId: template.id,
      createdById: adminId,
      copyFromVersionId: versionId,
    });
    const question = await db.agencyOnboardingTemplateQuestion.findFirst({
      where: { versionId: v2.id, key: "company_name" },
    });
    if (!question) throw new Error("template question missing");

    await db.agencyOnboardingTemplateQuestion.update({
      where: { id: question.id },
      data: { label: "Mutated company name label" },
    });

    const snapshotted = await db.agencyOnboardingQuestion.findMany({
      where: { onboardingId: started!.id },
    });
    expect(snapshotted[0]?.label).toBe(originalLabel);
    expect(snapshotted[0]?.label).not.toBe("Mutated company name label");
  });

  it("denies portal access across projects, same company, and after revocation", async () => {
    const company = await db.crmCompany.create({
      data: { name: `${PREFIX} Portal Co`, ownerId: adminId },
    });
    const contactA = await db.crmContact.create({
      data: {
        firstName: "A",
        lastName: "Client",
        email: `${PREFIX}a-${Date.now()}@example.com`,
        companyId: company.id,
        source: "MANUAL",
        sourceDetail: `${PREFIX} portal-a`,
        createdById: adminId,
      },
    });
    const contactB = await db.crmContact.create({
      data: {
        firstName: "B",
        lastName: "Client",
        email: `${PREFIX}b-${Date.now()}@example.com`,
        companyId: company.id,
        source: "MANUAL",
        sourceDetail: `${PREFIX} portal-b`,
        createdById: adminId,
      },
    });
    const contactSameCo = await db.crmContact.create({
      data: {
        firstName: "C",
        lastName: "SameCo",
        email: `${PREFIX}c-${Date.now()}@example.com`,
        companyId: company.id,
        source: "MANUAL",
        sourceDetail: `${PREFIX} portal-c`,
        createdById: adminId,
      },
    });

    const projectA = await createProject({
      name: `${PREFIX} Project A`,
      primaryContactId: contactA.id,
      clientCompanyId: company.id,
      serviceType: "OTHER",
      ownerId: adminId,
      createdById: adminId,
    });
    const projectB = await createProject({
      name: `${PREFIX} Project B`,
      primaryContactId: contactB.id,
      clientCompanyId: company.id,
      serviceType: "OTHER",
      ownerId: adminId,
      createdById: adminId,
    });
    if (!projectA || !projectB) throw new Error("projects missing");

    const portalA = await db.clientPortalUser.create({
      data: { contactId: contactA.id, email: contactA.email!, status: "ACTIVE" },
    });
    const portalSameCo = await db.clientPortalUser.create({
      data: { contactId: contactSameCo.id, email: contactSameCo.email!, status: "ACTIVE" },
    });

    const access = await db.agencyProjectClientAccess.create({
      data: {
        projectId: projectA.id,
        contactId: contactA.id,
        portalUserId: portalA.id,
        grantedById: adminId,
      },
    });

    const { versionId } = await buildTemplate(adminId, "portal");
    await startOnboarding({
      projectId: projectA.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });

    expect(await getPortalProjectOnboarding(portalA.id, projectA.id)).not.toBeNull();
    await expect(getPortalProjectOnboarding(portalA.id, projectB.id)).rejects.toThrow(
      /do not have access/i,
    );
    expect(
      await hasProjectAccess({ projectId: projectA.id, portalUserId: portalSameCo.id }),
    ).toBe(false);

    await db.agencyProjectClientAccess.update({
      where: { id: access.id },
      data: { revokedAt: new Date() },
    });
    await expect(getPortalProjectOnboarding(portalA.id, projectA.id)).rejects.toThrow(
      /do not have access/i,
    );
  });

  it("rejects stale response review after client edits", async () => {
    const { versionId } = await buildTemplate(adminId, "review-race");
    const { project, contact } = await buildProject(db, adminId, "review-race");
    const portalUser = await db.clientPortalUser.create({
      data: { contactId: contact.id, email: contact.email!, status: "ACTIVE" },
    });

    const started = await startOnboarding({
      projectId: project.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });
    const question = started!.questions[0]!;

    const saved = await saveOnboardingResponse({
      onboardingId: started!.id,
      questionId: question.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
      valueText: "Original answer",
    });
    const staleUpdatedAt = saved.updatedAt;

    await saveOnboardingResponse({
      onboardingId: started!.id,
      questionId: question.id,
      portalUserId: portalUser.id,
      contactId: contact.id,
      valueText: "Updated answer",
    });

    await expect(
      reviewOnboardingResponse({
        responseId: saved.id,
        decision: "ACCEPTED",
        actorUserId: adminId,
        expectedUpdatedAt: staleUpdatedAt,
      }),
    ).rejects.toThrow(/changed since you opened it/i);

    const current = await db.agencyOnboardingResponse.findUniqueOrThrow({
      where: { id: saved.id },
    });
    expect(current.reviewStatus).not.toBe("ACCEPTED");
    expect(current.valueText).toBe("Updated answer");
  });

  it("does not duplicate requirements when project already has same source key", async () => {
    const { versionId } = await buildTemplate(adminId, "dedupe-req");
    const { project } = await buildProject(db, adminId, "dedupe-req");

    await createRequirement({
      projectId: project.id,
      sourceTemplateKey: "brand_logo",
      title: "Existing logo requirement",
      type: "BRAND_ASSET",
      required: true,
    });

    await startOnboarding({
      projectId: project.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });

    const reqs = await db.agencyClientRequirement.findMany({
      where: { projectId: project.id, sourceTemplateKey: "brand_logo" },
    });
    expect(reqs).toHaveLength(1);
  });

  it("handles concurrent requirement review with optimistic locking", async () => {
    const { project } = await buildProject(db, adminId, "req-race");
    const req = await createRequirement({
      projectId: project.id,
      title: "Concurrent requirement",
      type: "CONTENT",
      required: true,
    });

    await db.agencyClientRequirement.update({
      where: { id: req.id },
      data: { status: "SUBMITTED" },
    });

    const snapshot = await db.agencyClientRequirement.findUniqueOrThrow({
      where: { id: req.id },
    });

    await db.agencyClientRequirement.update({
      where: { id: req.id },
      data: { status: "UNDER_REVIEW" },
    });

    await expect(
      reviewRequirement({
        requirementId: req.id,
        decision: "ACCEPTED",
        actorUserId: adminId,
        expectedUpdatedAt: snapshot.updatedAt,
      }),
    ).rejects.toThrow(/changed since you opened it/i);
  });

  it("denies cross-project file access and preserves superseded submission history", async () => {
    const { versionId } = await buildTemplate(adminId, "files");
    const { project: projectA, contact: contactA } = await buildProject(db, adminId, "files-a");
    const { project: projectB, contact: contactB } = await buildProject(db, adminId, "files-b");

    const portalA = await db.clientPortalUser.create({
      data: { contactId: contactA.id, email: contactA.email!, status: "ACTIVE" },
    });
    const portalB = await db.clientPortalUser.create({
      data: { contactId: contactB.id, email: contactB.email!, status: "ACTIVE" },
    });
    await db.agencyProjectClientAccess.createMany({
      data: [
        {
          projectId: projectA.id,
          contactId: contactA.id,
          portalUserId: portalA.id,
          grantedById: adminId,
        },
        {
          projectId: projectB.id,
          contactId: contactB.id,
          portalUserId: portalB.id,
          grantedById: adminId,
        },
      ],
    });

    const startedA = await startOnboarding({
      projectId: projectA.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });
    const requirement = startedA!.requirements[0]!;

    const first = await attachOnboardingFile({
      onboardingId: startedA!.id,
      projectId: projectA.id,
      requirementId: requirement.id,
      portalUserId: portalA.id,
      filename: "logo-v1.png",
      mimeType: "image/png",
      buffer: Buffer.from("png-v1"),
    });

    const second = await attachOnboardingFile({
      onboardingId: startedA!.id,
      projectId: projectA.id,
      requirementId: requirement.id,
      portalUserId: portalA.id,
      filename: "logo-v2.png",
      mimeType: "image/png",
      buffer: Buffer.from("png-v2"),
    });

    const submissions = await db.agencyOnboardingFileSubmission.findMany({
      where: { onboardingId: startedA!.id, requirementId: requirement.id },
      orderBy: { createdAt: "asc" },
    });
    expect(submissions).toHaveLength(2);
    expect(submissions[0]?.supersededAt).not.toBeNull();
    expect(submissions[1]?.supersededAt).toBeNull();

    expect(
      (await canAccessAgencyFile({ fileId: first.file.id, portalUserId: portalA.id })).ok,
    ).toBe(true);
    expect(
      (await canAccessAgencyFile({ fileId: first.file.id, portalUserId: portalB.id })).ok,
    ).toBe(false);

    const fileRow = await db.agencyProjectFile.findUniqueOrThrow({
      where: { id: second.file.id },
    });
    expect(fileRow.storageKey).toContain(projectA.id);
    expect(fileRow.storageKey).not.toContain(projectB.id);
  });

  it("blocks completion with unresolved required items and completes idempotently", async () => {
    const { versionId } = await buildTemplate(adminId, "complete");
    const { project } = await buildProject(db, adminId, "complete");

    const started = await startOnboarding({
      projectId: project.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });

    await expect(
      completeOnboarding({ onboardingId: started!.id, actorUserId: adminId }),
    ).rejects.toThrow(/not complete/i);

    const question = started!.questions[0]!;
    await db.agencyOnboardingResponse.upsert({
      where: {
        onboardingId_questionId: {
          onboardingId: started!.id,
          questionId: question.id,
        },
      },
      create: {
        onboardingId: started!.id,
        questionId: question.id,
        valueText: "Acme",
        reviewStatus: "ACCEPTED",
      },
      update: { valueText: "Acme", reviewStatus: "ACCEPTED" },
    });

    const requirement = started!.requirements[0]!;
    await db.agencyClientRequirement.update({
      where: { id: requirement.id },
      data: { status: "ACCEPTED" },
    });

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        completeOnboarding({ onboardingId: started!.id, actorUserId: adminId }),
      ),
    );
    expect(results.every((r) => r.status === "COMPLETED")).toBe(true);

    const completedCount = await db.agencyProjectOnboarding.count({
      where: { projectId: project.id, status: "COMPLETED" },
    });
    expect(completedCount).toBe(1);
  });

  it("dedupes automatic reminders, enforces max count, and skips closed onboarding", async () => {
    const { versionId } = await buildTemplate(adminId, "reminders");
    const { project: openProject } = await buildProject(db, adminId, "reminders-open");
    const { project: doneProject } = await buildProject(db, adminId, "reminders-done");
    const { project: cancelProject } = await buildProject(db, adminId, "reminders-cancel");

    const open = await startOnboarding({
      projectId: openProject.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });
    const done = await startOnboarding({
      projectId: doneProject.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });
    const cancelledOnboarding = await startOnboarding({
      projectId: cancelProject.id,
      templateVersionId: versionId,
      createdById: adminId,
      sendEmail: false,
    });
    await cancelOnboarding({
      onboardingId: cancelledOnboarding!.id,
      actorUserId: adminId,
    });

    await db.agencyProjectOnboarding.update({
      where: { id: open!.id },
      data: {
        reminderMode: "AUTOMATIC",
        targetCompletionDate: new Date(Date.now() - 86_400_000),
        reminderCount: ONBOARDING_MAX_AUTOMATIC_REMINDERS - 1,
      },
    });
    await db.agencyProjectOnboarding.update({
      where: { id: done!.id },
      data: { reminderMode: "AUTOMATIC", status: "COMPLETED", completedAt: new Date() },
    });

    const parallel = await Promise.all([
      runOnboardingReminderScheduler(new Date("2026-08-09T12:00:00.000Z")),
      runOnboardingReminderScheduler(new Date("2026-08-09T12:00:00.000Z")),
    ]);

    const sentTotal = parallel[0]!.sent + parallel[1]!.sent;
    expect(sentTotal).toBe(1);

    const reminderRows = await db.agencyOnboardingReminder.count({
      where: {
        onboardingId: open!.id,
        dedupeKey: `auto:${open!.id}:2026-08-09`,
      },
    });
    expect(reminderRows).toBe(1);

    const openRow = await db.agencyProjectOnboarding.findUniqueOrThrow({
      where: { id: open!.id },
    });
    expect(openRow.reminderCount).toBe(ONBOARDING_MAX_AUTOMATIC_REMINDERS);

    const maxed = await runOnboardingReminderScheduler(new Date("2026-08-10T12:00:00.000Z"));
    expect(maxed.sent).toBe(0);

    expect(await db.agencyOnboardingReminder.count({ where: { onboardingId: done!.id } })).toBe(0);
    expect(
      await db.agencyOnboardingReminder.count({ where: { onboardingId: cancelledOnboarding!.id } }),
    ).toBe(0);
  });
});
