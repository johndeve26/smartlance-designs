"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSegmentAction, previewSegmentAction } from "@/lib/admin/crm-outreach-actions";
import { getContactFilterMetadataAction } from "@/lib/admin/crm-filter-actions";
import {
  CONTACT_FILTER_VERSION,
  parseContactFilterV3,
  type ContactFilterV3,
} from "@/lib/crm/filters/contact-filter-schema";
import { ContactFilterBuilder } from "@/components/admin/crm/filters/ContactFilterBuilder";
import type { ContactFilterMetadata } from "@/lib/admin/crm-filter-actions";

type LegacyFilter = {
  version?: number;
  temperature?: string[];
  lifecycle?: string[];
  [key: string]: unknown;
};

function isV3Filter(filter: unknown): filter is ContactFilterV3 {
  return (
    typeof filter === "object" &&
    filter != null &&
    "version" in filter &&
    (filter as { version: number }).version === CONTACT_FILTER_VERSION &&
    "conditions" in filter
  );
}

function LegacySegmentFilterPanel({ filter }: { filter: LegacyFilter }) {
  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
      <p className="font-medium text-amber-900">Legacy filter (v{filter.version ?? 1})</p>
      <p className="mt-1 text-amber-800">
        This segment uses a legacy filter format. It continues to execute correctly.
        Create a new segment to use the visual v3 builder, or upgrade manually when a deterministic conversion exists.
      </p>
      <pre className="mt-2 max-h-40 overflow-auto rounded bg-white p-2 text-xs">
        {JSON.stringify(filter, null, 2)}
      </pre>
    </div>
  );
}

export function SegmentForm({
  initial,
}: {
  initial?: { id?: string; name: string; description: string; filter: unknown };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [metadata, setMetadata] = useState<ContactFilterMetadata | null>(null);
  const [preview, setPreview] = useState<{ count: number } | null>(null);

  const legacy = initial?.filter && !isV3Filter(initial.filter);
  const [filter, setFilter] = useState<ContactFilterV3>(() => {
    if (initial?.filter && isV3Filter(initial.filter)) {
      return parseContactFilterV3(initial.filter);
    }
    return { version: CONTACT_FILTER_VERSION, match: "ALL", conditions: [] };
  });

  useEffect(() => {
    getContactFilterMetadataAction().then(setMetadata).catch(() => setMetadata(null));
  }, []);

  if (legacy && initial?.filter) {
    return (
      <div className="mt-4 space-y-3">
        <LegacySegmentFilterPanel filter={initial.filter as LegacyFilter} />
        <p className="text-sm text-neutral-600">Legacy segments cannot be edited with the v3 builder.</p>
      </div>
    );
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("filterJson", JSON.stringify(filter));
        if (initial?.id) fd.set("id", initial.id);
        start(async () => {
          const r = await saveSegmentAction(fd);
          if (!r.ok) alert(r.error);
          else router.refresh();
        });
      }}
    >
      <input name="name" required defaultValue={initial?.name} placeholder="Segment name" className="admin-input w-full" />
      <input name="description" defaultValue={initial?.description} placeholder="Description" className="admin-input w-full" />

      {metadata ? (
        <ContactFilterBuilder metadata={metadata} value={filter} onChange={setFilter} />
      ) : (
        <p className="text-sm text-neutral-500">Loading filter builder…</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          className="admin-btn admin-btn-secondary text-sm"
          onClick={() => {
            start(async () => {
              const r = await previewSegmentAction(JSON.stringify(filter));
              if (r.ok) setPreview({ count: r.count });
              else alert(r.error);
            });
          }}
        >
          Preview count
        </button>
        {preview ? <span className="text-sm text-neutral-600">{preview.count} contacts match</span> : null}
      </div>
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        Save segment
      </button>
    </form>
  );
}
