/**
 * Checklist / Template / Comparison ID-preserving merges.
 */

import { newStableId } from "@/lib/ai/content-assistants/resource-shared";

type AnyObj = Record<string, unknown>;

function asObj(v: unknown): AnyObj | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as AnyObj) : null;
}

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Merge sections by id — preserve ids; update title/body/callouts only. */
export function mergeSectionsById(
  current: unknown,
  proposed: unknown,
  opts?: { allowNew?: boolean; idPrefix?: string },
): unknown[] {
  const cur = asArr(current);
  const prop = asArr(proposed);
  if (!prop.length) return cur;

  const byId = new Map<string, AnyObj>();
  for (const s of cur) {
    const o = asObj(s);
    if (o && typeof o.id === "string") byId.set(o.id, { ...o });
  }

  const out: AnyObj[] = [];
  const seen = new Set<string>();

  for (const s of prop) {
    const o = asObj(s);
    if (!o) continue;
    const id = typeof o.id === "string" ? o.id : "";
    if (id && byId.has(id)) {
      const base = byId.get(id)!;
      const next: AnyObj = { ...base };
      if (typeof o.title === "string") next.title = o.title;
      if (typeof o.body === "string") next.body = o.body;
      if (typeof o.description === "string") next.description = o.description;
      if (o.callouts !== undefined) next.callouts = o.callouts;
      if (o.callout !== undefined) next.callout = o.callout;
      // Never allow visual/id changes via silent overwrite of id
      next.id = base.id;
      out.push(next);
      seen.add(id);
    } else if (opts?.allowNew) {
      out.push({
        ...o,
        id: id || newStableId(opts.idPrefix || "sec"),
      });
    }
  }

  // Keep sections not mentioned
  for (const s of cur) {
    const o = asObj(s);
    if (o && typeof o.id === "string" && !seen.has(o.id)) out.push(o);
  }
  return out;
}

export type ChecklistItemUpdate = {
  id: string;
  text?: string;
  description?: string;
  appliesWhen?: string;
};

export type ChecklistNewItemSuggestion = {
  sectionId: string;
  text: string;
  description?: string;
  afterItemId?: string;
  /** Model must NOT supply technical id — ignored if present */
  id?: string;
};

/** Apply item wording updates; reject id changes; assign server IDs for new items. */
export function applyChecklistItemOps(
  sections: unknown,
  updates: ChecklistItemUpdate[] | undefined,
  newItems: ChecklistNewItemSuggestion[] | undefined,
): { sections: unknown[]; warnings: string[] } {
  const warnings: string[] = [];
  const nextSections = structuredClone(asArr(sections)) as AnyObj[];

  const findItem = (id: string): AnyObj | null => {
    for (const sec of nextSections) {
      for (const item of asArr(sec.items)) {
        const o = asObj(item);
        if (o?.id === id) return o;
      }
      for (const sg of asArr(sec.subgroups)) {
        const g = asObj(sg);
        if (!g) continue;
        for (const item of asArr(g.items)) {
          const o = asObj(item);
          if (o?.id === id) return o;
        }
      }
    }
    return null;
  };

  for (const u of updates || []) {
    if (!u?.id || typeof u.id !== "string") {
      warnings.push("Item update missing stable id — skipped.");
      continue;
    }
    const item = findItem(u.id);
    if (!item) {
      warnings.push(`Unknown checklist item id ${u.id} — skipped.`);
      continue;
    }
    if (typeof u.text === "string") item.text = u.text;
    if (typeof u.description === "string") item.description = u.description;
    if (typeof u.appliesWhen === "string") item.appliesWhen = u.appliesWhen;
  }

  for (const n of newItems || []) {
    if (!n?.sectionId || !n.text) continue;
    const sec = nextSections.find((s) => s.id === n.sectionId);
    if (!sec) {
      warnings.push(`Unknown section ${n.sectionId} for new item — skipped.`);
      continue;
    }
    const items = asArr(sec.items) as AnyObj[];
    const newItem: AnyObj = {
      id: newStableId("chk"),
      text: n.text,
      ...(n.description ? { description: n.description } : {}),
    };
    if (n.id) {
      warnings.push(
        "AI-supplied checklist item id was ignored; server generated a new stable id.",
      );
    }
    if (n.afterItemId) {
      const idx = items.findIndex((i) => i.id === n.afterItemId);
      if (idx >= 0) items.splice(idx + 1, 0, newItem);
      else items.push(newItem);
    } else {
      items.push(newItem);
    }
    sec.items = items;
  }

  return { sections: nextSections, warnings };
}

