import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  cleanupCrmIntegrationFixtures,
  createBarrier,
  disconnectIntegrationPrisma,
  getIntegrationPrisma,
} from "./db";
import { createIntegrationAdmin, createIntegrationContact, TEST_PREFIX } from "./fixtures";
import { hasIntegrationDatabase } from "./guard";
import {
  createContactPropertyDefinition,
  updateContactPropertyDefinition,
} from "@/lib/crm/properties/definitions";
import { setContactPropertyValue, setContactPropertyValues } from "@/lib/crm/properties/values";
import {
  clearPropertyDefinitionLockHook,
  setPropertyDefinitionLockHook,
} from "@/lib/crm/properties/lock";
import { PropertyTypeInUseError } from "@/lib/crm/properties/errors";

const describeIntegration = hasIntegrationDatabase() ? describe : describe.skip;

async function waitForPaused(gate: ReturnType<typeof createBarrier>, timeoutMs = 8000) {
  const start = Date.now();
  while (!gate.isPaused()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for definition lock hook.");
    }
    await new Promise((r) => setImmediate(r));
  }
}

const PROPERTY_TEST_KEY_PREFIX = "_crm_it";

async function cleanupPropertyFixtures(db: PrismaClient) {
  await db.crmContactPropertyValue.deleteMany({
    where: { definition: { key: { startsWith: PROPERTY_TEST_KEY_PREFIX } } },
  });
  await db.crmPropertyDefinition.deleteMany({
    where: { key: { startsWith: PROPERTY_TEST_KEY_PREFIX } },
  });
}

