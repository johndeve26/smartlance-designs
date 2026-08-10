import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { assertSafeIntegrationDatabase } from "./guard";

let pool: Pool | undefined;
let client: PrismaClient | undefined;

export function getIntegrationPrisma(): PrismaClient {
  if (client) return client;
  const url = assertSafeIntegrationDatabase();
  pool = new Pool({ connectionString: url, max: 5 });
  const adapter = new PrismaPg(pool);
  client = new PrismaClient({ adapter, log: ["error"] });
  return client;
}

export async function disconnectIntegrationPrisma() {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

/** Remove CRM outreach test fixtures created during integration tests. */
export async function cleanupCrmIntegrationFixtures(db: PrismaClient) {
  await db.inboundMessageImport.deleteMany({
    where: { mailboxKey: { startsWith: "[crm-it]" } },
  });
  await db.inboundMailboxState.deleteMany({
    where: { mailboxKey: { startsWith: "[crm-it]" } },
  });
  await db.crmEmail.deleteMany({
    where: {
      OR: [
        { subject: { startsWith: "[crm-it]" } },
        { fromAddress: { contains: "[crm-it]" } },
      ],
    },
  });
  await db.crmSequenceExecution.deleteMany({
    where: { subjectSnap: { startsWith: "[crm-it]" } },
  });
  await db.crmSequenceEnrollment.deleteMany({
    where: { stopNote: { startsWith: "[crm-it]" } },
  });
  await db.crmSequenceStep.deleteMany({
    where: { subject: { startsWith: "[crm-it]" } },
  });
  await db.crmSequence.deleteMany({
    where: { name: { startsWith: "[crm-it]" } },
  });
  await db.crmEmailThread.deleteMany({
    where: { subjectNormalized: { startsWith: "[crm-it]" } },
  });
  await db.crmEmailThreadUserState.deleteMany({
    where: { thread: { subjectNormalized: { startsWith: "[crm-it]" } } },
  });
  await db.crmTask.deleteMany({
    where: { title: { startsWith: "[crm-it]" } },
  });
  await db.crmLead.deleteMany({
    where: { interestSummary: { startsWith: "[crm-it]" } },
  });
  await db.crmDeal.deleteMany({
    where: { title: { startsWith: "[crm-it]" } },
  });
  await db.agencyProposalAcceptance.deleteMany({
    where: { proposal: { title: { startsWith: "[contract-it]" } } },
  });
  await db.agencyProposalClientAccess.deleteMany({
    where: { proposal: { title: { startsWith: "[contract-it]" } } },
  });
  await db.agencyProposalLineItem.deleteMany({
    where: { version: { proposal: { title: { startsWith: "[contract-it]" } } } },
  });
  await db.agencyProposalVersion.deleteMany({
    where: { proposal: { title: { startsWith: "[contract-it]" } } },
  });
  await db.agencyProposal.deleteMany({
    where: { title: { startsWith: "[contract-it]" } },
  });
  await db.crmContact.deleteMany({
    where: { sourceDetail: { startsWith: "[crm-it]" } },
  });
  await db.crmActivity.deleteMany({
    where: { subject: { startsWith: "[crm-it]" } },
  });
}

export function createBarrier() {
  let release!: () => void;
  let waitForPause!: Promise<void>;
  let paused = false;

  const reset = () => {
    waitForPause = new Promise<void>((resolve) => {
      release = resolve;
    });
    paused = false;
  };

  reset();

  return {
    async pause() {
      paused = true;
      await waitForPause;
    },
    resume() {
      if (paused) release();
      reset();
    },
    isPaused: () => paused,
  };
}
