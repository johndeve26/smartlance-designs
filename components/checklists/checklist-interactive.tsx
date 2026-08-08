"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Printer, RotateCcw } from "lucide-react";
import type { ChecklistContent } from "@/data/resource-content-types";
import { getChecklistItemIds } from "@/data/checklists";
import { cn } from "@/lib/utils";

const storageKeyFor = (slug: string) => `smartlance.checklist.${slug}`;

type Store = {
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => string;
  getServerSnapshot: () => string;
  toggle: (id: string) => void;
  reset: () => void;
};

const stores = new Map<string, Store>();

function getStore(slug: string): Store {
  const existing = stores.get(slug);
  if (existing) return existing;

  const key = storageKeyFor(slug);
  const listeners = new Set<() => void>();
  let cached = "[]";

  function emit() {
    for (const listener of listeners) listener();
  }

  function readRaw(): string {
    if (typeof window === "undefined") return "[]";
    try {
      return window.localStorage.getItem(key) ?? "[]";
    } catch {
      return "[]";
    }
  }

  function writeRaw(value: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
      cached = value;
      emit();
    } catch {
      // Ignore quota / private-mode failures
    }
  }

  cached = typeof window === "undefined" ? "[]" : readRaw();

  const store: Store = {
    subscribe(onStoreChange) {
      listeners.add(onStoreChange);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          cached = event.newValue ?? "[]";
          emit();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onStoreChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      cached = readRaw();
      return cached;
    },
    getServerSnapshot() {
      return "[]";
    },
    toggle(id: string) {
      const current = new Set(parseIds(readRaw()));
      if (current.has(id)) current.delete(id);
      else current.add(id);
      writeRaw(JSON.stringify([...current]));
    },
    reset() {
      writeRaw("[]");
    },
  };

  stores.set(slug, store);
  return store;
}

function parseIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

type ChecklistInteractiveProps = {
  checklist: ChecklistContent;
  nav: { id: string; title: string; number: string }[];
};

