"use client";

import { useMemo, useState } from "react";
import type { ContactFilterCondition, ContactFilterV3 } from "@/lib/crm/filters/contact-filter-schema";
import { CRM_CONTACT_FILTER_MAX_CONDITIONS } from "@/lib/crm/properties/constants";
import type { ContactFilterMetadata } from "@/lib/admin/crm-filter-actions";
import {
  getOperatorsForField,
  operatorNeedsValue,
  type FilterFieldDef,
  type FilterOperatorDef,
} from "@/lib/crm/filters/filter-ui-registry";
import { FilterValueEditor } from "@/components/admin/crm/filters/FilterValueEditor";

function defaultConditionForField(field: FilterFieldDef): ContactFilterCondition {
  const op = field.operators[0]?.value ?? "IS";
  if (field.kind === "CUSTOM") {
    return { kind: "CUSTOM", propertyId: field.propertyId, operator: op };
  }
  if (field.kind === "SOCIAL") {
    return { kind: "SOCIAL", platform: field.platform as never, operator: op as "HAS" };
  }
  if (field.kind === "NOTES") {
    return { kind: "NOTES", operator: "CONTAINS", value: "" };
  }
  if (field.kind === "ENGAGEMENT") {
    return { kind: "ENGAGEMENT", field: field.field, operator: op as "IS_TRUE" };
  }
  return { kind: "STANDARD", field: field.field as never, operator: op };
}

function fieldForCondition(
  cond: ContactFilterCondition,
  fields: FilterFieldDef[],
): FilterFieldDef | undefined {
  if (cond.kind === "CUSTOM") {
    return fields.find((f) => f.kind === "CUSTOM" && f.propertyId === cond.propertyId);
  }
  if (cond.kind === "SOCIAL") {
    return fields.find((f) => f.kind === "SOCIAL" && f.platform === cond.platform);
  }
  if (cond.kind === "NOTES") {
    return fields.find((f) => f.kind === "NOTES");
  }
  if (cond.kind === "ENGAGEMENT") {
    return fields.find((f) => f.kind === "ENGAGEMENT" && f.field === cond.field);
  }
  return fields.find((f) => f.kind === "STANDARD" && f.field === cond.field);
}