/** Collect all checklist item ids */
export function collectChecklistItemIds(sections: unknown): string[] {
  const ids: string[] = [];
  for (const sec of asArr(sections)) {
    const s = asObj(sec);
    if (!s) continue;
    for (const item of asArr(s.items)) {
      const o = asObj(item);
      if (typeof o?.id === "string") ids.push(o.id);
    }
    for (const sg of asArr(s.subgroups)) {
      const g = asObj(sg);
      if (!g) continue;
      for (const item of asArr(g.items)) {
        const o = asObj(item);
        if (typeof o?.id === "string") ids.push(o.id);
      }
    }
  }
  return ids;
}

export type TemplateFieldCopyUpdate = {
  id: string;
  label?: string;
  help?: string;
  placeholder?: string;
  /** Option label updates by technical value — value itself protected */
  optionLabels?: Array<{ value: string; label: string }>;
};

export type TemplateSectionCopyUpdate = {
  id: string;
  title?: string;
  description?: string;
};

export function applyTemplateCopyOps(
  sections: unknown,
  sectionUpdates: TemplateSectionCopyUpdate[] | undefined,
  fieldUpdates: TemplateFieldCopyUpdate[] | undefined,
): { sections: unknown[]; warnings: string[] } {
  const warnings: string[] = [];
  const next = structuredClone(asArr(sections)) as AnyObj[];

  for (const su of sectionUpdates || []) {
    const sec = next.find((s) => s.id === su.id);
    if (!sec) {
      warnings.push(`Unknown template section ${su.id}`);
      continue;
    }
    if (typeof su.title === "string") sec.title = su.title;
    if (typeof su.description === "string") sec.description = su.description;
  }

  for (const fu of fieldUpdates || []) {
    let found: AnyObj | null = null;
    for (const sec of next) {
      for (const field of asArr(sec.fields)) {
        const f = asObj(field);
        if (f?.id === fu.id) {
          found = f;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      warnings.push(`Unknown template field ${fu.id}`);
      continue;
    }
    // Protect showWhenAny / kind / id / core / options[].value
    if (typeof fu.label === "string") found.label = fu.label;
    if (typeof fu.help === "string") found.help = fu.help;
    if (typeof fu.placeholder === "string") found.placeholder = fu.placeholder;
    if (fu.optionLabels?.length && Array.isArray(found.options)) {
      const opts = found.options as AnyObj[];
      for (const ol of fu.optionLabels) {
        const opt = opts.find((o) => o.value === ol.value);
        if (opt && typeof ol.label === "string") opt.label = ol.label;
      }
    }
  }

  return { sections: next, warnings };
}

export function collectTemplateFieldIds(sections: unknown): string[] {
  const ids: string[] = [];
  for (const sec of asArr(sections)) {
    const s = asObj(sec);
    if (!s) continue;
    for (const field of asArr(s.fields)) {
      const f = asObj(field);
      if (typeof f?.id === "string") ids.push(f.id);
    }
  }
  return ids;
}

const WINNER_RE =
  /\b(clearly the winner|is the best platform|universally better|always choose)\b/i;

export function containsFabricatedWinnerClaim(text: string): boolean {
  return WINNER_RE.test(text);
}

const RATING_RE = /\b\d+(\.\d+)?\s*\/\s*10\b/;

export function containsFakeRating(text: string): boolean {
  return RATING_RE.test(text);
}

/** Merge comparison criteria/matrix by id — text only */
export function mergeComparisonRowsById(
  current: unknown,
  proposed: unknown,
): unknown[] {
  const cur = asArr(current);
  const prop = asArr(proposed);
  if (!prop.length) return cur;
  const byId = new Map<string, AnyObj>();
  for (const r of cur) {
    const o = asObj(r);
    if (o && typeof o.id === "string") byId.set(o.id, { ...o });
  }
  const out: AnyObj[] = [];
  const seen = new Set<string>();
  for (const r of prop) {
    const o = asObj(r);
    if (!o || typeof o.id !== "string" || !byId.has(o.id)) continue;
    const base = byId.get(o.id)!;
    const next = { ...base };
    for (const k of ["label", "optionA", "optionB", "note", "body", "title"]) {
      if (typeof o[k] === "string") next[k] = o[k];
    }
    next.id = base.id;
    out.push(next);
    seen.add(o.id);
  }
  for (const r of cur) {
    const o = asObj(r);
    if (o && typeof o.id === "string" && !seen.has(o.id)) out.push(o);
  }
  return out;
}
