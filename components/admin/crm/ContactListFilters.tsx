"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { useRouter, useSearchParams } from "next/navigation";
import {
  saveContactViewAction,
  updateContactViewAction,
  countContactFilterAction,
} from "@/lib/admin/crm-view-actions";
import { getContactFilterMetadataAction } from "@/lib/admin/crm-filter-actions";
import type { ContactFilterV3 } from "@/lib/crm/filters/contact-filter-schema";
import { CONTACT_FILTER_VERSION } from "@/lib/crm/filters/contact-filter-schema";
import { CRM_CONTACT_FILTER_MAX_CONDITIONS } from "@/lib/crm/properties/constants";
import {
  ContactFilterBuilder,
  filterSummaryChips,
} from "@/components/admin/crm/filters/ContactFilterBuilder";
import type { ContactFilterMetadata } from "@/lib/admin/crm-filter-actions";
import {
  encodeContactFilterParam,
  decodeContactFilterParam,
  mergeQuickFiltersIntoAdvanced,
  quickConditionsFromSearchParams,
} from "@/lib/crm/filters/filter-serialize";
import { listCountryOptions } from "@/lib/crm/country";

type View = { id: string; name: string; isShared: boolean };

const emptyFilter = (): ContactFilterV3 => ({
  version: CONTACT_FILTER_VERSION,
  match: "ALL",
  conditions: [],
});

