"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useState } from "react";
import { saveOutreachEngagementSettingsAction } from "@/lib/admin/crm-outreach-actions";

export function OutreachEngagementSettingsPanel({
  trackEmailOpens,
  trackEmailClicks,
  canManage,
}: {
  trackEmailOpens: boolean;
  trackEmailClicks: boolean;
  canManage: boolean;
}) {
  const [opens, setOpens] = useState(trackEmailOpens);
  const [clicks, setClicks] = useState(trackEmailClicks);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);
    setStatus(null);
    const result = await saveOutreachEngagementSettingsAction({
      trackEmailOpens: opens,
      trackEmailClicks: clicks,
    });
    setPending(false);
    setStatus(result.ok ? "Saved." : "Save failed.");
  }

  return (
    <AdminPanel className=" space-y-4 p-4">
      <div>
        <h2 className="font-semibold">Email engagement tracking</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Open detection is approximate — email privacy features and image proxies can affect accuracy.
          Click detection is stronger, but security scanners may visit links automatically.
        </p>
      </div>
      <div className="space-y-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={clicks}
            disabled={!canManage}
            onChange={(e) => setClicks(e.target.checked)}
          />
          Track link clicks (HTML emails)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={opens}
            disabled={!canManage}
            onChange={(e) => setOpens(e.target.checked)}
          />
          Detect email opens (approximate — HTML pixel)
        </label>
      </div>
      {canManage ? (
        <button
          type="button"
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={pending}
          onClick={handleSave}
        >
          {pending ? "Saving…" : "Save tracking settings"}
        </button>
      ) : null}
      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}
    </AdminPanel>
  );
}
