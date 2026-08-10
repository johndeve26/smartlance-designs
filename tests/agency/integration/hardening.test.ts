import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin, createIntegrationContact } from "../../crm/integration/fixtures";
import { createProject } from "@/lib/agency/projects";
import { convertWonDealToProject } from "@/lib/agency/deal-conversion";
import { installStarterTemplates } from "@/lib/agency/templates";
import { hasProjectAccess } from "@/lib/portal/access";
import { parseProjectNumber } from "@/lib/agency/project-number";

const PREFIX = "[agency-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanupAgencyFixtures(db: PrismaClient) {
  await db.agencyDeliverableReview.deleteMany({
    where: { deliverable: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyDeliverableVersion.deleteMany({
    where: { deliverable: { project: { name: { startsWith: PREFIX } } } },
  });
  await db.agencyDeliverable.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectActivity.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectTask.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectMilestone.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectClientAccess.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectMember.deleteMany({
    where: { project: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProject.deleteMany({
    where: { name: { startsWith: PREFIX } },
  });
  await db.agencyProjectTemplateRequirement.deleteMany({
    where: { template: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectTemplateTask.deleteMany({
    where: { template: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectTemplateMilestone.deleteMany({
    where: { template: { name: { startsWith: PREFIX } } },
  });
  await db.agencyProjectTemplate.deleteMany({
    where: {
      OR: [
        { name: { startsWith: PREFIX } },
        { systemKey: { in: ["website-design", "website-redesign", "landing-page", "ecommerce", "seo", "branding", "website-maintenance"] } },
      ],
    },
  });
  await db.crmDeal.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await db.crmContact.deleteMany({ where: { sourceDetail: { startsWith: PREFIX } } });
}

describeIntegration("Agency Operations V1.0.1 — live DB", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    await cleanupAgencyFixtures(db);
  });

  afterAll(async () => {
    await cleanupAgencyFixtures(db);
    await disconnectIntegrationPrisma();
  });

  it("installs starter templates idempotently by systemKey", async () => {
    const first = await installStarterTemplates(adminId);
    expect(first.created).toBe(7);
    expect(first.skipped).toBe(0);

    const second = await installStarterTemplates(adminId);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(7);

    const count = await db.agencyProjectTemplate.count({
      where: { systemKey: { not: null } },
    });
    expect(count).toBe(7);
  });

  it("allocates unique project numbers under concurrent creation", async () => {
    const contact = await db.crmContact.create({
      data: {
        firstName: "Agency",
        lastName: "Client",
        email: `${PREFIX}concurrent-${Date.now()}@example.com`,
        source: "MANUAL",
        sourceDetail: `${PREFIX} concurrent`,
        createdById: adminId,
      },
    });

    const creates = Array.from({ length: 20 }, (_, i) =>
      createProject({
        name: `${PREFIX} Concurrent ${i}`,
        primaryContactId: contact.id,
        serviceType: "OTHER",
        ownerId: adminId,
        createdById: adminId,
      }),
    );

    const results = await Promise.all(creates);
    const numbers = results.map((p) => p?.projectNumber).filter(Boolean) as string[];
    expect(numbers).toHaveLength(20);
    expect(new Set(numbers).size).toBe(20);
    for (const n of numbers) {
      expect(parseProjectNumber(n)).not.toBeNull();
    }
  });

  it("converts a won deal idempotently under concurrent requests", async () => {
    const contact = await createIntegrationContact(db, adminId, {
      email: `${PREFIX}deal-${Date.now()}@example.com`,
    });
    const deal = await db.crmDeal.create({
      data: {
        title: `${PREFIX} Won deal`,
        contactId: contact.id,
        stage: "WON",
        ownerId: adminId,
      },
    });

    const attempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        convertWonDealToProject({ dealId: deal.id, actorUserId: adminId }),
      ),
    );

    const projectIds = new Set(attempts.map((a) => a.project.id));
    expect(projectIds.size).toBe(1);
    expect(attempts.filter((a) => a.created).length).toBe(1);

    const count = await db.agencyProject.count({ where: { sourceDealId: deal.id } });
    expect(count).toBe(1);
  });

  it("denies portal access without explicit project grant (same company)", async () => {
    const company = await db.crmCompany.create({
      data: { name: `${PREFIX} Company`, ownerId: adminId },
    });
    const contactA = await db.crmContact.create({
      data: {
        firstName: "A1",
        lastName: "Contact",
        email: `${PREFIX}a1-${Date.now()}@example.com`,
        companyId: company.id,
        source: "MANUAL",
        sourceDetail: `${PREFIX} portal-a1`,
        createdById: adminId,
      },
    });
    const contactA2 = await db.crmContact.create({
      data: {
        firstName: "A2",
        lastName: "Contact",
        email: `${PREFIX}a2-${Date.now()}@example.com`,
        companyId: company.id,
        source: "MANUAL",
        sourceDetail: `${PREFIX} portal-a2`,
        createdById: adminId,
      },
    });

    const project = await createProject({
      name: `${PREFIX} Portal isolation`,
      primaryContactId: contactA.id,
      clientCompanyId: company.id,
      serviceType: "OTHER",
      ownerId: adminId,
      createdById: adminId,
    });
    if (!project) throw new Error("project missing");

    const portalA = await db.clientPortalUser.create({
      data: {
        contactId: contactA.id,
        email: contactA.email!,
        status: "ACTIVE",
      },
    });
    await db.agencyProjectClientAccess.create({
      data: {
        projectId: project.id,
        contactId: contactA.id,
        portalUserId: portalA.id,
        grantedById: adminId,
      },
    });

    const portalA2 = await db.clientPortalUser.create({
      data: {
        contactId: contactA2.id,
        email: contactA2.email!,
        status: "ACTIVE",
      },
    });

    expect(
      await hasProjectAccess({ projectId: project.id, portalUserId: portalA.id }),
    ).toBe(true);
    expect(
      await hasProjectAccess({ projectId: project.id, portalUserId: portalA2.id }),
    ).toBe(false);
  });
});
