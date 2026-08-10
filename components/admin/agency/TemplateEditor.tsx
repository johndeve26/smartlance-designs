"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  createAgencyTemplateAction,
  updateAgencyTemplateAction,
} from "@/lib/admin/agency-actions";
import { AGENCY_SERVICE_TYPE_LABELS } from "@/lib/agency/constants";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

type TemplateData = {
  id?: string;
  name: string;
  description?: string;
  serviceType: string;
  milestones?: Array<{
    title: string;
    tasks: Array<{ title: string }>;
  }>;
  requirements?: Array<{ title: string }>;
};

export function TemplateEditor({ template }: { template?: TemplateData }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!template?.id) {
    return (
      <AdminPanel className="max-w-xl space-y-4">
        <form
          className="space-y-4"
          onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const r = await createAgencyTemplateAction(fd);
            if (!r.ok) alert(r.error);
            else if (r.id) router.push(`/admin/agency/templates/${r.id}`);
          });
        }}
      >
        <Field label="Template name" name="name" required />
        <div>
          <label className="admin-field-label">Service type</label>
          <select name="serviceType" defaultValue="WEBSITE_DESIGN" className="admin-input w-full">
            {Object.entries(AGENCY_SERVICE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-field-label">Description</label>
          <textarea name="description" className="admin-input min-h-24 w-full" />
        </div>
        <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
          {pending ? "Creating…" : "Create template"}
        </button>
        </form>
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPanel className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const r = await updateAgencyTemplateAction(fd);
            if (!r.ok) alert(r.error);
            else router.refresh();
          });
        }}
      >
        <input type="hidden" name="templateId" value={template.id} />
        <Field label="Template name" name="name" defaultValue={template.name} required />
        <div>
          <label className="admin-field-label">Service type</label>
          <select
            name="serviceType"
            defaultValue={template.serviceType}
            className="admin-input w-full"
          >
            {Object.entries(AGENCY_SERVICE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-field-label">Description</label>
          <textarea
            name="description"
            defaultValue={template.description ?? ""}
            className="admin-input min-h-24 w-full"
          />
        </div>
        <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
          {pending ? "Saving…" : "Save template"}
        </button>
        </form>
      </AdminPanel>

      <AdminPanel className="space-y-3">
        <h2 className="font-semibold">Milestones & tasks</h2>
        {(template.milestones ?? []).map((ms, i) => (
          <div key={i} className="rounded border p-3 text-sm">
            <p className="font-medium">{ms.title}</p>
            <ul className="mt-2 list-disc pl-5 text-neutral-600">
              {ms.tasks.map((t, ti) => (
                <li key={ti}>{t.title}</li>
              ))}
            </ul>
          </div>
        ))}
        {!template.milestones?.length ? (
          <p className="text-sm text-neutral-500">No milestones defined yet.</p>
        ) : null}
      </AdminPanel>

      <AdminPanel className="space-y-3">
        <h2 className="font-semibold">Requirements</h2>
        <ul className="list-disc pl-5 text-sm text-neutral-700">
          {(template.requirements ?? []).map((r, i) => (
            <li key={i}>{r.title}</li>
          ))}
        </ul>
        {!template.requirements?.length ? (
          <p className="text-sm text-neutral-500">No requirements defined yet.</p>
        ) : null}
      </AdminPanel>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="admin-field-label">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="admin-input w-full"
      />
    </div>
  );
}
