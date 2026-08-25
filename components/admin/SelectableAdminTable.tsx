"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";

export type BulkActionDef = {
  id: string;
  label: string;
  /** Requires confirmation dialog with this message */
  confirm?: string;
  variant?: "default" | "primary" | "danger";
};

export type SelectableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export type BulkToolbarContext = {
  selectedIds: string[];
  clear: () => void;
  pending: boolean;
  setMessage: (message: string | null) => void;
  runWithSelection: (
    fn: (ids: string[]) => Promise<{ ok: boolean; message?: string }>,
  ) => void;
};

type Props<T> = {
  rows: T[];
  getRowId: (row: T) => string;
  columns: SelectableColumn<T>[];
  bulkActions?: BulkActionDef[];
  onBulkAction?: (
    actionId: string,
    ids: string[],
  ) => Promise<{ ok: boolean; message?: string }>;
  /** Extra toolbar controls (e.g. status selects) when rows are selected. */
  toolbarSlot?: (ctx: BulkToolbarContext) => ReactNode;
  /** When false, render a plain table without checkboxes or bulk toolbar. */
  showSelection?: boolean;
  emptyMessage?: string;
  /** Optional class for the outer card */
  className?: string;
};

export function SelectableAdminTable<T>({
  rows,
  getRowId,
  columns,
  bulkActions = [],
  onBulkAction,
  toolbarSlot,
  showSelection = true,
  emptyMessage = "No records.",
  className,
}: Props<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const ids = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = ids.some((id) => selected.has(id));
  const selectedIds = useMemo(
    () => ids.filter((id) => selected.has(id)),
    [ids, selected],
  );

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(ids));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  function runWithSelection(
    fn: (ids: string[]) => Promise<{ ok: boolean; message?: string }>,
  ) {
    const chosen = ids.filter((id) => selected.has(id));
    if (!chosen.length) return;
    start(async () => {
      const result = await fn(chosen);
      setMessage(result.message || (result.ok ? "Done." : "Action failed."));
      if (result.ok) clear();
    });
  }

  function runBulk(action: BulkActionDef) {
    if (!onBulkAction) return;
    if (action.confirm && !window.confirm(action.confirm)) return;
    runWithSelection((chosen) => onBulkAction(action.id, chosen));
  }

  const showToolbar =
    showSelection &&
    someSelected &&
    (bulkActions.length > 0 || Boolean(toolbarSlot));

  if (!rows.length) {
    return (
      <div className={`overflow-hidden rounded-lg border border-neutral-200 bg-white ${className ?? ""}`}>
        <div className="px-4 py-8 text-center text-sm text-neutral-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {showToolbar ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
          role="toolbar"
          aria-label="Bulk actions"
        >
          <span className="text-sm text-neutral-600">
            {selected.size} selected
          </span>
          {toolbarSlot?.({
            selectedIds,
            clear,
            pending,
            setMessage,
            runWithSelection,
          })}
          {bulkActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={pending}
              onClick={() => runBulk(action)}
              className={
                action.variant === "primary"
                  ? "rounded bg-[#F47A48] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  : action.variant === "danger"
                    ? "rounded border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-50"
                    : "rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 disabled:opacity-50"
              }
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            className="text-sm text-neutral-500 underline"
            onClick={clear}
          >
            Clear
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="text-sm text-neutral-600" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="overflow-x-auto overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              {showSelection ? (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              const isOn = selected.has(id);
              return (
                <tr
                  key={id}
                  className={`border-b border-neutral-100 ${isOn ? "bg-[#F47A48]/5" : ""}`}
                >
                  {showSelection ? (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggleOne(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${col.className ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