describeIntegration("CRM property type concurrency — live PostgreSQL", () => {
  let db: PrismaClient;
  let adminId: string;

  beforeAll(async () => {
    db = getIntegrationPrisma();
    const admin = await createIntegrationAdmin(db);
    adminId = admin.id;
  });

  beforeEach(async () => {
    clearPropertyDefinitionLockHook();
    await cleanupCrmIntegrationFixtures(db);
    await cleanupPropertyFixtures(db);
  });

  afterEach(() => {
    clearPropertyDefinitionLockHook();
  });

  afterAll(async () => {
    await cleanupPropertyFixtures(db);
    await cleanupCrmIntegrationFixtures(db);
    await disconnectIntegrationPrisma();
  });

  async function createNumberProperty() {
    return createContactPropertyDefinition({
      label: `${TEST_PREFIX} Revenue`,
      key: `${TEST_PREFIX}revenue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fieldType: "NUMBER",
      actorId: adminId,
    });
  }

  it("type change wins: concurrent first value sees new DATE type and rejects NUMBER value", async () => {
    const def = await createNumberProperty();
    const contact = await createIntegrationContact(db, adminId);
    const gate = createBarrier();
    let holdTypeChange = true;

    setPropertyDefinitionLockHook(async () => {
      if (holdTypeChange) await gate.pause();
    });

    const typeChange = updateContactPropertyDefinition({
      id: def.id,
      fieldType: "DATE",
      actorId: adminId,
    });

    await waitForPaused(gate);

    const valueWrite = setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: 50000,
    });

    holdTypeChange = false;
    gate.resume();
    await typeChange;

    await expect(valueWrite).rejects.toThrow(/Invalid date/i);

    const updated = await db.crmPropertyDefinition.findUniqueOrThrow({ where: { id: def.id } });
    expect(updated.fieldType).toBe("DATE");

    const values = await db.crmContactPropertyValue.findMany({ where: { definitionId: def.id } });
    expect(values).toHaveLength(0);
  });

  it("value insert wins: type change rejected with PROPERTY_TYPE_IN_USE", async () => {
    const def = await createNumberProperty();
    const contact = await createIntegrationContact(db, adminId);
    const gate = createBarrier();
    let holdValueWrite = true;

    setPropertyDefinitionLockHook(async () => {
      if (holdValueWrite) await gate.pause();
    });

    const valueWrite = setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: 75000,
    });

    await waitForPaused(gate);

    const typeChange = updateContactPropertyDefinition({
      id: def.id,
      fieldType: "DATE",
      actorId: adminId,
    });

    holdValueWrite = false;
    gate.resume();
    await valueWrite;

    await expect(typeChange).rejects.toSatisfy(
      (err: unknown) => err instanceof PropertyTypeInUseError,
    );

    const updated = await db.crmPropertyDefinition.findUniqueOrThrow({ where: { id: def.id } });
    expect(updated.fieldType).toBe("NUMBER");

    const stored = await db.crmContactPropertyValue.findUniqueOrThrow({
      where: { definitionId_contactId: { definitionId: def.id, contactId: contact.id } },
    });
    expect(stored.numberValue?.toString()).toBe("75000");
  });

  it("repeated races preserve invariant across both lock orders", async () => {
    for (let i = 0; i < 20; i++) {
      clearPropertyDefinitionLockHook();
      await cleanupPropertyFixtures(db);

      const def = await createNumberProperty();
      const contact = await createIntegrationContact(db, adminId);
      const gate = createBarrier();
      const typeChangeFirst = i % 2 === 0;
      let hold = true;

      setPropertyDefinitionLockHook(async () => {
        if (hold) await gate.pause();
      });

      const first = typeChangeFirst
        ? updateContactPropertyDefinition({ id: def.id, fieldType: "DATE", actorId: adminId })
        : setContactPropertyValue({
            contactId: contact.id,
            definitionId: def.id,
            rawValue: 12000 + i,
          });

      await waitForPaused(gate);

      const second = typeChangeFirst
        ? setContactPropertyValue({
            contactId: contact.id,
            definitionId: def.id,
            rawValue: 12000 + i,
          })
        : updateContactPropertyDefinition({ id: def.id, fieldType: "DATE", actorId: adminId });

      hold = false;
      gate.resume();

      const [r1, r2] = await Promise.allSettled([first, second]);

      const updated = await db.crmPropertyDefinition.findUniqueOrThrow({ where: { id: def.id } });
      const values = await db.crmContactPropertyValue.findMany({ where: { definitionId: def.id } });

      if (updated.fieldType === "DATE") {
        expect(values).toHaveLength(0);
        expect(r2.status === "rejected" || r1.status === "rejected").toBe(true);
      } else {
        expect(updated.fieldType).toBe("NUMBER");
        expect(values).toHaveLength(1);
        expect(r2.status === "rejected" || r1.status === "rejected").toBe(true);
      }
    }
  });

  it("allows same-type definition edit when values exist", async () => {
    const def = await createNumberProperty();
    const contact = await createIntegrationContact(db, adminId);
    await setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: 100,
    });

    const updated = await updateContactPropertyDefinition({
      id: def.id,
      label: `${TEST_PREFIX} Annual Revenue`,
      actorId: adminId,
    });

    expect(updated.label).toContain("Annual Revenue");
    expect(updated.fieldType).toBe("NUMBER");

    const stored = await db.crmContactPropertyValue.findUniqueOrThrow({
      where: { definitionId_contactId: { definitionId: def.id, contactId: contact.id } },
    });
    expect(stored.numberValue?.toString()).toBe("100");
  });

  it("allows NUMBER → DATE when zero values exist", async () => {
    const def = await createNumberProperty();
    const updated = await updateContactPropertyDefinition({
      id: def.id,
      fieldType: "DATE",
      actorId: adminId,
    });
    expect(updated.fieldType).toBe("DATE");
  });

  it("rejects NUMBER → DATE when a value exists", async () => {
    const def = await createNumberProperty();
    const contact = await createIntegrationContact(db, adminId);
    await setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: 42,
    });

    await expect(
      updateContactPropertyDefinition({
        id: def.id,
        fieldType: "DATE",
        actorId: adminId,
      }),
    ).rejects.toSatisfy((err: unknown) => err instanceof PropertyTypeInUseError);
  });

  it("allows type change after last value deleted", async () => {
    const def = await createNumberProperty();
    const contact = await createIntegrationContact(db, adminId);
    await setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: 99,
    });
    await setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: "",
    });

    const updated = await updateContactPropertyDefinition({
      id: def.id,
      fieldType: "DATE",
      actorId: adminId,
    });
    expect(updated.fieldType).toBe("DATE");
  });

  it("serializes delete-last-value vs type change without corruption", async () => {
    const def = await createNumberProperty();
    const contact = await createIntegrationContact(db, adminId);
    await setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: 55,
    });

    const gate = createBarrier();
    let holdDelete = true;
    setPropertyDefinitionLockHook(async () => {
      if (holdDelete) await gate.pause();
    });

    const deleteValue = setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: "",
    });

    await waitForPaused(gate);

    const typeChange = updateContactPropertyDefinition({
      id: def.id,
      fieldType: "DATE",
      actorId: adminId,
    });

    holdDelete = false;
    gate.resume();

    await Promise.all([deleteValue, typeChange]);

    const updated = await db.crmPropertyDefinition.findUniqueOrThrow({ where: { id: def.id } });
    expect(updated.fieldType).toBe("DATE");
    const count = await db.crmContactPropertyValue.count({ where: { definitionId: def.id } });
    expect(count).toBe(0);
  });

  it("value write validates against locked current type, not stale caller metadata", async () => {
    const def = await createNumberProperty();
    const contact = await createIntegrationContact(db, adminId);
    const gate = createBarrier();
    let holdTypeChange = true;

    setPropertyDefinitionLockHook(async () => {
      if (holdTypeChange) await gate.pause();
    });

    const typeChange = updateContactPropertyDefinition({
      id: def.id,
      fieldType: "DATE",
      actorId: adminId,
    });

    await waitForPaused(gate);

    const valueWrite = setContactPropertyValue({
      contactId: contact.id,
      definitionId: def.id,
      rawValue: 50000,
    });

    holdTypeChange = false;
    gate.resume();
    await typeChange;
    await expect(valueWrite).rejects.toThrow(/Invalid date/i);
  });

  it("bulk writes lock definitions in sorted order without deadlock", async () => {
    const defA = await createContactPropertyDefinition({
      label: `${TEST_PREFIX} Prop A`,
      key: `${TEST_PREFIX}a_${Date.now()}`,
      fieldType: "NUMBER",
      actorId: adminId,
    });
    const defB = await createContactPropertyDefinition({
      label: `${TEST_PREFIX} Prop B`,
      key: `${TEST_PREFIX}b_${Date.now()}`,
      fieldType: "NUMBER",
      actorId: adminId,
    });
    const contact1 = await createIntegrationContact(db, adminId);
    const contact2 = await createIntegrationContact(db, adminId);

    await Promise.all([
      setContactPropertyValues({
        contactId: contact1.id,
        values: [
          { definitionId: defB.id, rawValue: 2 },
          { definitionId: defA.id, rawValue: 1 },
        ],
      }),
      setContactPropertyValues({
        contactId: contact2.id,
        values: [
          { definitionId: defA.id, rawValue: 3 },
          { definitionId: defB.id, rawValue: 4 },
        ],
      }),
    ]);

    const count = await db.crmContactPropertyValue.count({
      where: { definitionId: { in: [defA.id, defB.id] } },
    });
    expect(count).toBe(4);
  });
});

describe("CRM property write path audit", () => {
  it("contact edit and CSV import route through setContactPropertyValue service", async () => {
    const fs = await import("node:fs/promises");
    const [crmActionsSrc, executeSrc] = await Promise.all([
      fs.readFile("lib/admin/crm-actions.ts", "utf8"),
      fs.readFile("lib/crm/import/execute.ts", "utf8"),
    ]);
    expect(crmActionsSrc).toContain("setContactPropertyValues");
    expect(executeSrc).toContain("setContactPropertyValue");
    expect(executeSrc).not.toMatch(/crmContactPropertyValue\.(create|upsert|update|delete)/);

    const valuesSrc = await fs.readFile("lib/crm/properties/values.ts", "utf8");
    expect(valuesSrc).toContain("lockContactPropertyDefinition");
  });
});
