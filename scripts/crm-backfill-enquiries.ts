#!/usr/bin/env npx tsx
/**
 * Optional historical enquiry → CRM backfill.
 * Usage:
 *   npm run crm:backfill:enquiries -- --dry-run
 *   npm run crm:backfill:enquiries
 */
import { prisma } from "@/lib/db";
import { tryIntegrateEnquiryWithCrm } from "@/lib/crm/enquiry-integration";
import { normalizeCrmEmail } from "@/lib/crm/normalize";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const enquiries = await prisma.enquiry.findMany({
    where: { isAnonymized: false, email: { not: null } },
    orderBy: { submittedAt: "asc" },
  });

  let wouldProcess = 0;
  let processed = 0;
  let skipped = 0;
  const conflicts: string[] = [];

  for (const e of enquiries) {
    if (!e.email || !e.name) {
      skipped++;
      continue;
    }
    const normalized = normalizeCrmEmail(e.email);
    if (!normalized) {
      skipped++;
      continue;
    }

    const existing = await prisma.crmContact.findUnique({
      where: { emailNormalized: normalized },
    });

    if (existing) {
      conflicts.push(`${e.reference}: contact exists (${normalized})`);
    }

    wouldProcess++;

    if (dryRun) continue;

    await tryIntegrateEnquiryWithCrm({
      enquiryId: e.id,
      reference: e.reference,
      type: e.type,
      name: e.name,
      email: e.email,
      company: e.company,
      website: e.websiteUrl,
      service: e.service,
      mainConcern: e.mainConcern,
      sourcePath: e.sourcePath,
    });
    processed++;
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        totalEnquiries: enquiries.length,
        wouldProcess,
        processed,
        skipped,
        conflictCount: conflicts.length,
        conflicts: conflicts.slice(0, 20),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
