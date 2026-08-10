"use client";

import { useState, useTransition } from "react";
import type { AdminEmailSettingsDto } from "@/lib/repositories/emailSettingsRepository";
import type { AdminSendingProfileDto } from "@/lib/repositories/emailSendingProfileRepository";
import type { AdminEmailRoutingRow } from "@/lib/repositories/emailRoutingRepository";
import { SmtpSettingsPanel } from "@/components/admin/SmtpSettingsPanel";
import { InboundMailboxSettingsPanel } from "@/components/admin/InboundMailboxSettingsPanel";
import type { AdminInboundEmailSettingsDto } from "@/lib/repositories/inboundEmailSettingsRepository";
import {
  bootstrapDefaultProfileFromSystemAction,
  deactivateEmailSendingProfileAction,
  saveEmailRoutingAction,
  saveEmailSendingProfileAction,
  sendProfileTestEmailAction,
  testProfileConnectionAction,
} from "@/lib/admin/email-profile-actions";
import { EMAIL_ROUTE_LABELS } from "@/lib/email/routing/categories";

type Tab = "overview" | "system" | "profiles" | "routing" | "inbound";

export function EmailAdminShell({
  emailSettings,
  inboundSettings,
  adminEmail,
  profiles,
  routing,
  canManageProfiles,
  canManageRouting,
}: {
  emailSettings: AdminEmailSettingsDto | null;
  inboundSettings: AdminInboundEmailSettingsDto | null;
  adminEmail?: string | null;
  profiles: AdminSendingProfileDto[];
  routing: AdminEmailRoutingRow[];
  canManageProfiles: boolean;
  canManageRouting: boolean;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const defaultProfile = profiles.find((p) => p.isDefault);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "system", label: "System SMTP" },
    { id: "profiles", label: "Sending Profiles" },
    { id: "routing", label: "Routing" },
    { id: "inbound", label: "Inbound" },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-surface-muted text-foreground"
                : "text-muted hover:text-foreground"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <OverviewPanel
          emailSettings={emailSettings}
          profiles={profiles}
          routing={routing}
          defaultProfile={defaultProfile}
          canManageProfiles={canManageProfiles}
        />
      ) : null}
      {tab === "system" ? (
        <SmtpSettingsPanel settings={emailSettings} adminEmail={adminEmail} />
      ) : null}
      {tab === "profiles" ? (
        <ProfilesPanel
          profiles={profiles}
          adminEmail={adminEmail}
          canManageProfiles={canManageProfiles}
        />
      ) : null}
      {tab === "routing" ? (
        <RoutingPanel
          routing={routing}
          profiles={profiles.filter((p) => p.isActive)}
          canManageRouting={canManageRouting}
        />
      ) : null}
      {tab === "inbound" ? (
        <InboundMailboxSettingsPanel settings={inboundSettings} />
      ) : null}
    </div>
  );
}

function OverviewPanel({
  emailSettings,
  profiles,
  routing,
  defaultProfile,
  canManageProfiles,
}: {
  emailSettings: AdminEmailSettingsDto | null;
  profiles: AdminSendingProfileDto[];
  routing: AdminEmailRoutingRow[];
  defaultProfile?: AdminSendingProfileDto;
  canManageProfiles: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const configuredRoutes = routing.filter((r) => !r.usesDefault).length;

  return (
    <div className="admin-panel space-y-4">
      <h2 className="text-lg font-semibold">Email overview</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="System SMTP" value={emailSettings?.configurationStatus ?? "unknown"} />
        <Stat label="Active profiles" value={String(profiles.filter((p) => p.isActive).length)} />
        <Stat label="Default profile" value={defaultProfile?.name ?? "Legacy system sender"} />
        <Stat label="Explicit routes" value={`${configuredRoutes} / ${routing.length}`} />
      </dl>
      <p className="text-sm text-muted">
        Sending profiles define From/Reply-To identity. System SMTP provides the connection unless a
        profile uses custom SMTP. Your SMTP provider must authorize each From address (SPF, DKIM,
        DMARC).
      </p>
      {canManageProfiles && !defaultProfile ? (
        <div>
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            className="admin-btn admin-btn-secondary text-sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setMessage(null);
                setError(null);
                const r = await bootstrapDefaultProfileFromSystemAction();
                if (r.ok) setMessage(r.message ?? "Done.");
                else setError(r.error);
              })
            }
          >
            Create default profile from current system sender
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold capitalize">{value}</dd>
    </div>
  );
}

