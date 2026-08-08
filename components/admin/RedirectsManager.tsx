"use client";

import { useState, useTransition } from "react";
import {
  createRedirectAction,
  deleteRedirectAction,
  disableRedirectAction,
  testRedirectAction,
} from "@/lib/admin/phase4-actions";

type Row = {
  id: string;
  sourcePath: string;
  destination: string;
  type: string;
  status: string;
  origin: string;
  reason: string | null;
  updatedAt: string;
};

export function RedirectsManager({
  items,
  canHardDelete,
  filters,
}: {
  items: Row[];
  canHardDelete: boolean;
  filters: { q: string; origin: string; status: string };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Search source or destination"
          className="rounded border px-3 py-2 text-sm"
        />
        <select name="origin" defaultValue={filters.origin} className="rounded border px-3 py-2 text-sm">
          <option value="">All origins</option>
          <option value="LEGACY_MIGRATION">Legacy migration</option>
          <option value="SLUG_CHANGE">Slug change</option>
          <option value="MANUAL">Manual</option>
        </select>
        <select name="status" defaultValue={filters.status} className="rounded border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Filter
        </button>
      </form>

      <form
        className="grid gap-2 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await createRedirectAction(fd);
            setMessage(
              res.ok
                ? `Created.${res.warning ? ` Warning: ${res.warning}` : ""}`
                : res.error,
            );
            if (res.ok) window.location.reload();
          });
        }}
      >
        <label className="text-sm">
          Source path
          <input name="sourcePath" required placeholder="/old-path" className="mt-1 w-full rounded border px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Destination
          <input name="destination" required placeholder="/new-path" className="mt-1 w-full rounded border px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Type
          <select name="type" defaultValue="PERMANENT_301" className="mt-1 w-full rounded border px-2 py-1.5">
            <option value="PERMANENT_301">301</option>
            <option value="TEMPORARY_302">302</option>
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="rounded bg-[#F47A48] px-4 py-2 text-sm font-semibold text-white">
            Create redirect
          </button>
        </div>
      </form>

      <form
        className="flex flex-wrap gap-2 rounded-lg border bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const path = String(new FormData(e.currentTarget).get("path") || "");
          start(async () => {
            const res = await testRedirectAction(path);
            setTestResult(
              res.loop
                ? `Loop detected. Chain: ${res.chain.map((c) => c.sourcePath).join(" → ")}`
                : res.chain.length
                  ? `Chain: ${res.chain.map((c) => `${c.sourcePath}→${c.destination}`).join(" · ")} · Final: ${res.finalPath}`
                  : `No redirect for ${path}`,
            );
          });
        }}
      >
        <label className="text-sm">
          Test path
          <input name="path" placeholder="/some-path" className="mt-1 block rounded border px-2 py-1.5" />
        </label>
        <button type="submit" className="self-end rounded border px-3 py-2 text-sm">
          Resolve chain
        </button>
        {testResult ? <p className="w-full text-sm text-neutral-700">{testResult}</p> : null}
      </form>

      {message ? <p className="text-sm" role="status">{message}</p> : null}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Origin</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b align-top">
                <td className="px-3 py-2 font-mono text-xs">{row.sourcePath}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.destination}</td>
                <td className="px-3 py-2">{row.type === "PERMANENT_301" ? "301" : "302"}</td>
                <td className="px-3 py-2">{row.origin}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2">{row.updatedAt.slice(0, 10)}</td>
                <td className="px-3 py-2 space-y-1">
                  {row.status === "ACTIVE" ? (
                    <button
                      type="button"
                      className="block text-xs text-amber-800 underline"
                      onClick={() =>
                        start(async () => {
                          const fd = new FormData();
                          fd.set("id", row.id);
                          await disableRedirectAction(fd);
                          window.location.reload();
                        })
                      }
                    >
                      Disable
                    </button>
                  ) : null}
                  {canHardDelete && row.origin !== "LEGACY_MIGRATION" ? (
                    <button
                      type="button"
                      className="block text-xs text-red-700 underline"
                      onClick={() =>
                        start(async () => {
                          if (!confirm("Permanently delete this redirect?")) return;
                          const fd = new FormData();
                          fd.set("id", row.id);
                          const res = await deleteRedirectAction(fd);
                          setMessage(res.ok ? "Deleted." : res.error);
                          if (res.ok) window.location.reload();
                        })
                      }
                    >
                      Delete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
