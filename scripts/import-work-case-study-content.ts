/**
 * Import legacy case-study narratives into WorkProject published content.
 *
 * Usage:
 *   npx tsx scripts/import-work-case-study-content.ts --dry-run
 *   npx tsx scripts/import-work-case-study-content.ts
 *   npx tsx scripts/import-work-case-study-content.ts --force
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { caseStudyNarratives } from "@/data/case-study-narratives";
import { getProjectBySlug } from "@/data/portfolio";
import { PHASE3_WORK_CASE_STUDY_MARKER } from "@/lib/work/case-study-content";
import { mapLegacyWorkPublishedFields } from "@/lib/work/map-legacy-case-study";
import { CaseStudyContentV1Schema } from "@/lib/work/case-study-content";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const MARKER_ID = PHASE3_WORK_CASE_STUDY_MARKER;
const MARKER_VERSION = "phase3-work-case-study-v1";

type ReportRow = {
  slug: string;
  foundDb: boolean;
  legacyNarrative: boolean;
  caseStudyKind: string;
  updated: boolean;
  skipped: string[];
  conflict: string[];
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const report: ReportRow[] = [];

  try {
    const marker = await prisma.contentImportMarker.findUnique({
      where: { id: MARKER_ID },
    });
    if (marker && !FORCE) {
      console.log(
        `Case study import already completed (${marker.version}). Use --force to rerun.`,
      );
      return;
    }

    for (const slug of Object.keys(caseStudyNarratives)) {
      const row: ReportRow = {
        slug,
        foundDb: false,
        legacyNarrative: true,
        caseStudyKind: "WEBSITE",
        updated: false,
        skipped: [],
        conflict: [],
      };

      const portfolio = getProjectBySlug(slug);
      const narrative = caseStudyNarratives[slug];
      if (!portfolio || !narrative) {
        row.skipped.push("missing typed portfolio or narrative");
        report.push(row);
        continue;
      }

      const dbRow = await prisma.workProject.findUnique({ where: { slug } });
      if (!dbRow) {
        row.skipped.push("no WorkProject row");
        report.push(row);
        continue;
      }

      row.foundDb = true;
      const mapped = mapLegacyWorkPublishedFields(slug, portfolio, narrative);
      row.caseStudyKind = mapped.caseStudyKind;

      const parsed = CaseStudyContentV1Schema.safeParse(mapped.caseStudyContent);
      if (!parsed.success) {
        row.conflict.push("caseStudyContent validation failed");
        report.push(row);
        continue;
      }

      if (dbRow.caseStudyContent && !FORCE) {
        row.skipped.push("caseStudyContent already set");
        report.push(row);
        continue;
      }

      if (!DRY_RUN) {
        await prisma.workProject.update({
          where: { id: dbRow.id },
          data: {
            heroStatement: mapped.heroStatement,
            heroEyebrow: mapped.heroEyebrow,
            heroSupportingCopy: mapped.heroSupportingCopy,
            externalLinkLabel: mapped.externalLinkLabel,
            caseStudyKind: mapped.caseStudyKind,
            challenges: mapped.challenges,
            approachSteps: mapped.approachSteps,
            solutionPoints: mapped.solutionPoints,
            highlights: mapped.highlights,
            platformContext: mapped.platformContext,
            outcomeHeading: mapped.outcomeHeading,
            caseStudyContent: parsed.data,
          },
        });
        row.updated = true;
      } else {
        row.updated = true;
      }

      report.push(row);
    }

    if (!DRY_RUN) {
      await prisma.contentImportMarker.upsert({
        where: { id: MARKER_ID },
        create: {
          id: MARKER_ID,
          version: MARKER_VERSION,
          completedAt: new Date(),
        },
        update: {
          version: MARKER_VERSION,
          completedAt: new Date(),
        },
      });
    }

    console.log(JSON.stringify({ dryRun: DRY_RUN, force: FORCE, report }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
