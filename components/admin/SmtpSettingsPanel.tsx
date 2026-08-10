"use client";

import { useState, useTransition } from "react";
import {
  saveEmailSettingsAction,
  sendSmtpTestEmailAction,
  testSmtpConnectionAction,
} from "@/lib/admin/email-settings-actions";
import type { AdminEmailSettingsDto } from "@/lib/repositories/emailSettingsRepository";

const SECURITY_MODES = ["AUTO", "TLS", "STARTTLS", "NONE"] as const;
const SUGGESTED_PORTS = [465, 587, 2525, 25];

export function SmtpSettingsPanel({
  settings,
  adminEmail,
}: {
  settings: AdminEmailSettingsDto | null;
  adminEmail?: string | null;
}) {
  const initial = settings ?? {
    enabled: false,
    host: null,
    port: 587,
    securityMode: "STARTTLS" as const,
    username: null,
    passwordConfigured: false,
    passwordLast4: null,
    passwordReadable: true,
    fromName: "Smartlance Designs",
    fromEmail: null,
    replyToEmail: null,
    notificationRecipients: [],
    testRecipient: adminEmail ?? null,
    lastTestedAt: null,
    lastTestSucceededAt: null,
    lastTestErrorSafe: null,
    configurationStatus: "not_configured" as const,
  };

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [testPending, startTest] = useTransition();
  const [confirmClearPassword, setConfirmClearPassword] = useState(false);

  const statusLabel = {
    not_configured: "Not configured",
    configured: "Configured",
    enabled: "Enabled",
    disabled: "Disabled",
  }[initial.configurationStatus];

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (confirmClearPassword) {
      fd.set("clearPassword", "1");
    }
    start(async () => {
      const res = await saveEmailSettingsAction(fd);
      if (res.ok) {
        setMessage(res.message ?? "Saved.");
        setConfirmClearPassword(false);
      } else {
        setError(res.error);
      }
    });
  }

  function runConnectionTest() {
    setMessage(null);
    setError(null);
    startTest(async () => {
      const res = await testSmtpConnectionAction();
      if (res.ok) setMessage(res.message ?? "Connection verified.");
      else setError(res.error);
    });
  }

  function runTestEmail(form: HTMLFormElement) {
    setMessage(null);
    setError(null);
    const fd = new FormData(form);
    startTest(async () => {
      const res = await sendSmtpTestEmailAction(fd);
      if (res.ok) setMessage(res.message ?? "Test email sent.");
      else setError(res.error);
    });
  }

  return (
    <section className="rounded-lg border bg-white p-4 space-y-4">
      <div>
        <h2 className="font-semibold">Email delivery (SMTP)</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Configure transactional email without redeploying. Passwords are
          encrypted at rest and never returned to the browser.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSave}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initial.enabled}
          />
          Enable SMTP
        </label>

        <div className="space-y-3 rounded border border-neutral-100 bg-neutral-50/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            SMTP server
          </p>
          <Field
            name="host"
            label="Host"
            defaultValue={initial.host ?? ""}
            placeholder="smtp.example.com"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              name="port"
              label="Port"
              defaultValue={initial.port != null ? String(initial.port) : "587"}
              placeholder="587"
            />
            <label className="block text-sm">
              Security
              <select
                name="securityMode"
                defaultValue={initial.securityMode}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                {SECURITY_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            Common ports: {SUGGESTED_PORTS.join(", ")}. TLS on 465, STARTTLS on
            587.
          </p>
        </div>

        <div className="space-y-3 rounded border border-neutral-100 bg-neutral-50/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Authentication
          </p>
          <Field
            name="username"
            label="Username"
            defaultValue={initial.username ?? ""}
            autoComplete="off"
          />
          <div className="text-sm">
            <span className="font-medium">Password</span>
            <p className="mt-1 text-neutral-600">
              {initial.passwordConfigured
                ? `Configured${initial.passwordLast4 ? ` (••••${initial.passwordLast4})` : ""}`
                : "Not configured"}
            </p>
            {initial.passwordConfigured && !initial.passwordReadable ? (
              <p className="mt-2 text-amber-800 text-xs">
                Stored password cannot be decrypted. Re-enter the mailbox password
                below and save — usually caused by a changed{" "}
                <code className="text-[11px]">AI_SECRETS_ENCRYPTION_KEY</code>.
              </p>
            ) : null}
          </div>
          <Field
            name="newPassword"
            label="New password (leave blank to keep existing)"
            type="password"
            defaultValue=""
            autoComplete="new-password"
          />
          <label className="flex items-center gap-2 text-sm text-red-700">
            <input
              type="checkbox"
              checked={confirmClearPassword}
              onChange={(e) => setConfirmClearPassword(e.target.checked)}
            />
            Remove SMTP password
          </label>
        </div>

        <div className="space-y-3 rounded border border-neutral-100 bg-neutral-50/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Sender
          </p>
          <Field
            name="fromName"
            label="From name"
            defaultValue={initial.fromName ?? ""}
          />
          <Field
            name="fromEmail"
            label="From email"
            defaultValue={initial.fromEmail ?? ""}
            placeholder="hello@yourdomain.com"
          />
          <Field
            name="replyToEmail"
            label="Default Reply-To (optional)"
            defaultValue={initial.replyToEmail ?? ""}
          />
        </div>

        <div className="space-y-3 rounded border border-neutral-100 bg-neutral-50/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Notifications
          </p>
          <Field
            name="notificationRecipients"
            label="Notification recipients (comma-separated)"
            defaultValue={initial.notificationRecipients.join(", ")}
            placeholder="team@yourdomain.com"
          />
          <Field
            name="testRecipient"
            label="Test recipient (optional)"
            defaultValue={initial.testRecipient ?? adminEmail ?? ""}
          />
        </div>

        <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm space-y-1">
          <p>
            <span className="font-medium">Status:</span> {statusLabel}
          </p>
          {initial.lastTestSucceededAt ? (
            <p className="text-neutral-600">
              Last successful test:{" "}
              {new Date(initial.lastTestSucceededAt).toLocaleString()}
            </p>
          ) : null}
          {initial.lastTestErrorSafe ? (
            <p className="text-red-700">Last test error: {initial.lastTestErrorSafe}</p>
          ) : null}
          {!initial.enabled && initial.host ? (
            <p className="text-amber-700">
              SMTP is saved but disabled. Environment fallback (Resend / webhooks)
              applies when configured.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save email settings"}
          </button>
          <button
            type="button"
            disabled={testPending || !initial.enabled}
            onClick={runConnectionTest}
            className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {testPending ? "Testing…" : "Test connection"}
          </button>
        </div>
      </form>

      <form
        className="flex flex-wrap items-end gap-2 border-t pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          runTestEmail(e.currentTarget);
        }}
      >
        <Field
          name="recipient"
          label="Send test email to"
          defaultValue={initial.testRecipient ?? adminEmail ?? ""}
          className="min-w-[240px] flex-1"
        />
        <button
          type="submit"
          disabled={testPending || !initial.enabled}
          className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Send test email
        </button>
      </form>

      {message ? (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  autoComplete,
  className,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded border px-3 py-2"
      />
    </label>
  );
}
