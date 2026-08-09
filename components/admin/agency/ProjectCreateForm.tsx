"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createAgencyProjectAction } from "@/lib/admin/agency-actions";
import { AGENCY_SERVICE_TYPE_LABELS } from "@/lib/agency/constants";

type Owner = { id: string; name: string };
type Template = { id: string; name: string; serviceType: string };
type Prefill = {
  dealId?: string;
  name?: string;
  primaryContactId?: string;
  clientCompanyId?: string;
  ownerId?: string;
  serviceType?: string;
  budgetSnapshot?: string;
  currency?: string;
  summary?: string;
  targetDueDate?: string;
};

export function ProjectCreateForm({
  owners,
  templates,
  prefill,
}: {
  owners: Owner[];
  templates: Template[];
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
          const r = await createAgencyProjectAction(fd);
          if (!r.ok) alert(r.error);
          else if (r.id) router.push(`/admin/agency/projects/${r.id}`);
        });
      }}
    >
      <Field label="Project name" name="name" defaultValue={prefill?.name} required />
      <Field
        label="Primary contact ID"
        name="primaryContactId"
        defaultValue={prefill?.primaryContactId}
        required
      />
      <Field
        label="Client company ID"
        name="clientCompanyId"
        defaultValue={prefill?.clientCompanyId}
      />
      <div>
        <label className="admin-field-label">Service type</label>
        <select
          name="serviceType"
          defaultValue={prefill?.serviceType ?? "WEBSITE_DESIGN"}
          className="admin-input w-full"
        >
          {Object.entries(AGENCY_SERVICE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <Field label="Custom service name" name="customServiceName" />
      <div>
        <label className="admin-field-label">Template</label>
        <select name="templateId" defaultValue="" className="admin-input w-full">
          <option value="">No template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="admin-field-label">Owner</label>
        <select
          name="ownerId"
          defaultValue={prefill?.ownerId ?? ""}
          className="admin-input w-full"
        >
          <option value="">Current user</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date" name="startDate" type="date" />
        <Field
          label="Target due date"
          name="targetDueDate"
          type="date"
          defaultValue={prefill?.targetDueDate?.slice(0, 10)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Budget snapshot"
          name="budgetSnapshot"
          type="number"
          defaultValue={prefill?.budgetSnapshot}
        />
        <Field label="Currency" name="currency" defaultValue={prefill?.currency ?? "USD"} />
      </div>
      <div>
        <label className="admin-field-label">Summary</label>
        <textarea
          name="summary"
          defaultValue={prefill?.summary}
          className="admin-input min-h-24 w-full"
        />
      </div>
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        {pending ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="admin-field-label">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="admin-input w-full"
      />
    </div>
  );
}
