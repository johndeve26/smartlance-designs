"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useState, useTransition } from "react";
import {
  saveInboundEmailSettingsAction,
  testInboundConnectionAction,
} from "@/lib/admin/inbound-email-settings-actions";
import type { AdminInboundEmailSettingsDto } from "@/lib/repositories/inboundEmailSettingsRepository";

const SECURITY_MODES = ["AUTO", "TLS", "STARTTLS", "NONE"] as const;

export function InboundMailboxSettingsPanel({
  settings,
}: {
  settings: AdminInboundEmailSettingsDto | null;
}) {
  const initial = settings ?? {
    enabled: false,
    providerType: "IMAP",
    host: null,
    port: 993,
    securityMode: "TLS" as const,
    username: null,
    passwordConfigured: false,
    passwordLast4: null,
    mailboxFolder: "INBOX",
    crmReplyToEmail: null,
    syncEnabledAt: null,
    lastSyncedAt: null,
    lastSuccessfulSyncAt: null,
    lastSyncErrorSafe: null,
    lastImportCount: 0,
    configurationStatus: "not_configured" as const,
  };

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [testPending, startTest] = useTransition();

  return (
    <AdminPanel className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Inbound mailbox (IMAP)</h2>
        <p className="text-sm text-neutral-600">
          Separate from SMTP outbound. Syncs replies into CRM Inbox. Read-only — messages are not modified in the mailbox.
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          setError(null);
          start(async () => {
            const res = await saveInboundEmailSettingsAction(new FormData(e.currentTarget));
            if (res.ok) setMessage("Saved.");
            else setError(res.error);
          });
        }}
      >
        <label className="flex items-center gap-2 text-sm">
          <input name="enabled" type="checkbox" defaultChecked={initial.enabled} />
          Enable inbound sync
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="host" defaultValue={initial.host ?? ""} placeholder="IMAP host" className="admin-input" />
          <input name="port" type="number" defaultValue={initial.port ?? 993} placeholder="Port" className="admin-input" />
          <select name="securityMode" defaultValue={initial.securityMode} className="admin-input">
            {SECURITY_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input name="username" defaultValue={initial.username ?? ""} placeholder="Username" className="admin-input" />
          <input name="mailboxFolder" defaultValue={initial.mailboxFolder} placeholder="Folder (INBOX)" className="admin-input" />
          <input name="crmReplyToEmail" defaultValue={initial.crmReplyToEmail ?? ""} placeholder="CRM reply-to email" className="admin-input" />
        </div>
        <div>
          <label className="text-sm text-neutral-600">New password (leave blank to keep existing)</label>
          <input name="newPassword" type="password" autoComplete="new-password" className="admin-input mt-1 w-full" />
          {initial.passwordConfigured ? (
            <p className="mt-1 text-xs text-neutral-500">Configured ••••{initial.passwordLast4 ?? ""}</p>
          ) : null}
        </div>
        <button type="submit" disabled={pending} className="admin-btn admin-btn-primary text-sm">
          {pending ? "Saving…" : "Save inbound settings"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={testPending}
          className="admin-btn admin-btn-secondary text-sm"
          onClick={() => {
            setMessage(null);
            setError(null);
            startTest(async () => {
              const res = await testInboundConnectionAction();
              if (res.ok) setMessage(res.message ?? "Connection OK.");
              else setError(res.error);
            });
          }}
        >
          {testPending ? "Testing…" : "Test inbound connection"}
        </button>
      </div>

      <dl className="grid gap-1 text-sm text-neutral-600 sm:grid-cols-2">
        <div><dt>Status</dt><dd>{initial.configurationStatus}</dd></div>
        <div><dt>Last sync</dt><dd>{initial.lastSyncedAt ?? "—"}</dd></div>
        <div><dt>Last success</dt><dd>{initial.lastSuccessfulSyncAt ?? "—"}</dd></div>
        <div><dt>Last import count</dt><dd>{initial.lastImportCount}</dd></div>
        {initial.lastSyncErrorSafe ? (
          <div className="sm:col-span-2 text-red-700"><dt>Error</dt><dd>{initial.lastSyncErrorSafe}</dd></div>
        ) : null}
      </dl>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </AdminPanel>
  );
}
