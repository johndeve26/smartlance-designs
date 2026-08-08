import type { AIWriterSettings } from "@prisma/client";
import Link from "next/link";
import { saveAILimitsAction } from "@/lib/admin/ai-writer-actions";

export function GenerationLimitsSection({ settings }: { settings: AIWriterSettings }) {
  return (
    <section id="limits" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Generation limits</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Guardrails that control research depth, retries and generation usage.
        </p>
      </div>

      <form action={saveAILimitsAction} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Research</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Max research queries</span>
              <input
                type="number"
                name="maxResearchQueries"
                defaultValue={settings.maxResearchQueries}
                className="admin-input mt-1"
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Maximum search queries allowed for a single editorial research run.
              </span>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Max sources</span>
              <input
                type="number"
                name="maxSources"
                defaultValue={settings.maxSources}
                className="admin-input mt-1"
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Cap on research sources retained for a project.
              </span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Generation</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Max draft regenerations</span>
              <input
                type="number"
                name="maxDraftRegens"
                defaultValue={settings.maxDraftRegens}
                className="admin-input mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Max concurrent jobs</span>
              <input
                type="number"
                name="maxConcurrentJobs"
                defaultValue={settings.maxConcurrentJobs}
                className="admin-input mt-1"
              />
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Editorial</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Default citation mode</span>
              <select
                name="citationModeDefault"
                defaultValue={settings.citationModeDefault}
                className="admin-input mt-1"
              >
                <option value="RESEARCH_ONLY">Research only</option>
                <option value="VISIBLE_CITATIONS">Visible citations</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Disclosure mode</span>
              <select
                name="disclosureMode"
                defaultValue={settings.disclosureMode}
                className="admin-input mt-1"
              >
                <option value="none">None</option>
                <option value="site_policy">General site editorial-policy disclosure</option>
                <option value="article">Article-specific disclosure</option>
              </select>
            </label>
          </div>
        </div>

        <details className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-neutral-800">
            Advanced limits
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Stale job minutes</span>
              <input
                type="number"
                name="staleJobMinutes"
                defaultValue={settings.staleJobMinutes ?? 30}
                className="admin-input mt-1"
              />
              <span className="mt-1 block text-xs text-neutral-500">
                RUNNING jobs older than this are recovered as timed out.
              </span>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-800">Daily token warning threshold</span>
              <input
                type="number"
                name="dailyTokenWarningThreshold"
                defaultValue={settings.dailyTokenWarningThreshold ?? ""}
                placeholder="optional"
                className="admin-input mt-1"
              />
            </label>
            <label className="col-span-full flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="allowResultCache"
                defaultChecked={settings.allowResultCache ?? true}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-neutral-800">Allow identical analysis result cache</span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  Reuse successful analysis runs with the same input fingerprint.
                </span>
              </span>
            </label>
            <label className="col-span-full block text-sm">
              <span className="font-medium text-neutral-800">Source policy notes</span>
              <textarea
                name="sourcePolicyNotes"
                defaultValue={settings.sourcePolicyNotes || ""}
                rows={3}
                className="admin-input mt-1"
              />
              <span className="mt-1 block text-xs text-neutral-500">
                Optional operator notes. Prefer{" "}
                <Link href="/admin/ai-writer/source-policy" className="underline">
                  Source policy
                </Link>{" "}
                for the full policy page.
              </span>
            </label>
          </div>
        </details>

        <button type="submit" className="admin-btn-primary">
          Save generation limits
        </button>
      </form>
    </section>
  );
}
