"use client";

import { useState, useTransition } from "react";
import { syncStaticMediaAction } from "@/lib/admin/phase4-actions";
import type { StaticMediaSyncResult } from "@/lib/media/sync-static";

function formatSummary(result: StaticMediaSyncResult): string {
  const parts = [
    `${result.filesScanned} scanned`,
    `${result.created} created`,
    `${result.updated} updated`,
    `${result.unchanged} unchanged`,
  ];
  if (result.missingSources.length) {
    parts.push(`${result.missingSources.length} missing source(s)`);
  }
  if (result.errors.length) {
    parts.push(`${result.errors.length} error(s)`);
  }
  return parts.join(" · ");
}

export function StaticMediaSyncPanel({
  lastRunAt,
}: {
  lastRunAt: string | null;
}) {
  const [pending, start] = useTransition();
  const [dryRunPending, startDryRun] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<StaticMediaSyncResult | null>(null);

  function handleResult(res: Awaited<ReturnType<typeof syncStaticMediaAction>>) {
    if (!res.ok) {
      setMessage(res.error);
      setDetails(null);
      return;
    }
    setDetails(res.result);
    setMessage(
      res.result.dryRun
        ? `Dry run complete. ${formatSummary(res.result)}`
        : `Sync complete. ${formatSummary(res.result)}`,
    );
    if (!res.result.dryRun) {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">
          Sync static media
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Indexes repository assets under <code className="text-xs">public/images</code>{" "}
          and <code className="text-xs">public/og</code> into MediaAsset rows. This
          reconciles metadata only — it does not delete media or rewrite content URLs.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || dryRunPending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={() =>
            start(async () => {
              setMessage(null);
              handleResult(await syncStaticMediaAction({ dryRun: false }));
            })
          }
        >
          {pending ? "Syncing…" : "Sync static assets"}
        </button>
        <button
          type="button"
          disabled={pending || dryRunPending}
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 disabled:opacity-60"
          onClick={() =>
            startDryRun(async () => {
              setMessage(null);
              handleResult(await syncStaticMediaAction({ dryRun: true }));
            })
          }
        >
          {dryRunPending ? "Running…" : "Dry run"}
        </button>
        <p className="text-sm text-neutral-600">
          Last sync: {lastRunAt ? new Date(lastRunAt).toLocaleString() : "never"}
        </p>
      </div>

      {message ? <p className="text-sm text-neutral-800">{message}</p> : null}

      {details?.conflicts.length ? (
        <p className="text-sm text-amber-800">
          {details.conflicts.length} invalid content reference(s) detected. Run{" "}
          <code className="text-xs">npm run media:sync:static -- --write-audit</code>{" "}
          for a machine-readable inventory.
        </p>
      ) : null}
    </div>
  );
}
