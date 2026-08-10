import type { CrmPropertyDefinition, Prisma } from "@prisma/client";

export type PropertyTransactionClient = Prisma.TransactionClient;

type DefinitionLockHook = (definitionId: string) => Promise<void> | void;

/** Test-only hook invoked after acquiring a definition row lock. */
let definitionLockHook: DefinitionLockHook | null = null;

export function setPropertyDefinitionLockHook(hook: DefinitionLockHook | null) {
  definitionLockHook = hook;
}

export function clearPropertyDefinitionLockHook() {
  definitionLockHook = null;
}

/**
 * Acquire a row-level lock on the property definition and return the authoritative row.
 * Must be called inside an open transaction.
 */
export async function lockContactPropertyDefinition(
  tx: PropertyTransactionClient,
  definitionId: string,
): Promise<CrmPropertyDefinition> {
  await tx.$queryRaw`
    SELECT "id"
    FROM "CrmPropertyDefinition"
    WHERE "id" = ${definitionId}
    FOR UPDATE
  `;

  const def = await tx.crmPropertyDefinition.findUniqueOrThrow({
    where: { id: definitionId },
  });

  if (definitionLockHook) {
    await definitionLockHook(definitionId);
  }

  return def;
}

/**
 * Lock multiple property definitions in stable ascending id order (deadlock avoidance).
 */
export async function lockContactPropertyDefinitions(
  tx: PropertyTransactionClient,
  definitionIds: string[],
): Promise<Map<string, CrmPropertyDefinition>> {
  const uniqueSorted = [...new Set(definitionIds)].sort();
  const map = new Map<string, CrmPropertyDefinition>();
  for (const id of uniqueSorted) {
    map.set(id, await lockContactPropertyDefinition(tx, id));
  }
  return map;
}

export async function countPropertyValuesInTx(
  tx: PropertyTransactionClient,
  definitionId: string,
): Promise<number> {
  return tx.crmContactPropertyValue.count({ where: { definitionId } });
}
