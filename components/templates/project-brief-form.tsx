"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { Check, Copy, Printer, RotateCcw } from "lucide-react";
import type {
  TemplateContent,
  TemplateField,
} from "@/data/resource-content-types";
import { isTemplateFieldVisible } from "@/data/templates";
import { cn } from "@/lib/utils";
import {
  buildBriefPlainText,
  countStartedSections,
  getFieldDisplayValue,
  type TemplateValues,
} from "@/components/templates/brief-plain-text";
import { BriefAiHelpButton } from "@/components/prospect/BriefAiHelpButton";
import { buildBriefContextForField } from "@/lib/prospect/ai/brief-field-context";

const STORAGE_PREFIX = "smartlance.template.";

type Props = {
  template: TemplateContent;
  nav: { id: string; title: string; number: string }[];
};

type Store = {
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => string;
  getServerSnapshot: () => string;
  setValue: (fieldId: string, value: string | string[]) => void;
  reset: () => void;
};

const stores = new Map<string, Store>();

function storageKeyFor(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function parseValues(raw: string): TemplateValues {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const result: TemplateValues = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        result[key] = value;
      } else if (
        Array.isArray(value) &&
        value.every((item): item is string => typeof item === "string")
      ) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function isEmptyValue(value: string | string[]): boolean {
  if (typeof value === "string") return value.trim().length === 0;
  return value.length === 0;
}

function getStore(slug: string): Store {
  const existing = stores.get(slug);
  if (existing) return existing;

  const key = storageKeyFor(slug);
  const listeners = new Set<() => void>();
  let cached = "{}";

  function emit() {
    for (const listener of listeners) listener();
  }

  function readRaw(): string {
    if (typeof window === "undefined") return "{}";
    try {
      return window.localStorage.getItem(key) ?? "{}";
    } catch {
      return "{}";
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

  cached = typeof window === "undefined" ? "{}" : readRaw();

  const store: Store = {
    subscribe(onStoreChange) {
      listeners.add(onStoreChange);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          cached = event.newValue ?? "{}";
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
      return "{}";
    },
    setValue(fieldId, value) {
      const current = parseValues(readRaw());
      if (isEmptyValue(value)) {
        delete current[fieldId];
      } else {
        current[fieldId] = typeof value === "string" ? value : [...value];
      }
      writeRaw(JSON.stringify(current));
    },
    reset() {
      writeRaw("{}");
    },
  };

  stores.set(slug, store);
  return store;
}

const inputClassName =
  "mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent template-blank-print";

const labelClassName =
  "block text-[0.9375rem] font-medium text-foreground sm:text-base";

const helpClassName = "mt-1.5 text-[0.875rem] leading-relaxed text-muted";

export function ProjectBriefForm({ template, nav }: Props) {
  const store = getStore(template.slug);
  const raw = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const values = useMemo(() => parseValues(raw), [raw]);
  const hasData = Object.keys(values).length > 0;

  const sectionCount = template.sections.length;
  const startedCount = useMemo(
    () => countStartedSections(template, values, isTemplateFieldVisible),
    [template, values],
  );

  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const setFieldValue = useCallback(
    (fieldId: string, value: string | string[]) => {
      store.setValue(fieldId, value);
    },
    [store],
  );

  function clearTemplate() {
    if (!hasData) return;
    const confirmed = window.confirm(
      "This clears the project brief saved in this browser.",
    );
    if (!confirmed) return;
    store.reset();
  }

  function printWithMode(mode: "blank" | "brief") {
    document.documentElement.dataset.printMode = mode;
    const cleanup = () => {
      delete document.documentElement.dataset.printMode;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  async function copyBrief() {
    const text = buildBriefPlainText(
      template,
      values,
      isTemplateFieldVisible,
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; keep UI quiet
    }
  }

  const guideSlug = template.relatedGuideSlugs?.[0];
  const checklistSlug = template.relatedChecklistSlugs?.[0];

  return (
    <div id="project-brief" className="template-brief">
      <p className="print:hidden mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-[0.9375rem] leading-relaxed text-muted">
        Your answers stay in this browser unless you choose to copy or send
        them.
      </p>

      <div className="template-utilities print:hidden mb-8 flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {hasData ? (
            <p className="mr-auto text-sm text-muted" aria-live="polite">
              Saved in this browser
            </p>
          ) : (
            <span className="mr-auto" />
          )}

          {hasData ? (
            <button
              type="button"
              onClick={clearTemplate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-[0.875rem] font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Clear Template
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => printWithMode("blank")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-[0.875rem] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print Blank Template
          </button>

          <button
            type="button"
            onClick={() => printWithMode("brief")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-[0.875rem] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print Brief
          </button>

          <CopyBriefButton copied={copied} onCopy={copyBrief} />
        </div>

        <p className="text-sm text-muted" aria-live="polite" aria-atomic="true">
          <span className="font-semibold text-foreground">
            Template progress:{" "}
          </span>
          {`${startedCount} of ${sectionCount} sections started`}
          <span className="mt-1 block text-[0.8125rem] text-subtle">
            Counts sections you have begun filling — not project readiness.
          </span>
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-14">
        <aside className="template-section-nav print:hidden">
          <div className="lg:sticky lg:top-28">
            <details className="rounded-xl border border-border bg-surface lg:hidden">
              <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                Jump to section
              </summary>
              <TemplateNavList
                nav={nav}
                className="border-t border-border px-5 pb-5 pt-3"
              />
            </details>
            <div className="hidden lg:block">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Sections
              </p>
              <TemplateNavList nav={nav} className="mt-4" />
              <p className="mt-6 text-sm text-muted" aria-live="polite">
                {`${startedCount} of ${sectionCount} sections started`}
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="template-form-fields space-y-0">
            {template.sections.map((section, index) => (
              <TemplateSectionBlock
                key={section.id}
                section={section}
                number={String(index + 1).padStart(2, "0")}
                values={values}
                onChange={setFieldValue}
              />
            ))}
          </div>

          <BriefSummary template={template} values={values} />

          <div className="template-contact-handoff print:hidden mt-12 border-t border-border pt-10">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Want to discuss this brief with Smartlance?
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              Copy the brief first if you want to include it in your enquiry.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CopyBriefButton copied={copied} onCopy={copyBrief} />
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-cta px-5 text-[0.9375rem] font-semibold text-cta-foreground hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Tell Us About Your Project
              </Link>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Want to understand what may affect scope?{" "}
              <Link
                href="/pricing"
                className="font-semibold text-accent-text hover:underline"
              >
                View Pricing &amp; Project Scope →
              </Link>
            </p>
          </div>

          {(guideSlug || checklistSlug) && (
            <p className="print:hidden mt-10 text-sm leading-relaxed text-muted">
              {guideSlug ? (
                <>
                  Related guide:{" "}
                  <Link
                    href={`/guides/${guideSlug}`}
                    className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Website redesign guide
                  </Link>
                  {checklistSlug ? " · " : null}
                </>
              ) : null}
              {checklistSlug ? (
                <>
                  Already building or preparing to launch?{" "}
                  <Link
                    href={`/checklists/${checklistSlug}`}
                    className="font-medium text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Redesign checklist
                  </Link>
                </>
              ) : null}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyBriefButton({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-[0.875rem] font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden />
          Copy Brief
        </>
      )}
    </button>
  );
}

function TemplateNavList({
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
            href={`#section-${item.id}`}
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

function TemplateSectionBlock({
  section,
  number,
  values,
  onChange,
}: {
  section: TemplateContent["sections"][number];
  number: string;
  values: TemplateValues;
  onChange: (fieldId: string, value: string | string[]) => void;
}) {
  const visibleFields = section.fields.filter((field) =>
    isTemplateFieldVisible(field, values),
  );

  if (visibleFields.length === 0) return null;

  return (
    <section
      id={`section-${section.id}`}
      className="template-section scroll-mt-28 break-inside-avoid border-t border-border py-10 first:border-t-0 first:pt-0"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
        {number}
      </p>
      <h2 className="mt-2 font-display text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.875rem]">
        {section.title}
      </h2>
      {section.description ? (
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
          {section.description}
        </p>
      ) : null}

      <div className="mt-8 space-y-7">
        {visibleFields.map((field) => (
          <FieldControl
            key={field.id}
            field={field}
            sectionTitle={section.title}
            values={values}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

function FieldHelp({ field }: { field: TemplateField }) {
  if (!field.help && !field.helpLinks?.length) return null;

  return (
    <div className={helpClassName}>
      {field.help ? <p>{field.help}</p> : null}
      {field.helpLinks && field.helpLinks.length > 0 ? (
        <p className={cn(field.help ? "mt-1.5" : undefined)}>
          {field.helpLinks.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " · " : null}
              <Link
                href={link.href}
                className="text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent print:hidden"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function FieldControl({
  field,
  sectionTitle,
  values,
  onChange,
}: {
  field: TemplateField;
  sectionTitle: string;
  values: TemplateValues;
  onChange: (fieldId: string, value: string | string[]) => void;
}) {
  const inputId = `field-${field.id}`;
  const stringValue =
    typeof values[field.id] === "string" ? (values[field.id] as string) : "";

  if (field.kind === "radio") {
    return (
      <fieldset className="min-w-0">
        <legend className={labelClassName}>{field.label}</legend>
        <FieldHelp field={field} />
        <div className="mt-3 flex flex-col gap-2.5 sm:gap-2">
          {field.options.map((option) => {
            const optionId = `${inputId}-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-1 py-1.5 sm:min-h-0 sm:items-center"
              >
                <input
                  id={optionId}
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={stringValue === option.value}
                  onChange={() => onChange(field.id, option.value)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:mt-0"
                />
                <span className="text-base leading-snug text-foreground">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.kind === "checkboxGroup") {
    const selected = Array.isArray(values[field.id])
      ? (values[field.id] as string[])
      : [];

    return (
      <fieldset className="min-w-0">
        <legend className={labelClassName}>{field.label}</legend>
        <FieldHelp field={field} />
        <div className="mt-3 flex flex-col gap-2.5 sm:gap-2">
          {field.options.map((option) => {
            const optionId = `${inputId}-${option.value}`;
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-1 py-1.5 sm:min-h-0 sm:items-center"
              >
                <input
                  id={optionId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((v) => v !== option.value)
                      : [...selected, option.value];
                    onChange(field.id, next);
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:mt-0"
                />
                <span className="text-base leading-snug text-foreground">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.kind === "select") {
    return (
      <div className="min-w-0">
        <label htmlFor={inputId} className={labelClassName}>
          {field.label}
        </label>
        <FieldHelp field={field} />
        <select
          id={inputId}
          value={stringValue}
          onChange={(event) => onChange(field.id, event.target.value)}
          className={inputClassName}
        >
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div className="min-w-0">
        <label htmlFor={inputId} className={labelClassName}>
          {field.label}
        </label>
        <FieldHelp field={field} />
        <textarea
          id={inputId}
          value={stringValue}
          onChange={(event) => onChange(field.id, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 4}
          maxLength={field.maxLength}
          className={cn(inputClassName, "min-h-[6rem] resize-y")}
        />
        <BriefAiHelpButton
          fieldId={field.id}
          fieldLabel={field.label}
          currentValue={stringValue}
          fieldHelp={field.help}
          fieldPlaceholder={field.placeholder}
          sectionTitle={sectionTitle}
          briefContext={buildBriefContextForField(values, field.id)}
          onApply={(value) => onChange(field.id, value)}
        />
      </div>
    );
  }

  const inputType =
    field.kind === "url" ? "url" : field.kind === "date" ? "date" : "text";

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className={labelClassName}>
        {field.label}
      </label>
      <FieldHelp field={field} />
      <input
        id={inputId}
        type={inputType}
        value={stringValue}
        onChange={(event) => onChange(field.id, event.target.value)}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        className={inputClassName}
      />
    </div>
  );
}

function BriefSummary({
  template,
  values,
}: {
  template: TemplateContent;
  values: TemplateValues;
}) {
  const sectionsWithAnswers = template.sections
    .map((section) => {
      const answers = section.fields
        .filter((field) => isTemplateFieldVisible(field, values))
        .map((field) => {
          const display = getFieldDisplayValue(field, values);
          if (!display) return null;
          return { id: field.id, label: field.label, display };
        })
        .filter((item): item is { id: string; label: string; display: string } =>
          item !== null,
        );
      return { section, answers };
    })
    .filter((entry) => entry.answers.length > 0);

  return (
    <div
      id="brief-summary"
      className="template-brief-summary mt-14 border-t border-border pt-12"
    >
      <h2 className="font-display text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.875rem]">
        Your Project Brief
      </h2>

      {sectionsWithAnswers.length === 0 ? (
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
          Start filling in the sections above — your brief will appear here.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {sectionsWithAnswers.map(({ section, answers }) => (
            <div key={section.id} className="break-inside-avoid">
              <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">
                {section.title}
              </h3>
              <div className="mt-4 space-y-5">
                {answers.map((answer) => (
                  <div key={answer.id}>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle">
                      {answer.label}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground sm:text-base">
                      {answer.display}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
