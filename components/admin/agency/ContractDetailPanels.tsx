"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  archiveContractAction,
  createContractVersionAction,
  returnContractDraftAction,
  saveContractVersionAction,
  sendContractAction,
  voidContractAction,
  adminSignContractAction,
  resendContractNotificationAction,
} from "@/lib/admin/contract-actions";
import { CONTRACT_STATUS_LABELS, CONTRACT_CONSENT_TEXT } from "@/lib/contracts/constants";
import { AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { contractStatusTone } from "@/lib/contracts/display";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

type Version = {
  id: string;
  versionNumber: number;
  title: string;
  content: string;
  contentHash: string;
  publishedAt: Date | null;
};

type Signer = {
  id: string;
  nameSnapshot: string;
  emailSnapshot: string;
  signerType: string;
  role: string;
  status: string;
  isRequired: boolean;
  signedAt: Date | null;
};

type Contract = {
  id: string;
  contractNumber: string;
  title: string;
  status: keyof typeof CONTRACT_STATUS_LABELS;
  source: string;
  expiresAt: Date | null;
  sentAt: Date | null;
  fullySignedAt: Date | null;
  voidReason: string | null;
  currentVersionId: string | null;
  proposal?: { id: string; proposalNumber: string; title: string } | null;
  project?: { id: string; projectNumber: string; name: string } | null;
  company?: { id: string; name: string } | null;
  primaryContact?: { id: string; displayName: string | null; email: string | null } | null;
  owner: { id: string; name: string };
  versions: Version[];
  signers: Signer[];
  signatures: Array<{
    id: string;
    typedSignatureName: string;
    signerNameSnapshot: string;
    signedAt: Date;
    contractContentHash: string;
  }>;
  activities: Array<{ id: string; summary: string; createdAt: Date; clientVisible: boolean }>;
  responses: Array<{ id: string; responseType: string; comment: string | null; createdAt: Date }>;
};

export function ContractDetailPanels({
  contract,
  canManage,
  canSend,
  canSign,
}: {
  contract: Contract;
  canManage: boolean;
  canSend: boolean;
  canSign: boolean;
}) {
  const draftVersion =
    contract.versions.find((v) => !v.publishedAt && v.id === contract.currentVersionId) ??
    contract.versions.find((v) => !v.publishedAt) ??
    contract.versions[0];

  const [version, setVersion] = useState(draftVersion);
  const [title, setTitle] = useState(version?.title ?? contract.title);
  const [content, setContent] = useState(version?.content ?? "");
  const [voidReason, setVoidReason] = useState("");
  const [typedName, setTypedName] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const editable =
    canManage &&
    version &&
    !version.publishedAt &&
    contract.status !== "SIGNED" &&
    contract.status !== "VOIDED";

  const requiredSigners = contract.signers.filter((s) => s.isRequired);
  const signedCount = requiredSigners.filter((s) => s.status === "SIGNED").length;

  return (
    <div className="space-y-6">
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}

      <AdminPanel>
        <div className="flex flex-wrap items-center gap-2">
          <AgencyBadge tone={contractStatusTone(contract.status)}>
            {CONTRACT_STATUS_LABELS[contract.status]}
          </AgencyBadge>
          <span className="text-sm text-neutral-600">
            Source: {contract.source === "PROPOSAL_ACCEPTANCE" ? "Accepted proposal" : "Manual"}
          </span>
          {contract.proposal ? (
            <Link
              href={`/admin/agency/proposals/${contract.proposal.id}`}
              className="text-sm hover:underline"
            >
              {contract.proposal.proposalNumber}
            </Link>
          ) : null}
          {contract.project ? (
            <Link
              href={`/admin/agency/projects/${contract.project.id}`}
              className="text-sm hover:underline"
            >
              {contract.project.projectNumber}
            </Link>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          {contract.company?.name ?? contract.primaryContact?.displayName ?? "—"} · Owner:{" "}
          {contract.owner.name}
        </p>
        {contract.expiresAt ? (
          <p className="text-sm text-neutral-600">
            Expires: {new Date(contract.expiresAt).toLocaleString()}
          </p>
        ) : null}
        {requiredSigners.length ? (
          <p className="mt-2 text-sm">
            Signature progress: {signedCount} of {requiredSigners.length} required signatures
          </p>
        ) : null}
      </AdminPanel>

      {version ? (
        <AdminPanel className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Version {version.versionNumber}</h2>
            {version.publishedAt ? (
              <AgencyBadge tone="success">Published {new Date(version.publishedAt).toLocaleString()}</AgencyBadge>
            ) : (
              <AgencyBadge tone="warning">Draft</AgencyBadge>
            )}
          </div>
          <div>
            <label className="admin-field-label">Title</label>
            <input
              className="admin-input w-full"
              value={title}
              disabled={!editable}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="admin-field-label">Content</label>
            <textarea
              className="admin-input min-h-64 w-full font-mono text-sm"
              value={content}
              disabled={!editable}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <p className="text-xs text-neutral-500">Content hash: {version.contentHash}</p>

          {editable ? (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("contractId", contract.id);
                fd.set("versionId", version.id);
                fd.set("title", title);
                fd.set("content", content);
                start(async () => {
                  const r = await saveContractVersionAction(fd);
                  setMessage(r.ok ? "Saved." : r.error ?? "Save failed.");
                });
              }}
            >
              Save draft
            </button>
          ) : null}
        </AdminPanel>
      ) : null}

      <AdminPanel>
        <h2 className="font-semibold">Signers</h2>
        <ul className="mt-2 divide-y text-sm">
          {contract.signers.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span>
                {s.nameSnapshot} ({s.emailSnapshot}) · {s.role} · {s.status}
              </span>
              {canSend && ["SENT", "PARTIALLY_SIGNED"].includes(contract.status) ? (
                <button
                  type="button"
                  className="text-sm hover:underline"
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("contractId", contract.id);
                    fd.set("signerId", s.id);
                    start(async () => {
                      const r = await resendContractNotificationAction(fd);
                      setMessage(r.ok ? "Notification resent." : r.error ?? "Resend failed.");
                    });
                  }}
                >
                  Resend
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </AdminPanel>

      {contract.signatures.length ? (
        <AdminPanel>
          <h2 className="font-semibold">Electronic signature record</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {contract.signatures.map((sig) => (
              <li key={sig.id} className="rounded border p-3">
                <p className="font-medium">{sig.signerNameSnapshot}</p>
                <p>Typed: {sig.typedSignatureName}</p>
                <p>Signed: {new Date(sig.signedAt).toLocaleString()}</p>
                <p className="text-xs text-neutral-500">Hash: {sig.contractContentHash}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            This is a factual electronic signature record, not a legally certified certificate.
          </p>
        </AdminPanel>
      ) : null}

      {canManage || canSend ? (
        <AdminPanel className="space-y-2">
          <h2 className="font-semibold">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {canSend && ["DRAFT", "READY_FOR_REVIEW", "CORRECTION_REQUESTED"].includes(contract.status) ? (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("contractId", contract.id);
                  if (version) fd.set("versionId", version.id);
                  start(async () => {
                    const r = await sendContractAction(fd);
                    setMessage(
                      r.ok
                        ? r.notificationFailed
                          ? "Sent, but notification failed."
                          : "Contract sent."
                        : r.error ?? "Send failed.",
                    );
                    if (r.ok) window.location.reload();
                  });
                }}
              >
                Send to signers
              </button>
            ) : null}
            {canManage &&
            ["SENT", "PARTIALLY_SIGNED", "CORRECTION_REQUESTED", "DECLINED"].includes(
              contract.status,
            ) ? (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("contractId", contract.id);
                  if (version) fd.set("sourceVersionId", version.id);
                  start(async () => {
                    const r = await createContractVersionAction(fd);
                    setMessage(r.ok ? "New version created." : r.error ?? "Failed.");
                    if (r.ok) window.location.reload();
                  });
                }}
              >
                Create new version
              </button>
            ) : null}
            {canManage && contract.status !== "SIGNED" && contract.status !== "VOIDED" ? (
              <>
                <input
                  className="admin-input"
                  placeholder="Void reason (required)"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary text-red-700"
                  disabled={pending || !voidReason.trim()}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("contractId", contract.id);
                    fd.set("reason", voidReason);
                    start(async () => {
                      const r = await voidContractAction(fd);
                      setMessage(r.ok ? "Contract voided." : r.error ?? "Void failed.");
                      if (r.ok) window.location.reload();
                    });
                  }}
                >
                  Void contract
                </button>
              </>
            ) : null}
            {canManage ? (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("contractId", contract.id);
                  start(async () => {
                    const r = await archiveContractAction(fd);
                    setMessage(r.ok ? "Archived." : r.error ?? "Archive failed.");
                  });
                }}
              >
                Archive
              </button>
            ) : null}
          </div>
        </AdminPanel>
      ) : null}

      {canSign &&
      contract.signers.some(
        (s) => s.signerType === "AGENCY" && s.status !== "SIGNED" && s.isRequired,
      ) &&
      ["SENT", "PARTIALLY_SIGNED"].includes(contract.status) ? (
        <AdminPanel className="space-y-3">
          <h2 className="font-semibold">Agency countersignature</h2>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{CONTRACT_CONSENT_TEXT}</span>
          </label>
          <input
            className="admin-input w-full"
            placeholder="Full legal name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
          />
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={pending || !consent || !typedName.trim()}
            onClick={() => {
              const fd = new FormData();
              fd.set("contractId", contract.id);
              fd.set("consentAcknowledged", "true");
              fd.set("typedSignatureName", typedName);
              start(async () => {
                const r = await adminSignContractAction(fd);
                setMessage(r.ok ? "Signed." : r.error ?? "Sign failed.");
                if (r.ok) window.location.reload();
              });
            }}
          >
            Sign as agency
          </button>
        </AdminPanel>
      ) : null}

      {contract.responses.length ? (
        <AdminPanel>
          <h2 className="font-semibold">Client responses</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {contract.responses.map((r) => (
              <li key={r.id} className="rounded border p-3">
                <p className="font-medium">{r.responseType}</p>
                {r.comment ? <p className="whitespace-pre-wrap">{r.comment}</p> : null}
                <p className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </AdminPanel>
      ) : null}

      <AdminPanel>
        <h2 className="font-semibold">Activity</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {contract.activities.map((a) => (
            <li key={a.id}>
              {new Date(a.createdAt).toLocaleString()} — {a.summary}
            </li>
          ))}
        </ul>
      </AdminPanel>
    </div>
  );
}
