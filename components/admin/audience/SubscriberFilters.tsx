"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SubscriberSource, SubscriberStatus } from "@prisma/client";

const statuses: Array<SubscriberStatus | "all"> = [
  "all",
  "ACTIVE",
  "PENDING",
  "UNSUBSCRIBED",
];

const sources: SubscriberSource[] = [
  "FOOTER",
  "INSIGHT",
  "RESOURCE",
  "GUIDE",
  "CHECKLIST",
  "TEMPLATE",
  "CONTACT",
  "WEBSITE_REVIEW",
  "OTHER",
];

export function SubscriberFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.push(`/admin/audience?${next.toString()}`);
  }

  return (
    <form className="flex flex-wrap gap-3 rounded-lg border bg-white p-4">
      <label className="text-sm">
        Search
        <input
          name="q"
          defaultValue={params.get("q") || ""}
          placeholder="Name or email"
          className="mt-1 block w-56 rounded border px-3 py-2"
          onBlur={(e) => update("q", e.target.value)}
        />
      </label>
      <label className="text-sm">
        Status
        <select
          defaultValue={params.get("status") || "all"}
          className="mt-1 block rounded border px-3 py-2"
          onChange={(e) => update("status", e.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Source
        <select
          defaultValue={params.get("source") || ""}
          className="mt-1 block rounded border px-3 py-2"
          onChange={(e) => update("source", e.target.value)}
        >
          <option value="">All sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
