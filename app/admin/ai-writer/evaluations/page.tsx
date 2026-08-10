import Link from "next/link";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { listGoldenFixtures } from "@/lib/ai/evaluation/fixtures";
import {
  runMockEvaluationSuiteAction,
  runTopicCalibrationSuiteAction,
} from "@/lib/admin/ai-writer-actions";
import { getAIProviderStatus } from "@/lib/ai/providers";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import {
  listTopicCalibrationFixtures,
  listTopicCalibrationHoldout,
} from "@/lib/ai/topic-intelligence/calibration/fixtures";
import { runTopicCalibrationSuite } from "@/lib/ai/topic-intelligence/calibration/evaluate";

export const dynamic = "force-dynamic";

export default async function AIEvaluationsPage() {
  const user = await requireAdminUser("manage_ai_settings");
  const fixtures = listGoldenFixtures();
  const topicFixtures = listTopicCalibrationFixtures();
  const holdout = listTopicCalibrationHoldout();
  const liveCalibration = runTopicCalibrationSuite({ includeHoldout: false });
  const snapshots = await prisma.aIEvaluationSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const provider = await getAIProviderStatus();
  const canManage = userCan(user, "manage_ai_settings");
  const topicSnapshots = snapshots.filter((s) =>
    s.fixtureId.startsWith("topic-intelligence"),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="AI Writer evaluations"
        description={
          <>
            <Link href="/admin/ai-writer" className="text-accent-text hover:underline">
              ← AI Writer
            </Link>
            <span className="mt-2 block">
              Golden fixtures for production-quality validation. CI uses mocks. Live provider evals are
              intentional only - not run on every deploy. No master quality score.
            </span>
          </>
        }
      />

      <AIWriterSubnav current="/admin/ai-writer/evaluations" />

      <AdminPanel className="text-sm">
        <p>
          AI Provider: <strong>{provider.label}</strong>
        </p>
        <p className="mt-1 text-neutral-600">
          {`Live suite estimated generations: ~${fixtures.length * 3}-${fixtures.length * 8} (research + draft + reviews) - do not run casually.`}
        </p>
        {canManage ? (
          <form action={runMockEvaluationSuiteAction} className="mt-3">
            <button className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
              Run mock golden suite (no paid API)
            </button>
          </form>
        ) : null}
      </AdminPanel>

      <AdminPanel>
        <h2 className="text-lg font-medium">Topic Intelligence calibration</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Offline gold set ({topicFixtures.length} fixtures + {holdout.length} holdout). Human
          labels calibrate editorial judgement - they do not auto-retrain the engine. Holdout should
          run only after prompt/model changes.
        </p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Decision matches"
            value={`${liveCalibration.totals.decisionMatches}/${liveCalibration.totals.fixtures}`}
          />
          <Stat
            label="False WRITE+ positives"
            value={String(liveCalibration.totals.falsePositiveWriteNew)}
          />
          <Stat
            label="False IGNORE/MONITOR"
            value={String(liveCalibration.totals.falseNegativeStrong)}
          />
          <Stat
            label="Format matches"
            value={`${liveCalibration.totals.formatMatches}/${liveCalibration.totals.formatChecked}`}
          />
        </div>

        {canManage ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={runTopicCalibrationSuiteAction}>
              <button className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
                Save calibration snapshot
              </button>
            </form>
            <form action={runTopicCalibrationSuiteAction}>
              <input type="hidden" name="includeHoldout" value="on" />
              <button className="rounded border px-4 py-2 text-sm">
                Save with holdout (post-tuning)
              </button>
            </form>
          </div>
        ) : null}

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Confusion (diagnostic buckets)
        </h3>
        <ul className="mt-2 space-y-1 text-xs font-mono text-neutral-700">
          {liveCalibration.confusion.map((c) => (
            <li key={`${c.expected}-${c.actual}`}>
              {c.expected} {"->"} {c.actual}: {c.count}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Scenario results
        </h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b text-neutral-500">
                <th className="py-1 pr-2">Scenario</th>
                <th className="py-1 pr-2">Expected</th>
                <th className="py-1 pr-2">Actual</th>
                <th className="py-1 pr-2">Format</th>
                <th className="py-1 pr-2">Cannibal.</th>
                <th className="py-1">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {liveCalibration.rows.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-neutral-900">{r.seed}</div>
                    <div className="font-mono text-neutral-500">{r.id}</div>
                  </td>
                  <td className="py-2 pr-2">{r.expectedDecisions.join(" / ")}</td>
                  <td className="py-2 pr-2">{r.actualDecision}</td>
                  <td className="py-2 pr-2">
                    {r.actualFormat || "-"}
                    {r.formatMatch === false ? " (format miss)" : r.formatMatch ? " (format ok)" : ""}
                  </td>
                  <td className="py-2 pr-2">{r.cannibalizationDetected ? "yes" : "-"}</td>
                  <td className="py-2">
                    <span className={r.decisionMatch ? "text-emerald-700" : "text-amber-800"}>
                      {r.decisionMatch ? "match" : "review"}
                    </span>
                    <div className="mt-0.5 text-neutral-500">{r.reasoningQuality} reasoning</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {topicSnapshots.length ? (
          <div className="mt-4">
            <h3 className="text-sm font-medium">Saved Topic Intelligence snapshots</h3>
            <ul className="mt-2 space-y-1 text-xs text-neutral-600">
              {topicSnapshots.slice(0, 8).map((s) => (
                <li key={s.id}>
                  {s.createdAt.toISOString()} · {s.notes}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </AdminPanel>

      <AdminPanel>
        <h2 className="text-lg font-medium">Golden fixtures (article pipeline)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {fixtures.map((f) => (
            <li key={f.id} className="border-b pb-2 last:border-0">
              <div className="font-medium">
                {f.title} <span className="font-mono text-xs text-neutral-500">({f.id})</span>
              </div>
              <div className="text-neutral-600">{f.topic}</div>
              <div className="text-xs text-neutral-500">
                {f.category}
                {f.expectedCannibalization ? ` · expect ${f.expectedCannibalization}` : ""}
                {f.recommendDoNotCreate ? " · may recommend do-not-create" : ""}
              </div>
            </li>
          ))}
        </ul>
      </AdminPanel>

      <AdminPanel>
        <h2 className="text-lg font-medium">Recent snapshots</h2>
        {snapshots.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No evaluation snapshots yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs">
            {snapshots.map((s) => (
              <li key={s.id} className="rounded border px-3 py-2">
                <div className="font-mono">
                  {s.fixtureId} · {s.mode} · {s.createdAt.toISOString()}
                </div>
                <div>{s.notes}</div>
                <pre className="mt-1 max-h-32 overflow-auto bg-neutral-50 p-2">
                  {JSON.stringify(s.dimensions, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-100 bg-neutral-50 px-3 py-2">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 font-medium tabular-nums text-neutral-900">{value}</div>
    </div>
  );
}
