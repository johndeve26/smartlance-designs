/**
 * Run content quality audit and write baseline JSON + print summary.
 * Read-only against CMS. Does not rewrite or publish.
 *
 * Usage: npx tsx scripts/run-content-quality-audit.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { runContentQualityAudit } from "@/lib/ops/content-quality-audit";

async function main() {
  const report = await runContentQualityAudit();
  mkdirSync("docs/audit-artifacts", { recursive: true });
  writeFileSync(
    "docs/audit-artifacts/content-quality-audit-baseline.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        version: report.version,
        auditedAt: report.auditedAt,
        summary: report.summary,
        siteFindings: report.siteFindings.length,
        wave: report.firstImprovementWave.length,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
