"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateContactPropertyAction,
} from "@/lib/admin/crm-property-actions";
import { FIELD_TYPE_LABELS } from "@/lib/crm/properties/constants";
import { parsePropertyOptions } from "@/lib/crm/properties/options";
import { PropertyOptionEditor } from "@/components/admin/crm/PropertyOptionEditor";
import type { CrmPropertyDefinition, CrmPropertyFieldType } from "@prisma/client";
import type { PropertySelectOption } from "@/lib/crm/properties/constants";

export function PropertyDefinitionEditor({
  definition,
  valueCount,
}: {
  definition: CrmPropertyDefinition;
  valueCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [label, setLabel] = useState(definition.label);
  const [description, setDescription] = useState(definition.description ?? "");
  const [isRequired, setIsRequired] = useState(definition.isRequired);
  const [fieldType, setFieldType] = useState(definition.fieldType);
  const [options, setOptions] = useState<PropertySelectOption[]>(() => parsePropertyOptions(definition));

  const isSelect = fieldType === "SINGLE_SELECT" || fieldType === "MULTI_SELECT";
  const typeLocked = valueCount > 0;

  async function save() {
    setPending(true);
    setError(null);
    const res = await updateContactPropertyAction({
      id: definition.id,
      label,
      description,
      isRequired,
      fieldType: fieldType !== definition.fieldType ? fieldType : undefined,
      options: isSelect ? options : undefined,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <AdminPanel className="space-y-4">
      <h2 className="font-semibold">{definition.label}</h2>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <label className="block text-sm">
        Label
        <input className="admin-input mt-1 w-full" value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>

      <div className="text-sm">
        <span className="text-neutral-600">Internal key</span>
        <p className="mt-1 font-mono text-sm">{definition.key}</p>
      </div>

      <label className="block text-sm">
        Type
        {typeLocked ? (
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded bg-neutral-100 px-2 py-1">{FIELD_TYPE_LABELS[definition.fieldType]}</span>
            <span className="text-xs text-neutral-500">locked</span>
          </div>
        ) : (
          <select
            className="admin-input mt-1 w-full"
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as CrmPropertyFieldType)}
          >
            {(Object.keys(FIELD_TYPE_LABELS) as CrmPropertyFieldType[]).map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
            ))}
          </select>
        )}
        {typeLocked ? (
          <p className="mt-1 text-xs text-neutral-500">
            Field type cannot be changed after this property has stored values.
            Used by {valueCount} contact{valueCount === 1 ? "" : "s"}.
          </p>
        ) : (
          <p className="mt-1 text-xs text-neutral-500">Type can be changed while no values exist.</p>
        )}
      </label>

      <label className="block text-sm">
        Description
        <textarea
          className="admin-input mt-1 w-full"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
        Required on contact forms
      </label>

      {isSelect ? (
        <div>
          <h3 className="text-sm font-medium">Options</h3>
          <PropertyOptionEditor options={options} onChange={setOptions} />
        </div>
      ) : null}

      <button type="button" className="admin-btn admin-btn-primary" disabled={pending} onClick={save}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </AdminPanel>
  );
}
