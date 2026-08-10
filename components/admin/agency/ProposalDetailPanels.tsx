"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  archiveProposalAction,
  convertAcceptedProposalAction,
  createProposalVersionAction,
  grantProposalAccessAction,
  resendProposalNotificationAction,
  returnProposalDraftAction,
  revokeProposalAccessAction,
  saveProposalVersionAction,
  sendProposalAction,
  submitProposalReviewAction,
} from "@/lib/admin/proposal-actions";
import { PROPOSAL_STATUS_LABELS } from "@/lib/proposals/constants";
import { AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { proposalStatusTone } from "@/lib/proposals/display";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

type LineItem = {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  type: string;
  isOptional: boolean;
  isSelectedByDefault: boolean;
  position: number;
};

type Version = {
  id: string;
  versionNumber: number;
  title: string;
  intro: string | null;
  scopeSummary: string | null;
  timelineSummary: string | null;
  assumptionsText: string | null;
  exclusionsText: string | null;
  revisionPolicy: string | null;
  publishedAt: Date | null;
  totalAmount: unknown;
  lineItems: LineItem[];
};

type Proposal = {
  id: string;
  proposalNumber: string;
  title: string;
  status: keyof typeof PROPOSAL_STATUS_LABELS;
  currency: string;
  primaryContactId: string;
  internalNotes: string | null;
  expiresAt: Date | null;
  currentVersionId: string | null;
  primaryContact: { id: string; displayName: string | null; email: string | null };
  clientAccess: Array<{
    contactId: string;
    role: string;
    revokedAt: Date | null;
    contact: { id: string; displayName: string | null; email: string | null };
  }>;
  versions: Version[];
  project: { id: string; projectNumber: string } | null;
  acceptance: { acceptedTotal: unknown; acceptedAt: Date } | null;
};

export function ProposalDetailPanels({
  proposal,
  canManage,
  canSend,
  templates,
}: {
  proposal: Proposal;
  canManage: boolean;
  canSend: boolean;
  templates: Array<{ id: string; name: string }>;
}) {
  const draftVersion =
    proposal.versions.find((v) => !v.publishedAt && v.id === proposal.currentVersionId) ??
    proposal.versions.find((v) => !v.publishedAt) ??
    proposal.versions[0];

  const [version, setVersion] = useState(draftVersion);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    (draftVersion?.lineItems ?? []).map((item, i) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      position: item.position ?? i,
    })),
  );
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const editable = canManage && !version?.publishedAt && proposal.status !== "ACCEPTED";

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const item of lineItems) {
      if (item.type === "DISCOUNT") continue;
      if (item.isOptional) continue;
      subtotal += item.quantity * item.unitPrice;
    }
    return subtotal;
  }, [lineItems]);

  if (!version) {
    return <p className="text-sm text-neutral-500">No proposal version yet.</p>;
  }

  function saveVersion() {
    const fd = new FormData();
    fd.set("proposalId", proposal.id);
    fd.set("versionId", version.id);
    fd.set("title", version.title);
    fd.set("intro", version.intro ?? "");
    fd.set("scopeSummary", version.scopeSummary ?? "");
    fd.set("timelineSummary", version.timelineSummary ?? "");
    fd.set("assumptionsText", version.assumptionsText ?? "");
    fd.set("exclusionsText", version.exclusionsText ?? "");
    fd.set("revisionPolicy", version.revisionPolicy ?? "");
    fd.set("lineItemsJson", JSON.stringify(lineItems));
    fd.set("scopeItemsJson", "[]");
    fd.set("deliverablesJson", "[]");
    fd.set("sectionsJson", "[]");
    start(async () => {
      const r = await saveProposalVersionAction(fd);
      setMessage(r.ok ? "Saved." : r.error ?? "Save failed.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <AgencyBadge tone={proposalStatusTone(proposal.status)}>
          {PROPOSAL_STATUS_LABELS[proposal.status]}
        </AgencyBadge>
        <span className="text-sm text-neutral-600">
          Version {version.versionNumber}
          {version.publishedAt ? " · Published" : " · Draft"}
        </span>
        {proposal.project ? (
          <Link
            href={`/admin/agency/projects/${proposal.project.id}`}
            className="text-sm text-blue-700 hover:underline"
          >
            Project {proposal.project.projectNumber}
          </Link>
        ) : null}
      </div>

      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}

      <AdminPanel className="space-y-3">
        <h2 className="font-semibold">Scope & content</h2>
        <Field
          label="Version title"
          value={version.title}
          onChange={(v) => setVersion({ ...version, title: v })}
          disabled={!editable}
        />
        <TextArea
          label="Introduction"
          value={version.intro ?? ""}
          onChange={(v) => setVersion({ ...version, intro: v })}
          disabled={!editable}
        />
        <TextArea
          label="Scope summary"
          value={version.scopeSummary ?? ""}
          onChange={(v) => setVersion({ ...version, scopeSummary: v })}
          disabled={!editable}
        />
        <TextArea
          label="Timeline"
          value={version.timelineSummary ?? ""}
          onChange={(v) => setVersion({ ...version, timelineSummary: v })}
          disabled={!editable}
        />
        <TextArea
          label="Assumptions"
          value={version.assumptionsText ?? ""}
          onChange={(v) => setVersion({ ...version, assumptionsText: v })}
          disabled={!editable}
        />
        <TextArea
          label="Exclusions"
          value={version.exclusionsText ?? ""}
          onChange={(v) => setVersion({ ...version, exclusionsText: v })}
          disabled={!editable}
        />
        <TextArea
          label="Revision policy"
          value={version.revisionPolicy ?? ""}
          onChange={(v) => setVersion({ ...version, revisionPolicy: v })}
          disabled={!editable}
        />
        {editable ? (
          <button type="button" className="admin-btn admin-btn-primary" disabled={pending} onClick={saveVersion}>
            Save draft
          </button>
        ) : null}
        <Link
          href={`/portal/proposals/${proposal.id}?preview=1`}
          className="ml-2 text-sm text-neutral-600 hover:underline"
          target="_blank"
        >
          Preview as client →
        </Link>
      </AdminPanel>

      <AdminPanel className="space-y-3">
        <h2 className="font-semibold">Pricing ({proposal.currency})</h2>
        <p className="text-sm text-neutral-600">Server recalculates totals on save and acceptance.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Qty</th>
                <th className="py-2 pr-2">Unit</th>
                <th className="py-2 pr-2">Optional</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 pr-2">
                    <input
                      className="admin-input w-full"
                      value={item.name}
                      disabled={!editable}
                      onChange={(e) => {
                        const next = [...lineItems];
                        next[idx] = { ...item, name: e.target.value };
                        setLineItems(next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      className="admin-input w-20"
                      value={item.quantity}
                      disabled={!editable}
                      onChange={(e) => {
                        const next = [...lineItems];
                        next[idx] = { ...item, quantity: Number(e.target.value) };
                        setLineItems(next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      className="admin-input w-28"
                      value={item.unitPrice}
                      disabled={!editable}
                      onChange={(e) => {
                        const next = [...lineItems];
                        next[idx] = { ...item, unitPrice: Number(e.target.value) };
                        setLineItems(next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={item.isOptional}
                      disabled={!editable}
                      onChange={(e) => {
                        const next = [...lineItems];
                        next[idx] = { ...item, isOptional: e.target.checked };
                        setLineItems(next);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editable ? (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              setLineItems([
                ...lineItems,
                {
                  name: "New line item",
                  quantity: 1,
                  unitPrice: 0,
                  type: "SERVICE",
                  isOptional: false,
                  isSelectedByDefault: false,
                  position: lineItems.length,
                },
              ])
            }
          >
            Add line item
          </button>
        ) : null}
        <p className="font-medium">Required subtotal preview: {totals.toFixed(2)} {proposal.currency}</p>
      </AdminPanel>

      {canManage ? (
        <AdminPanel className="space-y-2">
          <h2 className="font-semibold">Workflow</h2>
          <div className="flex flex-wrap gap-2">
            {proposal.status === "DRAFT" ? (
              <ActionButton
                label="Submit for review"
                pending={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("proposalId", proposal.id);
                  start(async () => {
                    const r = await submitProposalReviewAction(fd);
                    setMessage(r.ok ? "Submitted for review." : r.error ?? "Failed.");
                  });
                }}
              />
            ) : null}
            {proposal.status === "INTERNAL_REVIEW" ? (
              <ActionButton
                label="Return to draft"
                pending={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("proposalId", proposal.id);
                  start(async () => {
                    const r = await returnProposalDraftAction(fd);
                    setMessage(r.ok ? "Returned to draft." : r.error ?? "Failed.");
                  });
                }}
              />
            ) : null}
            {(proposal.status === "CHANGES_REQUESTED" || proposal.status === "SENT") && canManage ? (
              <ActionButton
                label="Create new version"
                pending={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("proposalId", proposal.id);
                  start(async () => {
                    const r = await createProposalVersionAction(fd);
                    if (r.ok) window.location.reload();
                    else setMessage(r.error ?? "Failed.");
                  });
                }}
              />
            ) : null}
            {canSend && ["DRAFT", "INTERNAL_REVIEW", "CHANGES_REQUESTED"].includes(proposal.status) ? (
              <ActionButton
                label="Send to client"
                pending={pending}
                onClick={() => {
                  saveVersion();
                  const fd = new FormData();
                  fd.set("proposalId", proposal.id);
                  fd.set("versionId", version.id);
                  fd.set("contactIds", proposal.primaryContactId);
                  fd.set("decisionMakerContactId", proposal.primaryContactId);
                  start(async () => {
                    const r = await sendProposalAction(fd);
                    setMessage(
                      r.ok
                        ? r.notificationFailed
                          ? "Sent. Notification failed — use resend."
                          : "Sent to client."
                        : r.error ?? "Send failed.",
                    );
                    if (r.ok) window.location.reload();
                  });
                }}
              />
            ) : null}
            {proposal.status === "ACCEPTED" && !proposal.project ? (
              <ActionButton
                label="Create project"
                pending={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("proposalId", proposal.id);
                  fd.set("grantProjectAccessContactIds", proposal.primaryContactId);
                  start(async () => {
                    const r = await convertAcceptedProposalAction(fd);
                    if (r.ok && r.projectId) {
                      window.location.href = `/admin/agency/projects/${r.projectId}`;
                    } else {
                      setMessage(r.error ?? "Conversion failed.");
                    }
                  });
                }}
              />
            ) : null}
            <ActionButton
              label="Archive"
              pending={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("proposalId", proposal.id);
                start(async () => {
                  const r = await archiveProposalAction(fd);
                  setMessage(r.ok ? "Archived." : r.error ?? "Failed.");
                });
              }}
            />
          </div>
        </AdminPanel>
      ) : null}

      {canManage ? (
        <AdminPanel className="space-y-2">
          <h2 className="font-semibold">Client access</h2>
          <ul className="text-sm">
            {proposal.clientAccess.map((a) => (
              <li key={a.contactId} className="flex items-center justify-between py-1">
                <span>
                  {a.contact.displayName ?? a.contact.email} · {a.role}
                  {a.revokedAt ? " · revoked" : ""}
                </span>
                {!a.revokedAt ? (
                  <button
                    type="button"
                    className="text-sm text-red-700"
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("proposalId", proposal.id);
                      fd.set("contactId", a.contactId);
                      start(async () => {
                        await revokeProposalAccessAction(fd);
                        window.location.reload();
                      });
                    }}
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              const fd = new FormData();
              fd.set("proposalId", proposal.id);
              fd.set("contactId", proposal.primaryContactId);
              fd.set("role", "DECISION_MAKER");
              start(async () => {
                await grantProposalAccessAction(fd);
                window.location.reload();
              });
            }}
          >
            Grant primary contact access
          </button>
          {proposal.clientAccess.some((a) => !a.revokedAt && a.contact.email) ? (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                const contact = proposal.clientAccess.find((a) => !a.revokedAt);
                if (!contact) return;
                const fd = new FormData();
                fd.set("proposalId", proposal.id);
                fd.set("contactId", contact.contactId);
                start(async () => {
                  const r = await resendProposalNotificationAction(fd);
                  setMessage(r.ok ? "Notification resent." : r.error ?? "Resend failed.");
                });
              }}
            >
              Resend notification
            </button>
          ) : null}
        </AdminPanel>
      ) : null}

      {proposal.acceptance ? (
        <AdminPanel className="text-sm">
          <h2 className="font-semibold">Acceptance snapshot</h2>
          <p>Accepted {new Date(proposal.acceptance.acceptedAt).toLocaleString()}</p>
          <p>
            Total: {Number(proposal.acceptance.acceptedTotal).toFixed(2)} {proposal.currency}
          </p>
        </AdminPanel>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="admin-field-label">{label}</label>
      <input
        className="admin-input w-full"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="admin-field-label">{label}</label>
      <textarea
        className="admin-input min-h-20 w-full"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  pending,
}: {
  label: string;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={onClick}>
      {label}
    </button>
  );
}
