"use client";

import { useState } from "react";
import type { PropertySelectOption } from "@/lib/crm/properties/constants";
import { createOptionKey } from "@/lib/crm/properties/options";

export function PropertyOptionEditor({
  options,
  onChange,
  disabled,
}: {
  options: PropertySelectOption[];
  onChange: (next: PropertySelectOption[]) => void;
  disabled?: boolean;
}) {
  const [newLabel, setNewLabel] = useState("");

  const active = options.filter((o) => o.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  const inactive = options.filter((o) => !o.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  function updateOption(key: string, patch: Partial<PropertySelectOption>) {
    onChange(options.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  }

  function moveOption(key: string, dir: -1 | 1) {
    const sorted = [...active];
    const idx = sorted.findIndex((o) => o.key === key);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= sorted.length) return;
    [sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]];
    const reordered = sorted.map((o, i) => ({ ...o, displayOrder: i }));
    onChange([
      ...reordered,
      ...inactive,
    ]);
  }

  function addOption() {
    const label = newLabel.trim();
    if (!label) return;
    const keys = new Set(options.map((o) => o.key));
    const key = createOptionKey(label, keys);
    onChange([
      ...options,
      { key, label, displayOrder: active.length, isActive: true },
    ]);
    setNewLabel("");
  }

  function deactivate(key: string) {
    updateOption(key, { isActive: false });
  }

  function restore(key: string) {
    updateOption(key, { isActive: true, displayOrder: active.length });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {active.map((o) => (
          <div key={o.key} className="flex flex-wrap items-center gap-2 rounded border p-2">
            <span className="text-neutral-400">☰</span>
            <input
              className="admin-input flex-1 text-sm"
              value={o.label}
              disabled={disabled}
              onChange={(e) => updateOption(o.key, { label: e.target.value })}
            />
            <span className="font-mono text-xs text-neutral-500">{o.key}</span>
            {!disabled ? (
              <>
                <button type="button" className="text-xs hover:underline" onClick={() => moveOption(o.key, -1)}>↑</button>
                <button type="button" className="text-xs hover:underline" onClick={() => moveOption(o.key, 1)}>↓</button>
                <button type="button" className="text-xs text-amber-700 hover:underline" onClick={() => deactivate(o.key)}>Deactivate</button>
              </>
            ) : null}
          </div>
        ))}
      </div>

      {!disabled ? (
        <div className="flex gap-2">
          <input
            className="admin-input flex-1 text-sm"
            placeholder="New option label…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption();
              }
            }}
          />
          <button type="button" className="admin-btn admin-btn-secondary text-sm" onClick={addOption}>
            + Add option
          </button>
        </div>
      ) : null}

      {inactive.length ? (
        <div className="border-t pt-3">
          <p className="text-xs font-medium text-neutral-600">Inactive options</p>
          <ul className="mt-2 space-y-1 text-sm">
            {inactive.map((o) => (
              <li key={o.key} className="flex items-center justify-between gap-2">
                <span>{o.label} <span className="text-neutral-500">({o.key})</span></span>
                {!disabled ? (
                  <button type="button" className="text-xs hover:underline" onClick={() => restore(o.key)}>
                    Restore
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
