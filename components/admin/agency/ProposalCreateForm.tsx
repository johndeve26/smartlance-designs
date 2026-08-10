"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createProposalAction } from "@/lib/admin/proposal-actions";

type Owner = { id: string; name: string };
type Prefill = {
  dealId?: string;
  title?: string;
  primaryContactId?: string;
  companyId?: string;
  ownerId?: string;
  currency?: string;
  summary?: string;
};

export function ProposalCreateForm({
  owners,
  prefill,
}: {
  owners: Owner[];
  prefill?: Prefill;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await createProposalAction(fd);
          if (!r.ok) alert(r.error);
          else if (r.id) router.push(`/admin/agency/proposals/${r.id}`);
        });
      }}
    >
      {prefill?.dealId ? (
        <input type="hidden" name="dealId" value={prefill.dealId} />
      ) : null}
      <Field label="Proposal title" name="title" defaultValue={prefill?.title} required />
      <Field
        label="Primary contact ID"
        name="primaryContactId"
        defaultValue={prefill?.primaryContactId}
        required
      />
      <Field label="Company ID" name="companyId" defaultValue={prefill?.companyId} />
      <div>
        <label className="admin-field-label">Owner</label>
        <select name="ownerId" defaultValue={prefill?.ownerId ?? ""} className="admin-input w-full">
          <option value="">Current user</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>
      <Field label="Currency" name="currency" defaultValue={prefill?.currency ?? "USD"} maxLength={3} />
      <div>
        <label className="admin-field-label">Summary</label>
        <textarea
          name="summary"
          defaultValue={prefill?.summary}
          className="admin-input min-h-24 w-full"
        />
      </div>
      <div>
        <label className="admin-field-label">Internal notes</label>
        <textarea name="internalNotes" className="admin-input min-h-20 w-full" />
      </div>
      <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
        {pending ? "Creating…" : "Create proposal"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="admin-field-label">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        className="admin-input w-full"
      />
    </div>
  );
}
