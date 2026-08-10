"use client";

import type { ContactFilterMetadata } from "@/lib/admin/crm-filter-actions";
import { listCountryOptions } from "@/lib/crm/country";
import type { FilterFieldDef, FilterOperatorDef } from "@/lib/crm/filters/filter-ui-registry";

export function FilterValueEditor({
  field,
  operator,
  value,
  metadata,
  onChange,
}: {
  field: FilterFieldDef;
  operator: FilterOperatorDef;
  value: unknown;
  metadata: ContactFilterMetadata;
  onChange: (value: unknown) => void;
}) {
  switch (operator.valueKind) {
    case "none":
      return null;
    case "text":
      return (
        <input
          className="admin-input w-full text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Value…"
        />
      );
    case "number":
      if (operator.value === "BETWEEN") {
        const range = Array.isArray(value) ? value : ["", ""];
        return (
          <div className="flex gap-1">
            <input
              className="admin-input text-sm"
              type="number"
              value={String(range[0] ?? "")}
              onChange={(e) => onChange([e.target.value, range[1]])}
              placeholder="Min"
            />
            <input
              className="admin-input text-sm"
              type="number"
              value={String(range[1] ?? "")}
              onChange={(e) => onChange([range[0], e.target.value])}
              placeholder="Max"
            />
          </div>
        );
      }
      return (
        <input
          className="admin-input w-full text-sm"
          type="number"
          value={value != null && value !== "" ? String(value) : ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder="Number…"
        />
      );
    case "boolean":
      return (
        <select
          className="admin-input w-full text-sm"
          value={value === true ? "true" : value === false ? "false" : ""}
          onChange={(e) => onChange(e.target.value === "true")}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    case "date":
      return (
        <input
          className="admin-input w-full text-sm"
          type="date"
          value={typeof value === "string" ? value.slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined)}
        />
      );
    case "dateRange": {
      const range = Array.isArray(value) ? value : ["", ""];
      return (
        <div className="flex gap-1">
          <input
            className="admin-input text-sm"
            type="date"
            value={typeof range[0] === "string" ? range[0].slice(0, 10) : ""}
            onChange={(e) =>
              onChange([
                e.target.value ? `${e.target.value}T00:00:00.000Z` : "",
                range[1],
              ])
            }
          />
          <input
            className="admin-input text-sm"
            type="date"
            value={typeof range[1] === "string" ? range[1].slice(0, 10) : ""}
            onChange={(e) =>
              onChange([
                range[0],
                e.target.value ? `${e.target.value}T23:59:59.999Z` : "",
              ])
            }
          />
        </div>
      );
    }
    case "enum":
      return (
        <select
          className="admin-input w-full text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {field.kind === "STANDARD" &&
            field.enumValues?.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
        </select>
      );
    case "enumMulti": {
      const selected = Array.isArray(value) ? value.map(String) : [];
      const options =
        field.kind === "CUSTOM"
          ? field.options
          : field.kind === "STANDARD"
            ? field.enumValues?.map((v) => ({
                key: v.value,
                label: v.label,
                isActive: true,
                displayOrder: 0,
              })) ?? []
            : [];
      return (
        <select
          className="admin-input w-full text-sm"
          multiple
          size={Math.min(6, Math.max(3, options.length))}
          value={selected}
          onChange={(e) => {
            const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
            onChange(vals);
          }}
        >
          {options.map((o) => {
            const key = "key" in o ? o.key : (o as { value: string }).value;
            const label = o.label;
            const inactive = "isActive" in o && !o.isActive;
            return (
              <option key={key} value={key}>
                {label}{inactive ? " (inactive)" : ""}
              </option>
            );
          })}
        </select>
      );
    }
    case "country": {
      const selected = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
      const countries = metadata.countries.length ? metadata.countries : listCountryOptions();
      return (
        <select
          className="admin-input w-full text-sm"
          multiple={operator.value === "IN"}
          size={operator.value === "IN" ? 5 : 1}
          value={selected}
          onChange={(e) => {
            if (operator.value === "IN") {
              onChange(Array.from(e.target.selectedOptions).map((o) => o.value));
            } else {
              onChange(e.target.value);
            }
          }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      );
    }
    case "company":
      return (
        <select
          className="admin-input w-full text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select company…</option>
          {metadata.companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      );
    case "owner":
      return (
        <select
          className="admin-input w-full text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select owner…</option>
          {metadata.owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      );
    default:
      return (
        <input
          className="admin-input w-full text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