function ProfilesPanel({
  profiles,
  adminEmail,
  canManageProfiles,
}: {
  profiles: AdminSendingProfileDto[];
  adminEmail?: string | null;
  canManageProfiles: boolean;
}) {
  const [editing, setEditing] = useState<AdminSendingProfileDto | "new" | null>(null);

  if (!canManageProfiles) {
    return (
      <p className="text-sm text-muted">You do not have permission to manage sending profiles.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Sending profiles</h2>
        <button
          type="button"
          className="admin-btn admin-btn-primary text-sm"
          onClick={() => setEditing("new")}
        >
          New profile
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr>
              <th>Profile</th>
              <th>From</th>
              <th>Transport</th>
              <th>Status</th>
              <th>Last test</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.name}
                  {p.isDefault ? (
                    <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-xs font-semibold">
                      DEFAULT
                    </span>
                  ) : null}
                </td>
                <td>
                  {p.fromName} &lt;{p.fromEmail}&gt;
                </td>
                <td>{p.transportType === "CUSTOM_SMTP" ? "Custom SMTP" : "System SMTP"}</td>
                <td>{p.isActive ? "Active" : "Inactive"}</td>
                <td className="capitalize">{p.lastTestStatus.toLowerCase()}</td>
                <td>
                  <button
                    type="button"
                    className="text-accent-text hover:underline"
                    onClick={() => setEditing(p)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? (
        <ProfileEditor
          profile={editing === "new" ? null : editing}
          adminEmail={adminEmail}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function ProfileEditor({
  profile,
  adminEmail,
  onClose,
}: {
  profile: AdminSendingProfileDto | null;
  adminEmail?: string | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="admin-panel space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await saveEmailSendingProfileAction(fd);
          if (r.ok) {
            setMessage(r.message ?? "Saved.");
            onClose();
          } else setError(r.error);
        });
      }}
    >
      <h3 className="font-semibold">{profile ? "Edit profile" : "New profile"}</h3>
      {profile ? <input type="hidden" name="id" value={profile.id} /> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Profile name
          <input name="name" className="admin-input mt-1 w-full" defaultValue={profile?.name ?? ""} required />
        </label>
        <label className="block text-sm">
          Slug
          <input name="slug" className="admin-input mt-1 w-full" defaultValue={profile?.slug ?? ""} required />
        </label>
        <label className="block text-sm sm:col-span-2">
          Description
          <textarea name="description" className="admin-input mt-1 w-full" defaultValue={profile?.description ?? ""} rows={2} />
        </label>
        <label className="block text-sm">
          From name
          <input name="fromName" className="admin-input mt-1 w-full" defaultValue={profile?.fromName ?? "Smartlance Designs"} required />
        </label>
        <label className="block text-sm">
          From email
          <input name="fromEmail" type="email" className="admin-input mt-1 w-full" defaultValue={profile?.fromEmail ?? ""} required />
        </label>
        <label className="block text-sm">
          Reply-To name
          <input name="replyToName" className="admin-input mt-1 w-full" defaultValue={profile?.replyToName ?? ""} />
        </label>
        <label className="block text-sm">
          Reply-To email
          <input name="replyToEmail" type="email" className="admin-input mt-1 w-full" defaultValue={profile?.replyToEmail ?? ""} />
        </label>
        <label className="block text-sm">
          Transport
          <select name="transportType" className="admin-input mt-1 w-full" defaultValue={profile?.transportType ?? "SYSTEM_SMTP"}>
            <option value="SYSTEM_SMTP">System SMTP</option>
            <option value="CUSTOM_SMTP">Custom SMTP</option>
          </select>
        </label>
        <label className="block text-sm">
          Sort order
          <input name="sortOrder" type="number" className="admin-input mt-1 w-full" defaultValue={profile?.sortOrder ?? 0} />
        </label>
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="text-sm font-semibold">Custom SMTP (Super Admin)</legend>
        <label className="block text-sm">
          Host
          <input name="smtpHost" className="admin-input mt-1 w-full" defaultValue={profile?.smtpHost ?? ""} />
        </label>
        <label className="block text-sm">
          Port
          <input name="smtpPort" type="number" className="admin-input mt-1 w-full" defaultValue={profile?.smtpPort ?? 587} />
        </label>
        <label className="block text-sm">
          Security
          <select name="smtpSecurityMode" className="admin-input mt-1 w-full" defaultValue={profile?.smtpSecurityMode ?? "STARTTLS"}>
            <option value="STARTTLS">STARTTLS</option>
            <option value="TLS">TLS</option>
            <option value="AUTO">AUTO</option>
            <option value="NONE">NONE</option>
          </select>
        </label>
        <label className="block text-sm">
          Username
          <input name="smtpUsername" className="admin-input mt-1 w-full" defaultValue={profile?.smtpUsername ?? ""} />
        </label>
        <label className="block text-sm sm:col-span-2">
          Password {profile?.smtpPasswordConfigured ? `(saved ••••${profile.smtpPasswordLast4 ?? ""})` : ""}
          <input name="newPassword" type="password" className="admin-input mt-1 w-full" autoComplete="new-password" placeholder="Leave blank to keep existing" />
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked={profile?.isActive ?? false} />
          Active
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="isDefault" defaultChecked={profile?.isDefault ?? false} />
          Default profile
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="admin-btn admin-btn-primary text-sm" disabled={pending}>
          Save profile
        </button>
        <button type="button" className="admin-btn admin-btn-secondary text-sm" onClick={onClose}>
          Cancel
        </button>
        {profile ? (
          <>
            <ProfileTestButtons profileId={profile.id} adminEmail={adminEmail} />
            {!profile.isDefault ? (
              <button
                type="button"
                className="admin-btn admin-btn-secondary text-sm"
                onClick={() =>
                  start(async () => {
                    const r = await deactivateEmailSendingProfileAction(profile.id);
                    if (r.ok) onClose();
                    else setError(r.error);
                  })
                }
              >
                Deactivate
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </form>
  );
}

function ProfileTestButtons({
  profileId,
  adminEmail,
}: {
  profileId: string;
  adminEmail?: string | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      {msg ? <span className="text-sm text-green-700">{msg}</span> : null}
      <button
        type="button"
        className="admin-btn admin-btn-secondary text-sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await testProfileConnectionAction(profileId);
            setMsg(r.ok ? r.message ?? "OK" : r.error);
          })
        }
      >
        Test connection
      </button>
      <button
        type="button"
        className="admin-btn admin-btn-secondary text-sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("profileId", profileId);
            if (adminEmail) fd.set("recipient", adminEmail);
            const r = await sendProfileTestEmailAction(fd);
            setMsg(r.ok ? r.message ?? "Sent" : r.error);
          })
        }
      >
        Send test email
      </button>
    </>
  );
}

