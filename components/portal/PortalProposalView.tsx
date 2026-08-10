"use client";

import { useMemo, useState, useTransition } from "react";
import {
  portalAcceptProposalAction,
  portalDeclineProposalAction,
  portalRequestChangesAction,
} from "@/lib/portal/proposal-actions";
import type { ClientProposalDto } from "@/lib/proposals/portal-dto";

export function PortalProposalView({ proposal }: { proposal: ClientProposalDto }) {
  const [selectedOptional, setSelectedOptional] = useState<string[]>(() =>
    proposal.version?.lineItems
      .filter((item) => item.isOptional && item.isSelectedByDefault)
      .map((item) => item.id) ?? [],
  );
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const total = useMemo(() => {
    if (!proposal.version) return 0;
    let sum = 0;
    for (const item of proposal.version.lineItems) {
      if (item.type === "DISCOUNT") continue;
      if (item.isOptional && !selectedOptional.includes(item.id)) continue;
      sum += item.amount;
    }
    const discount = proposal.version.discountAmount ?? 0;
    const tax = proposal.version.taxAmount ?? 0;
    return Math.max(0, sum - discount + tax);
  }, [proposal.version, selectedOptional]);

  if (!proposal.version) {
    return <p className="text-neutral-600">No published version is available yet.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-neutral-600">{proposal.proposalNumber} · V{proposal.version.versionNumber}</p>
        <h1 className="text-2xl font-semibold">{proposal.title}</h1>
        {proposal.companyName ? (
          <p className="text-sm text-neutral-600">Prepared for {proposal.companyName}</p>
        ) : null}
        {proposal.isSuperseded ? (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This version has been superseded. Only the latest sent version can be accepted.
          </p>
        ) : null}
      </header>

      {proposal.version.intro ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Overview</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{proposal.version.intro}</p>
        </section>
      ) : null}

      {proposal.version.scopeSummary ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Scope</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{proposal.version.scopeSummary}</p>
        </section>
      ) : null}

      {proposal.version.deliverables.length ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Deliverables</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {proposal.version.deliverables.map((d) => (
              <li key={d.id}>{d.title}{d.quantity > 1 ? ` × ${d.quantity}` : ""}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Pricing</h2>
        <ul className="mt-3 divide-y text-sm">
          {proposal.version.lineItems.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium">{item.name}</p>
                {item.description ? <p className="text-neutral-600">{item.description}</p> : null}
                {item.isOptional ? (
                  <label className="mt-1 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={!proposal.canDecide}
                      checked={selectedOptional.includes(item.id)}
                      onChange={(e) => {
                        setSelectedOptional((prev) =>
                          e.target.checked
                            ? [...prev, item.id]
                            : prev.filter((id) => id !== item.id),
                        );
                      }}
                    />
                    Include optional add-on
                  </label>
                ) : null}
              </div>
              <span>{item.amount.toFixed(2)} {proposal.currency}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-lg font-semibold">
          Total preview: {total.toFixed(2)} {proposal.currency}
        </p>
        <p className="text-xs text-neutral-500">Final total is confirmed server-side on acceptance.</p>
      </section>

      {(proposal.version.assumptionsText || proposal.version.exclusionsText || proposal.version.revisionPolicy) ? (
        <section className="rounded border bg-white p-4 text-sm space-y-3">
          {proposal.version.assumptionsText ? (
            <div>
              <h2 className="font-semibold">Assumptions</h2>
              <p className="mt-1 whitespace-pre-wrap">{proposal.version.assumptionsText}</p>
            </div>
          ) : null}
          {proposal.version.exclusionsText ? (
            <div>
              <h2 className="font-semibold">Exclusions</h2>
              <p className="mt-1 whitespace-pre-wrap">{proposal.version.exclusionsText}</p>
            </div>
          ) : null}
          {proposal.version.revisionPolicy ? (
            <div>
              <h2 className="font-semibold">Revision policy</h2>
              <p className="mt-1 whitespace-pre-wrap">{proposal.version.revisionPolicy}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}

      {proposal.canDecide ? (
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Your decision</h2>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Comments for request changes or decline (optional for decline)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Accept ${proposal.proposalNumber}, Version ${proposal.version!.versionNumber}?`)) {
                  return;
                }
                const fd = new FormData();
                fd.set("proposalId", proposal.id);
                fd.set("selectedOptionalItemIds", selectedOptional.join(","));
                fd.set("termsAcknowledged", "true");
                start(async () => {
                  const r = await portalAcceptProposalAction(fd);
                  setMessage(r.ok ? "Proposal accepted. Thank you." : r.error ?? "Acceptance failed.");
                  if (r.ok) window.location.reload();
                });
              }}
            >
              Accept proposal
            </button>
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm"
              disabled={pending}
              onClick={() => {
                if (!comment.trim()) {
                  alert("Please describe the changes you need.");
                  return;
                }
                const fd = new FormData();
                fd.set("proposalId", proposal.id);
                fd.set("comment", comment);
                start(async () => {
                  const r = await portalRequestChangesAction(fd);
                  setMessage(r.ok ? "Change request submitted." : r.error ?? "Failed.");
                  if (r.ok) window.location.reload();
                });
              }}
            >
              Request changes
            </button>
            <button
              type="button"
              className="rounded border border-red-200 px-4 py-2 text-sm text-red-800"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("proposalId", proposal.id);
                fd.set("comment", comment);
                start(async () => {
                  const r = await portalDeclineProposalAction(fd);
                  setMessage(r.ok ? "Proposal declined." : r.error ?? "Failed.");
                  if (r.ok) window.location.reload();
                });
              }}
            >
              Decline
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            I accept this proposal and scope. This is not a contract or e-signature.
          </p>
        </section>
      ) : null}
    </div>
  );
}