function ConditionRow({
  condition,
  fields,
  metadata,
  onChange,
  onRemove,
}: {
  condition: ContactFilterCondition;
  fields: FilterFieldDef[];
  metadata: ContactFilterMetadata;
  onChange: (next: ContactFilterCondition) => void;
  onRemove: () => void;
}) {
  const [fieldSearch, setFieldSearch] = useState("");
  const selectedField = fieldForCondition(condition, fields);
  const operators = selectedField ? getOperatorsForField(selectedField) : [];
  const selectedOp = operators.find((o) => o.value === ("operator" in condition ? condition.operator : ""));

  const groupedFields = useMemo(() => {
    const q = fieldSearch.trim().toLowerCase();
    const filtered = q
      ? fields.filter((f) => {
          const label = f.kind === "CUSTOM" ? f.label : f.label;
          return label.toLowerCase().includes(q);
        })
      : fields;
    const groups = new Map<string, FilterFieldDef[]>();
    for (const f of filtered) {
      const g = f.group;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(f);
    }
    return groups;
  }, [fields, fieldSearch]);

  const fieldWarning =
    selectedField?.kind === "CUSTOM" && !selectedField.isActive
      ? "This property is archived."
      : selectedField?.kind === "CUSTOM" && !fields.some((f) => f.kind === "CUSTOM" && f.propertyId === selectedField.propertyId && f.isActive)
        ? "Property definition missing."
        : null;

  return (
    <div className="flex flex-wrap items-start gap-2 rounded border border-neutral-200 bg-neutral-50 p-2">
      <div className="min-w-[180px] flex-1">
        <input
          className="admin-input mb-1 text-xs"
          placeholder="Search fields…"
          value={fieldSearch}
          onChange={(e) => setFieldSearch(e.target.value)}
        />
        <select
          className="admin-input w-full text-sm"
          value={selectedField?.id ?? ""}
          onChange={(e) => {
            const f = fields.find((x) => x.id === e.target.value);
            if (f) onChange(defaultConditionForField(f));
          }}
        >
          <option value="">Select field…</option>
          {[...groupedFields.entries()].map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                  {f.kind === "CUSTOM" && !f.isActive ? " (archived)" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {fieldWarning ? <p className="mt-1 text-xs text-amber-700">{fieldWarning}</p> : null}
      </div>

      <select
        className="admin-input min-w-[140px] text-sm"
        value={"operator" in condition ? condition.operator : ""}
        disabled={!selectedField}
        onChange={(e) => {
          const op = e.target.value;
          onChange({ ...condition, operator: op } as ContactFilterCondition);
        }}
      >
        {operators.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {selectedField && selectedOp && operatorNeedsValue(selectedOp) ? (
        <div className="min-w-[160px] flex-1">
          <FilterValueEditor
            field={selectedField}
            operator={selectedOp}
            value={"value" in condition ? condition.value : undefined}
            metadata={metadata}
            onChange={(value) => onChange({ ...condition, value } as ContactFilterCondition)}
          />
        </div>
      ) : null}

      <button type="button" className="admin-btn admin-btn-secondary text-xs" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

export function ContactFilterBuilder({
  metadata,
  value,
  onChange,
  showMatchMode = true,
}: {
  metadata: ContactFilterMetadata;
  value: ContactFilterV3;
  onChange: (next: ContactFilterV3) => void;
  showMatchMode?: boolean;
}) {
  const activeFields = metadata.fields.filter(
    (f) => f.kind !== "CUSTOM" || f.isActive,
  );
  const displayFields = metadata.fields;

  function setCondition(idx: number, next: ContactFilterCondition) {
    const conditions = [...value.conditions];
    conditions[idx] = next;
    onChange({ ...value, conditions });
  }

  function addCondition() {
    if (value.conditions.length >= CRM_CONTACT_FILTER_MAX_CONDITIONS) return;
    const first = activeFields[0];
    if (!first) return;
    onChange({
      ...value,
      conditions: [...value.conditions, defaultConditionForField(first)],
    });
  }

  const atLimit = value.conditions.length >= CRM_CONTACT_FILTER_MAX_CONDITIONS;

  return (
    <div className="space-y-3">
      {showMatchMode ? (
        <label className="flex items-center gap-2 text-sm">
          Match
          <select
            className="admin-input"
            value={value.match}
            onChange={(e) => onChange({ ...value, match: e.target.value as "ALL" | "ANY" })}
          >
            <option value="ALL">ALL</option>
            <option value="ANY">ANY</option>
          </select>
        </label>
      ) : null}

      {value.conditions.length === 0 ? (
        <p className="text-sm text-neutral-500">No filter conditions. Add one below.</p>
      ) : null}

      {value.conditions.map((cond, idx) => (
        <ConditionRow
          key={idx}
          condition={cond}
          fields={displayFields}
          metadata={metadata}
          onChange={(next) => setCondition(idx, next)}
          onRemove={() =>
            onChange({ ...value, conditions: value.conditions.filter((_, i) => i !== idx) })
          }
        />
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="admin-btn admin-btn-secondary text-sm"
          disabled={atLimit}
          onClick={addCondition}
        >
          + Add filter
        </button>
        {atLimit ? (
          <span className="text-xs text-amber-700">Maximum {CRM_CONTACT_FILTER_MAX_CONDITIONS} conditions.</span>
        ) : null}
      </div>
    </div>
  );
}

export function filterSummaryChips(
  filter: ContactFilterV3,
  fields: FilterFieldDef[],
): string[] {
  return filter.conditions.map((cond) => {
    const field = fieldForCondition(cond, fields);
    const label = field?.label ?? "Unknown field";
    const op = "operator" in cond ? cond.operator : "";
    const val = "value" in cond ? cond.value : undefined;
    if (op === "IS_KNOWN" || op === "HAS" || op === "IS_TRUE") return `${label}: known`;
    if (op === "IS_UNKNOWN" || op === "MISSING" || op === "IS_FALSE") return `${label}: unknown`;
    if (val == null || val === "") return `${label} ${op}`;
    if (Array.isArray(val)) return `${label} ${op} ${val.join(", ")}`;
    return `${label} ${op} ${String(val)}`;
  });
}