export function ContactListFilters({
  views,
  currentViewId,
  initialAdvancedFilter,
}: {
  views: View[];
  currentViewId?: string;
  initialAdvancedFilter?: ContactFilterV3 | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const countries = useMemo(() => listCountryOptions().slice(0, 80), []);
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(initialAdvancedFilter?.conditions.length || sp.get("f")),
  );
  const [metadata, setMetadata] = useState<ContactFilterMetadata | null>(null);
  const [advancedFilter, setAdvancedFilter] = useState<ContactFilterV3>(
    initialAdvancedFilter ?? emptyFilter(),
  );
  const [appliedFilter, setAppliedFilter] = useState<ContactFilterV3 | null>(
    initialAdvancedFilter ?? null,
  );
  const [saveName, setSaveName] = useState("");
  const [pending, setPending] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [countPending, setCountPending] = useState(false);

  useEffect(() => {
    getContactFilterMetadataAction().then(setMetadata).catch(() => setMetadata(null));
  }, []);

  useEffect(() => {
    if (initialAdvancedFilter) {
      setAdvancedFilter(initialAdvancedFilter);
      setAppliedFilter(initialAdvancedFilter);
    } else if (sp.get("f")) {
      const decoded = decodeContactFilterParam(sp.get("f")!);
      if (decoded) {
        setAdvancedFilter(decoded);
        setAppliedFilter(decoded);
      }
    }
  }, [initialAdvancedFilter, sp]);

  const quickParams = useMemo(
    () => ({
      lifecycle: sp.get("lifecycle") ?? undefined,
      leadStatus: sp.get("leadStatus") ?? undefined,
      temperature: sp.get("temperature") ?? undefined,
      countryCode: sp.get("countryCode") ?? undefined,
      source: sp.get("source") ?? undefined,
      ownerId: sp.get("ownerId") ?? undefined,
      emailStatus: sp.get("emailStatus") ?? undefined,
    }),
    [sp],
  );

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    router.push(`/admin/crm/contacts?${params.toString()}`);
  }

  const fullFilterForApply = useCallback(() => {
    const quick = quickConditionsFromSearchParams(quickParams);
    return mergeQuickFiltersIntoAdvanced(advancedFilter, quick);
  }, [advancedFilter, quickParams]);

  async function applyFilters() {
    const merged = fullFilterForApply();
    if (merged.conditions.length > CRM_CONTACT_FILTER_MAX_CONDITIONS) {
      alert(`Maximum ${CRM_CONTACT_FILTER_MAX_CONDITIONS} conditions allowed.`);
      return;
    }
    setAppliedFilter(merged);
    const encoded = merged.conditions.length ? encodeContactFilterParam(merged) : undefined;
    pushParams({ f: encoded, view: currentViewId });
  }

  async function previewCountDebounced() {
    const merged = fullFilterForApply();
    if (!merged.conditions.length) {
      setPreviewCount(null);
      return;
    }
    setCountPending(true);
    try {
      const { count } = await countContactFilterAction(merged);
      setPreviewCount(count);
    } finally {
      setCountPending(false);
    }
  }

  async function saveView() {
    if (!saveName.trim()) return;
    setPending(true);
    const filter = fullFilterForApply();
    const res = await saveContactViewAction({ name: saveName.trim(), filter });
    setPending(false);
    if (res.ok) {
      pushParams({ view: res.id, f: undefined });
      setSaveName("");
    }
  }

  async function saveViewChanges() {
    if (!currentViewId) return;
    setPending(true);
    const filter = fullFilterForApply();
    await updateContactViewAction({ id: currentViewId, filter });
    setPending(false);
    pushParams({ view: currentViewId, f: undefined });
  }

  function clearAdvanced() {
    setAdvancedFilter(emptyFilter());
    setAppliedFilter(null);
    setPreviewCount(null);
    pushParams({ f: undefined });
  }

  const summaryChips =
    metadata && appliedFilter?.conditions.length
      ? filterSummaryChips(appliedFilter, metadata.fields)
      : [];

  return (
    <AdminPanel className="space-y-3">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          pushParams({ q: String(fd.get("q") || "") || undefined });
        }}
      >
        <input
          name="q"
          className="admin-input min-w-[200px] flex-1"
          placeholder="Search contacts…"
          defaultValue={sp.get("q") ?? ""}
        />
        <button type="submit" className="admin-btn admin-btn-secondary">Search</button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <select
          className="admin-input"
          value={sp.get("lifecycle") ?? ""}
          onChange={(e) => pushParams({ lifecycle: e.target.value || undefined })}
        >
          <option value="">Lifecycle</option>
          {["PROSPECT", "LEAD", "OPPORTUNITY", "CLIENT", "PAST_CLIENT", "OTHER"].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select
          className="admin-input"
          value={sp.get("temperature") ?? ""}
          onChange={(e) => pushParams({ temperature: e.target.value || undefined })}
        >
          <option value="">Temperature</option>
          {["COLD", "WARM", "HOT"].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select
          className="admin-input"
          value={sp.get("countryCode") ?? ""}
          onChange={(e) => pushParams({ countryCode: e.target.value || undefined })}
        >
          <option value="">Country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => setShowAdvanced((s) => !s)}
        >
          Advanced {showAdvanced ? "▲" : "▼"}
          {appliedFilter?.conditions.length ? ` (${appliedFilter.conditions.length})` : ""}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() =>
            pushParams({
              q: undefined,
              lifecycle: undefined,
              temperature: undefined,
              countryCode: undefined,
              leadStatus: undefined,
              source: undefined,
              ownerId: undefined,
              f: undefined,
              view: undefined,
            })
          }
        >
          Clear filters
        </button>
      </div>

      {showAdvanced && metadata ? (
        <div className="space-y-3 border-t pt-3">
          <ContactFilterBuilder
            metadata={metadata}
            value={advancedFilter}
            onChange={setAdvancedFilter}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="admin-btn admin-btn-primary text-sm" onClick={applyFilters}>
              Apply filters
            </button>
            <button type="button" className="admin-btn admin-btn-secondary text-sm" onClick={clearAdvanced}>
              Clear advanced filters
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary text-sm"
              disabled={countPending}
              onClick={previewCountDebounced}
            >
              Preview count
            </button>
            {previewCount != null ? (
              <span className="text-sm text-neutral-600">{previewCount} contacts match</span>
            ) : null}
          </div>
        </div>
      ) : showAdvanced && !metadata ? (
        <p className="text-sm text-neutral-500">Loading filter builder…</p>
      ) : null}

      {summaryChips.length ? (
        <div className="flex flex-wrap gap-2 border-t pt-3 text-xs">
          {summaryChips.map((chip, i) => (
            <span key={i} className="rounded bg-neutral-100 px-2 py-1">{chip}</span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
        <span className="text-neutral-600">Views:</span>
        <button
          type="button"
          className={`rounded px-2 py-1 ${!currentViewId ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
          onClick={() => pushParams({ view: undefined, f: undefined })}
        >
          All contacts
        </button>
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`rounded px-2 py-1 ${currentViewId === v.id ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
            onClick={() => pushParams({ view: v.id, f: undefined })}
          >
            {v.name}
          </button>
        ))}
        <input
          className="admin-input"
          placeholder="Save view as…"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={saveView}>
          Save view
        </button>
        {currentViewId ? (
          <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={saveViewChanges}>
            Save changes
          </button>
        ) : null}
      </div>
    </AdminPanel>
  );
}