export function ChecklistInteractive({
  checklist,
  nav,
}: ChecklistInteractiveProps) {
  const allIds = useMemo(
    () => getChecklistItemIds(checklist),
    [checklist],
  );
  const total = allIds.length;
  const store = getStore(checklist.slug);

  const raw = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const checkedIds = useMemo(() => new Set(parseIds(raw)), [raw]);
  const hydrated = raw !== undefined;
  const checkedCount = useMemo(() => {
    let count = 0;
    for (const id of allIds) {
      if (checkedIds.has(id)) count += 1;
    }
    return count;
  }, [allIds, checkedIds]);

  const toggle = useCallback(
    (id: string) => {
      store.toggle(id);
    },
    [store],
  );

  function reset() {
    if (checkedCount === 0) return;
    const confirmed = window.confirm(
      "Clear all checked items on this checklist?",
    );
    if (!confirmed) return;
    store.reset();
  }

  function printChecklist() {
    window.print();
  }

  return (
    <div className="checklist-interactive">
      <div className="print:hidden mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <a
            href="#checklist"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-cta px-5 text-[0.9375rem] font-semibold text-cta-foreground hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Start Checklist
          </a>
          <button
            type="button"
            onClick={printChecklist}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 text-[0.9375rem] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Print checklist"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print Checklist
          </button>
          {hydrated && checkedCount > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-[0.9375rem] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset Checklist
            </button>
          ) : null}
        </div>
        <p className="text-sm text-muted" aria-live="polite" aria-atomic="true">
          <span className="font-semibold text-foreground">
            Checklist progress:{" "}
          </span>
          {`${checkedCount} of ${total} checked`}
          {checkedCount === total && total > 0 ? (
            <span className="mt-1 block text-[0.875rem]">
              Checklist complete. Final project readiness still depends on your
              specific website and requirements.
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid gap-10 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-14">
        <aside className="print:hidden">
          <div className="xl:sticky xl:top-28">
            <details className="rounded-xl border border-border bg-surface xl:hidden">
              <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                Jump to section
              </summary>
              <ChecklistNavList
                nav={nav}
                className="border-t border-border px-5 pb-5 pt-3"
              />
            </details>
            <div className="hidden xl:block">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Sections
              </p>
              <ChecklistNavList nav={nav} className="mt-4" />
              <p className="mt-6 text-sm text-muted" aria-live="polite">
                {`${checkedCount} of ${total} checked`}
              </p>
            </div>
          </div>
        </aside>

        <div id="checklist" className="min-w-0 scroll-mt-28 space-y-12">
          {checklist.sections.map((section, index) => (
            <ChecklistSectionBlock
              key={section.id}
              section={section}
              number={String(index + 1).padStart(2, "0")}
              checked={checkedIds}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChecklistNavList({
  nav,
  className,
}: {
  nav: { id: string; title: string; number: string }[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-1", className)}>
      {nav.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="flex gap-3 rounded-md px-2 py-2 text-[0.9375rem] leading-snug text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="font-display text-xs font-semibold tabular-nums text-accent-text">
              {item.number}
            </span>
            <span className="line-clamp-2">{item.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function ChecklistSectionBlock({
  section,
  number,
  checked,
  onToggle,
}: {
  section: ChecklistContent["sections"][number];
  number: string;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section id={section.id} className="scroll-mt-28 break-inside-avoid">
      <div className="border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          Section {number}
        </p>
        <h2 className="mt-2 font-display text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.875rem]">
          {section.title}
        </h2>
        {section.description ? (
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            {section.description}
          </p>
        ) : null}
      </div>

      {section.callout ? (
        <div className="mt-5 rounded-xl border border-border bg-surface-muted px-4 py-4 sm:px-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-text">
            {section.callout.tone === "avoid"
              ? "Avoid"
              : section.callout.tone === "tip"
                ? "Tip"
                : "Important"}
          </p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            {section.callout.body}
          </p>
          {section.callout.href && section.callout.linkLabel ? (
            <a
              href={section.callout.href}
              className="mt-3 inline-flex text-sm font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent print:hidden"
            >
              {section.callout.linkLabel} →
            </a>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-5 space-y-1">
        {section.items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            checked={checked.has(item.id)}
            onToggle={onToggle}
          />
        ))}
      </ul>

      {section.subgroups?.map((subgroup) => (
        <div key={subgroup.id} className="mt-8">
          <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            {subgroup.title}
          </h3>
          <ul className="mt-3 space-y-1">
            {subgroup.items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                checked={checked.has(item.id)}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function ChecklistItemRow({
  item,
  checked,
  onToggle,
}: {
  item: ChecklistContent["sections"][number]["items"][number];
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  const inputId = `item-${item.id}`;

  return (
    <li className="break-inside-avoid rounded-lg print:rounded-none">
      <div className="flex gap-3 px-2 py-2.5 sm:gap-3.5 sm:px-2.5 sm:py-3">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(item.id)}
          className="checklist-checkbox mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 print:appearance-auto"
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={inputId}
            className={cn(
              "block cursor-pointer text-[1rem] leading-snug text-foreground sm:text-[1.0625rem]",
              checked &&
                "text-muted line-through decoration-border print:no-underline print:text-foreground",
            )}
          >
            {item.text}
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-subtle">
            {item.priority === "critical" ? (
              <span className="font-semibold uppercase tracking-[0.08em] text-accent-text">
                Critical
              </span>
            ) : null}
            {item.appliesWhen ? (
              <span className="rounded border border-border px-1.5 py-0.5 font-medium uppercase tracking-[0.06em]">
                {item.appliesWhen}
              </span>
            ) : null}
            {item.description ? (
              <span className="text-muted">{item.description}</span>
            ) : null}
            {item.relatedHref && item.relatedLabel ? (
              <a
                href={item.relatedHref}
                className="font-medium text-accent-text hover:underline print:hidden"
              >
                {item.relatedLabel}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