function RoutingPanel({
  routing,
  profiles,
  canManageRouting,
}: {
  routing: AdminEmailRoutingRow[];
  profiles: AdminSendingProfileDto[];
  canManageRouting: boolean;
}) {
  if (!canManageRouting) {
    return <p className="text-sm text-muted">You do not have permission to manage routing.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Email routing</h2>
      <p className="text-sm text-muted">
        Assign a sending profile to each message type. Categories without an explicit route use the
        default profile, then legacy system sender.
      </p>
      <div className="overflow-x-auto">
        <table className="admin-table w-full text-sm">
          <thead>
            <tr>
              <th>Message type</th>
              <th>Profile</th>
              <th>From</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {routing.map((row) => (
              <RoutingRow key={row.category} row={row} profiles={profiles} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoutingRow({
  row,
  profiles,
}: {
  row: AdminEmailRoutingRow;
  profiles: AdminSendingProfileDto[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <tr>
      <td>{EMAIL_ROUTE_LABELS[row.category]}</td>
      <td colSpan={2}>
        <select
          className="admin-input text-sm"
          defaultValue={row.usesDefault ? "" : row.sendingProfileId ?? ""}
          disabled={pending}
          onChange={(e) =>
            start(async () => {
              const fd = new FormData();
              fd.set("category", row.category);
              if (!e.target.value) {
                fd.set("useDefault", "1");
              } else {
                fd.set("sendingProfileId", e.target.value);
              }
              const r = await saveEmailRoutingAction(fd);
              setMsg(r.ok ? "Saved" : r.error);
            })
          }
        >
          <option value="">Uses default</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.fromEmail})
            </option>
          ))}
        </select>
        {row.profileActive === false ? (
          <span className="ml-2 text-xs text-amber-700">Assigned profile inactive — falls back</span>
        ) : null}
        {msg ? <span className="ml-2 text-xs text-muted">{msg}</span> : null}
      </td>
      <td>{row.usesDefault ? "Default" : row.sendingProfileFrom}</td>
    </tr>
  );
}
