"use client";

import { useState, useTransition } from "react";
import {
  portalDeclineContractAction,
  portalRequestContractCorrectionAction,
  portalSignContractAction,
} from "@/lib/portal/contract-actions";
import { CONTRACT_CONSENT_TEXT, CONTRACT_STATUS_LABELS } from "@/lib/contracts/constants";
import type { ClientContractDto } from "@/lib/contracts/portal-dto";

export function PortalContractView({ contract }: { contract: ClientContractDto }) {
  const [typedName, setTypedName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [consent, setConsent] = useState(false);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!contract.version) {
    return <p className="text-neutral-600">No published version is available yet.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-neutral-600">
          {contract.contractNumber} · V{contract.version.versionNumber}
        </p>
        <h1 className="text-2xl font-semibold">{contract.title}</h1>
        {contract.companyName ? (
          <p className="text-sm text-neutral-600">Prepared for {contract.companyName}</p>
        ) : null}
        <p className="text-sm text-neutral-600">
          Status: {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
        </p>
        {contract.expiresAt ? (
          <p className="text-sm text-neutral-600">
            Expires: {new Date(contract.expiresAt).toLocaleString()}
          </p>
        ) : null}
        {contract.isSuperseded ? (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This version has been superseded. Only the current sent version can be signed.
          </p>
        ) : null}
      </header>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Contract terms</h2>
        <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap">{contract.version.content}</div>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Signers</h2>
        <ul className="mt-2 divide-y text-sm">
          {contract.signers.map((s) => (
            <li key={s.id} className="flex justify-between py-2">
              <span>
                {s.nameSnapshot} · {s.role}
              </span>
              <span>{s.status}</span>
            </li>
          ))}
        </ul>
      </section>

      {contract.signatures.length ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Electronic signature record</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {contract.signatures.map((sig) => (
              <li key={sig.id}>
                <p className="font-medium">{sig.signerNameSnapshot}</p>
                <p>Typed: {sig.typedSignatureName}</p>
                <p>Signed: {new Date(sig.signedAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            Factual signature record only — not a legally certified certificate.
          </p>
        </section>
      ) : null}

      {message ? <p className="text-sm">{message}</p> : null}

      {contract.canSign ? (
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Sign contract</h2>
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
          <input
            className="admin-input w-full"
            placeholder="Title (optional)"
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
          />
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={pending || !consent || typedName.trim().length < 2}
            onClick={() => {
              const fd = new FormData();
              fd.set("contractId", contract.id);
              fd.set("consentAcknowledged", "true");
              fd.set("typedSignatureName", typedName);
              if (signerTitle) fd.set("signerTitle", signerTitle);
              start(async () => {
                const r = await portalSignContractAction(fd);
                setMessage(r.ok ? "Contract signed." : r.error ?? "Sign failed.");
                if (r.ok) window.location.reload();
              });
            }}
          >
            Sign contract
          </button>
        </section>
      ) : null}

      {contract.canDecline ? (
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Decline or request correction</h2>
          <textarea
            className="admin-input min-h-24 w-full"
            placeholder="Comment (required for correction request)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("contractId", contract.id);
                fd.set("comment", comment);
                start(async () => {
                  const r = await portalDeclineContractAction(fd);
                  setMessage(r.ok ? "Contract declined." : r.error ?? "Decline failed.");
                  if (r.ok) window.location.reload();
                });
              }}
            >
              Decline
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={pending || !comment.trim()}
              onClick={() => {
                const fd = new FormData();
                fd.set("contractId", contract.id);
                fd.set("comment", comment);
                start(async () => {
                  const r = await portalRequestContractCorrectionAction(fd);
                  setMessage(r.ok ? "Correction requested." : r.error ?? "Request failed.");
                  if (r.ok) window.location.reload();
                });
              }}
            >
              Request correction
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
