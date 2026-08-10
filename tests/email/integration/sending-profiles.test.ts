import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "../../crm/integration/db";
import { hasIntegrationDatabase } from "../../crm/integration/guard";
import { createIntegrationAdmin } from "../../crm/integration/fixtures";
import { resolveEmailSendingProfile } from "@/lib/email/routing/resolve-profile";
import {
  upsertEmailRoutingRule,
  deleteEmailRoutingRule,
} from "@/lib/repositories/emailRoutingRepository";
import { setDefaultEmailSendingProfile } from "@/lib/repositories/emailSendingProfileRepository";

const PREFIX = "[email-profiles-it]";
const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function cleanup(db: PrismaClient) {
  await db.emailRoutingRule.deleteMany({
    where: { sendingProfile: { slug: { startsWith: PREFIX } } },
  });
  await db.crmEmail.deleteMany({
    where: { fromEmailSnapshot: { contains: PREFIX } },
  });
  await db.emailSendingProfile.deleteMany({
    where: { slug: { startsWith: PREFIX } },
  });
}

describeIntegration("email sending profiles integration", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
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

  it("enforces single default profile via partial unique index", async () => {
    const first = await db.emailSendingProfile.create({
      data: {
        name: `${PREFIX} Default A`,
        slug: `${PREFIX}-default-a`,
        fromName: "A",
        fromEmail: `${PREFIX}-a@test.local`,
        transportType: "SYSTEM_SMTP",
        isActive: true,
        isDefault: true,
      },
    });

    await expect(
      db.emailSendingProfile.create({
        data: {
          name: `${PREFIX} Default B`,
          slug: `${PREFIX}-default-b`,
          fromName: "B",
          fromEmail: `${PREFIX}-b@test.local`,
          transportType: "SYSTEM_SMTP",
          isActive: true,
          isDefault: true,
        },
      }),
    ).rejects.toThrow();

    await setDefaultEmailSendingProfile(first.id, adminId);
    const defaults = await db.emailSendingProfile.findMany({
      where: { isDefault: true },
    });
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.id).toBe(first.id);
  });

  it("routes category to assigned profile and falls back when inactive", async () => {
    const sales = await db.emailSendingProfile.create({
      data: {
        name: `${PREFIX} Sales`,
        slug: `${PREFIX}-sales`,
        fromName: "Sales",
        fromEmail: `${PREFIX}-sales@test.local`,
        transportType: "SYSTEM_SMTP",
        isActive: true,
        isDefault: false,
      },
    });
    const fallback = await db.emailSendingProfile.create({
      data: {
        name: `${PREFIX} Default`,
        slug: `${PREFIX}-default`,
        fromName: "Default",
        fromEmail: `${PREFIX}-default@test.local`,
        transportType: "SYSTEM_SMTP",
        isActive: true,
        isDefault: true,
      },
    });

    await upsertEmailRoutingRule({
      category: "CRM_MANUAL",
      sendingProfileId: sales.id,
      updatedById: adminId,
    });

    const routed = await resolveEmailSendingProfile({ category: "CRM_MANUAL" });
    expect(routed.profileId).toBe(sales.id);
    expect(routed.source).toBe("route");

    await db.emailSendingProfile.update({
      where: { id: sales.id },
      data: { isActive: false },
    });

    const inactiveRoute = await resolveEmailSendingProfile({ category: "CRM_MANUAL" });
    expect(inactiveRoute.profileId).toBe(fallback.id);
    expect(inactiveRoute.source).toBe("fallback_default");
  });

  it("preserves CrmEmail sender snapshot after profile edit", async () => {
    const profile = await db.emailSendingProfile.create({
      data: {
        name: `${PREFIX} Snapshot`,
        slug: `${PREFIX}-snapshot`,
        fromName: "Before",
        fromEmail: `${PREFIX}-before@test.local`,
        transportType: "SYSTEM_SMTP",
        isActive: true,
        isDefault: false,
      },
    });

    const email = await db.crmEmail.create({
      data: {
        origin: "MANUAL",
        subject: "Test",
        bodyText: "Body",
        deliveryStatus: "SENT",
        fromAddress: `${PREFIX}-before@test.local`,
        sendingProfileId: profile.id,
        fromNameSnapshot: "Before",
        fromEmailSnapshot: `${PREFIX}-before@test.local`,
        transportTypeSnapshot: "SYSTEM_SMTP",
        createdById: adminId,
      },
    });

    await db.emailSendingProfile.update({
      where: { id: profile.id },
      data: {
        fromName: "After",
        fromEmail: `${PREFIX}-after@test.local`,
      },
    });

    const stored = await db.crmEmail.findUniqueOrThrow({ where: { id: email.id } });
    expect(stored.fromNameSnapshot).toBe("Before");
    expect(stored.fromEmailSnapshot).toBe(`${PREFIX}-before@test.local`);
    expect(stored.fromAddress).toBe(`${PREFIX}-before@test.local`);
  });

  it("upserts routing rule uniquely per category", async () => {
    const profileA = await db.emailSendingProfile.create({
      data: {
        name: `${PREFIX} Route A`,
        slug: `${PREFIX}-route-a`,
        fromName: "A",
        fromEmail: `${PREFIX}-route-a@test.local`,
        transportType: "SYSTEM_SMTP",
        isActive: true,
      },
    });
    const profileB = await db.emailSendingProfile.create({
      data: {
        name: `${PREFIX} Route B`,
        slug: `${PREFIX}-route-b`,
        fromName: "B",
        fromEmail: `${PREFIX}-route-b@test.local`,
        transportType: "SYSTEM_SMTP",
        isActive: true,
      },
    });

    await upsertEmailRoutingRule({
      category: "INVOICE",
      sendingProfileId: profileA.id,
      updatedById: adminId,
    });
    await upsertEmailRoutingRule({
      category: "INVOICE",
      sendingProfileId: profileB.id,
      updatedById: adminId,
    });

    const rules = await db.emailRoutingRule.findMany({
      where: { category: "INVOICE" },
    });
    expect(rules).toHaveLength(1);
    expect(rules[0]?.sendingProfileId).toBe(profileB.id);

    await deleteEmailRoutingRule("INVOICE");
    const cleared = await db.emailRoutingRule.findMany({
      where: { category: "INVOICE" },
    });
    expect(cleared).toHaveLength(0);
  });
});
