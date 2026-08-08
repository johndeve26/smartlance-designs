"use client";

import { useMemo, useState, useTransition } from "react";
import type { NavigationMenuKey } from "@prisma/client";
import type { NavDraftItem, NavValidationIssue } from "@/lib/repositories/navigationRepository";
import {
  publishNavigationAction,
  saveNavigationAction,
} from "@/lib/admin/phase4-actions";

export function NavigationEditor({
  menuKey,
  label,
  initialItems,
  initialIssues,
}: {
  menuKey: NavigationMenuKey;
  label: string;
  initialItems: NavDraftItem[];
  initialIssues: NavValidationIssue[];
}) {
  const [items, setItems] = useState<NavDraftItem[]>(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const preview = useMemo(
    () =>
      items.map((item) => ({
        label: item.label,
        href: item.href,
        children: item.children?.length ?? 0,
      })),
    [items],
  );

  function updateItem(index: number, patch: Partial<NavDraftItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next.map((item, i) => ({ ...item, displayOrder: i }));
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        label: "New link",
        href: "/",
        displayOrder: prev.length,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
      <div className="space-y-4 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{label}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-sm"
              onClick={addItem}
            >
              Add item
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded border px-3 py-1.5 text-sm"
              onClick={() =>
                start(async () => {
                  const res = await saveNavigationAction({
                    menuKey,
                    itemsJson: JSON.stringify(items),
                  });
                  setMessage(res.ok ? "Draft saved." : res.error);
                })
              }
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded bg-[#F47A48] px-3 py-1.5 text-sm font-semibold text-white"
              onClick={() =>
                start(async () => {
                  const save = await saveNavigationAction({
                    menuKey,
                    itemsJson: JSON.stringify(items),
                  });
                  if (!save.ok) {
                    setMessage(save.error);
                    return;
                  }
                  const res = await publishNavigationAction(menuKey);
                  setMessage(
                    res.ok
                      ? `Published.${res.warnings?.length ? ` ${res.warnings.length} warning(s).` : ""}`
                      : res.error,
                  );
                })
              }
            >
              Publish
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className="rounded border border-neutral-200 p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex-1 text-sm">
                  Label
                  <input
                    value={item.label}
                    onChange={(e) => updateItem(index, { label: e.target.value })}
                    className="mt-1 w-full rounded border px-2 py-1.5"
                  />
                </label>
                <label className="flex-[1.4] text-sm">
                  Href
                  <input
                    value={item.href}
                    onChange={(e) => updateItem(index, { href: e.target.value })}
                    className="mt-1 w-full rounded border px-2 py-1.5"
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${item.label} up`}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${item.label} down`}
                >
                  Move down
                </button>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(item.openInNewTab)}
                    onChange={(e) =>
                      updateItem(index, { openInNewTab: e.target.checked })
                    }
                  />
                  Open in new tab
                </label>
                <button
                  type="button"
                  className="ml-auto text-xs text-red-700"
                  onClick={() => removeItem(index)}
                >
                  Remove
                </button>
              </div>
              {item.children?.length ? (
                <p className="mt-2 text-xs text-neutral-500">
                  {item.children.length} nested child link(s) preserved from
                  import. Edit nested structure via republish/import if needed.
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        {message ? (
          <p className="text-sm text-neutral-700" role="status">
            {message}
          </p>
        ) : null}

        {initialIssues.length ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-medium text-amber-900">Link validation</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-950">
              {initialIssues.map((issue, i) => (
                <li key={`${issue.href}-${i}`}>
                  <span className="font-medium uppercase">{issue.severity}</span>:{" "}
                  {issue.label} ({issue.href}) — {issue.message}
                  {issue.canonicalHref ? ` → ${issue.canonicalHref}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Preview
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {preview.map((item) => (
              <li key={item.href + item.label}>
                <span className="font-medium">{item.label}</span>
                <span className="text-neutral-500"> → {item.href}</span>
                {item.children ? (
                  <span className="text-neutral-400"> ({item.children} children)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        {menuKey.startsWith("FOOTER_") && items.length > 12 ? (
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This footer group is unusually large ({items.length} links). Prefer
            curated lists for scanability.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
