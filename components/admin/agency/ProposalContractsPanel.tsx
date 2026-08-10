"use client";

import { useTransition } from "react";
import { createContractFromAcceptanceAction } from "@/lib/admin/contract-actions";
import { CONTRACT_STATUS_LABELS } from "@/lib/contracts/constants";
import { AgencyBadge } from "@/components/admin/agency/AgencySubNavBar";
import { contractStatusTone } from "@/lib/contracts/display";
import Link from "next/link";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

type ContractRow = {
  id: string;
  contractNumber: string;
  title: string;
  status: keyof typeof CONTRACT_STATUS_LABELS;
};

type TemplateOption = {
  id: string;
  name: string;
  versionId: string;
};

export function ProposalContractsPanel({
  proposalId,
  proposalStatus,
  primaryContactId,
  contracts,
  templates,
  canManage,
}: {
  proposalId: string;
  proposalStatus: string;
  primaryContactId: string;
  contracts: ContractRow[];
  templates: TemplateOption[];
  canManage: boolean;
}) {
  const [pending, start] = useTransition();

  if (proposalStatus !== "ACCEPTED") return null;

  return (
    <AdminPanel className="space-y-3">
      <h2 className="font-semibold">Contracts</h2>
      {contracts.length ? (
        <ul className="divide-y text-sm">
          {contracts.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <Link href={`/admin/agency/contracts/${c.id}`} className="font-medium hover:underline">
                {c.contractNumber} · {c.title}
              </Link>
              <AgencyBadge tone={contractStatusTone(c.status)}>{CONTRACT_STATUS_LABELS[c.status]}</AgencyBadge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">No contracts yet for this accepted proposal.</p>
      )}

      {canManage ? (
        <form
          className="space-y-2 border-t pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("proposalId", proposalId);
            fd.set("clientSignerContactId", primaryContactId);
            start(async () => {
              const r = await createContractFromAcceptanceAction(fd);
              if (r.ok && r.id) {
                window.location.href = `/admin/agency/contracts/${r.id}`;
              } else {
                alert(r.error ?? "Could not create contract.");
              }
            });
          }}
        >
          <p className="text-sm text-neutral-600">
            Create a contract from the immutable acceptance snapshot. Use contract language reviewed
            for your business and jurisdiction.
          </p>
          <input name="title" placeholder="Contract title (optional)" className="admin-input w-full" />
          <select name="templateVersionId" className="admin-input w-full">
            <option value="">No template (blank draft)</option>
            {templates.map((t) => (
              <option key={t.versionId} value={t.versionId}>
                {t.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="agencySignerRequired" value="true" />
            Require Smartlance countersignature
          </label>
          <input type="datetime-local" name="expiresAt" className="admin-input w-full" />
          <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
            Create contract
          </button>
        </form>
      ) : null}
    </AdminPanel>
  );
}
