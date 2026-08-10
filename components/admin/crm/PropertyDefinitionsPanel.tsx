"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createContactPropertyAction,
  archiveContactPropertyAction,
  restoreContactPropertyAction,
} from "@/lib/admin/crm-property-actions";
import { FIELD_TYPE_LABELS } from "@/lib/crm/properties/constants";
import { PropertyOptionEditor } from "@/components/admin/crm/PropertyOptionEditor";
import type { CrmPropertyDefinition, CrmPropertyFieldType } from "@prisma/client";
import type { PropertySelectOption } from "@/lib/crm/properties/constants";

export function PropertyDefinitionsPanel({
  definitions,
}: {
  definitions: CrmPropertyDefinition[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fieldType, setFieldType] = useState<CrmPropertyFieldType>("TEXT");
  const [options, setOptions] = useState<PropertySelectOption[]>([]);

  const isSelect = fieldType === "SINGLE_SELECT" || fieldType === "MULTI_SELECT";

  async function createProperty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createContactPropertyAction({
      label: String(fd.get("label") ?? ""),
      key: String(fd.get("key") ?? "") || undefined,
      fieldType,
      description: String(fd.get("description") ?? "") || undefined,
      options: isSelect ? options : undefined,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    e.currentTarget.reset();
    setOptions([]);
    setFieldType("TEXT");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <AdminPanel>
        <form onSubmit={createProperty} className="grid gap-3 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Create property</h2>
          {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
          <label className="text-sm">Label<input className="admin-input mt-1" name="label" required /></label>
          <label className="text-sm">Key (optional)<input className="admin-input mt-1" name="key" placeholder="annual_revenue" /></label>
          <label className="text-sm sm:col-span-2">
            Type
            <select
              className="admin-input mt-1"
              name="fieldType"
              value={fieldType}
              onChange={(e) => {
                setFieldType(e.target.value as CrmPropertyFieldType);
                setOptions([]);
              }}
            >
              {(Object.keys(FIELD_TYPE_LABELS) as CrmPropertyFieldType[]).map((t) => (
                <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          {isSelect ? (
            <div className="sm:col-span-2">
              <p className="text-sm font-medium">Options</p>
              <PropertyOptionEditor options={options} onChange={setOptions} />
            </div>
          ) : null}
          <label className="text-sm sm:col-span-2">Description<textarea className="admin-input mt-1" name="description" rows={2} /></label>
          <button type="submit" className="admin-btn admin-btn-primary sm:col-span-2" disabled={pending}>
            {pending ? "Creating…" : "Create property"}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel flush className="overflow-x-auto">
        <table className="admin-table min-w-full text-sm">
          <thead>
            <tr>
              <th>Label</th>
              <th>Key</th>
              <th>Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {definitions.map((d) => (
              <tr key={d.id}>
                <td>
                  <Link href={`/admin/crm/settings/properties/${d.id}`} className="font-medium hover:underline">
                    {d.label}
                  </Link>
                </td>
                <td className="font-mono text-xs">{d.key}</td>
                <td>{FIELD_TYPE_LABELS[d.fieldType]}</td>
                <td>{d.isActive ? "Active" : "Archived"}</td>
                <td className="space-x-2">
                  <Link href={`/admin/crm/settings/properties/${d.id}`} className="text-sm hover:underline">
                    Edit
                  </Link>
                  {d.isActive ? (
                    <button
                      type="button"
                      className="text-sm hover:underline"
                      onClick={async () => {
                        await archiveContactPropertyAction(d.id);
                        router.refresh();
                      }}
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-sm hover:underline"
                      onClick={async () => {
                        await restoreContactPropertyAction(d.id);
                        router.refresh();
                      }}
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminPanel>
    </div>
  );
}
