"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MediaPicker } from "@/components/admin/media/MediaPicker";

export type GalleryEditorItem = {
  src: string;
  alt: string;
  caption?: string;
  layout?: "full" | "half" | "mobile";
  id?: string;
};

function normalizeGalleryItems(value: unknown): GalleryEditorItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim() ? { src: item.trim(), alt: "" } : null;
      }
      if (item && typeof item === "object" && "src" in item) {
        const row = item as Record<string, unknown>;
        const src = String(row.src || "").trim();
        if (!src) return null;
        return {
          src,
          alt: String(row.alt || "").trim(),
          caption: row.caption ? String(row.caption) : undefined,
          layout:
            row.layout === "full" ||
            row.layout === "half" ||
            row.layout === "mobile"
              ? row.layout
              : undefined,
          id: row.id ? String(row.id) : undefined,
        };
      }
      return null;
    })
    .filter((item): item is GalleryEditorItem => Boolean(item));
}

function serializeGalleryItems(items: GalleryEditorItem[]): string {
  return JSON.stringify(
    items.map(({ src, alt, caption, layout, id }) => {
      const row: GalleryEditorItem = { src, alt: alt || "" };
      if (caption?.trim()) row.caption = caption.trim();
      if (layout) row.layout = layout;
      if (id?.trim()) row.id = id.trim();
      return row;
    }),
    null,
    2,
  );
}

export function MediaGalleryEditor({
  name,
  label,
  defaultValue,
  hint,
  storageConfigured = true,
  header,
}: {
  name: string;
  label: string;
  defaultValue?: unknown;
  hint?: string;
  storageConfigured?: boolean;
  header?: ReactNode;
}) {
  const initial = useMemo(
    () => normalizeGalleryItems(defaultValue),
    [defaultValue],
  );
  const [items, setItems] = useState<GalleryEditorItem[]>(initial);
  const [showJson, setShowJson] = useState(false);

  function updateItem(index: number, patch: Partial<GalleryEditorItem>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((current) => [...current, { src: "", alt: "" }]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-neutral-900">{label}</p>
          {hint ? <p className="mt-1 text-xs text-neutral-600">{hint}</p> : null}
        </div>
        {header}
      </div>

      <input type="hidden" name={name} value={serializeGalleryItems(items)} />

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`gallery-item-${index}`}
            className="space-y-3 rounded border border-neutral-200 bg-white p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Image {index + 1}
              </p>
              <button
                type="button"
                className="text-xs text-red-700 hover:underline"
                onClick={() => removeItem(index)}
              >
                Remove
              </button>
            </div>

            <MediaPicker
              name={`${name}-src-${index}`}
              label="Image"
              value={item.src}
              onValueChange={(src) => updateItem(index, { src })}
              storageConfigured={storageConfigured}
              includeHiddenInput={false}
            />

            <label className="block text-sm">
              Alt text
              <input
                value={item.alt}
                onChange={(event) =>
                  updateItem(index, { alt: event.target.value })
                }
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm">
              Caption (optional)
              <input
                value={item.caption ?? ""}
                onChange={(event) =>
                  updateItem(index, { caption: event.target.value })
                }
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm">
              Layout
              <select
                value={item.layout ?? ""}
                onChange={(event) =>
                  updateItem(index, {
                    layout:
                      event.target.value === "full" ||
                      event.target.value === "half" ||
                      event.target.value === "mobile"
                        ? event.target.value
                        : undefined,
                  })
                }
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              >
                <option value="">Default</option>
                <option value="full">Full width</option>
                <option value="half">Half width</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="rounded border border-neutral-300 px-3 py-2 text-sm"
        onClick={addItem}
      >
        Add gallery image
      </button>

      <button
        type="button"
        className="text-xs text-neutral-600 underline-offset-2 hover:underline"
        onClick={() => setShowJson((value) => !value)}
      >
        {showJson ? "Hide JSON" : "Edit as JSON"}
      </button>

      {showJson ? (
        <textarea
          rows={8}
          className="w-full rounded border px-3 py-2 font-mono text-xs"
          value={serializeGalleryItems(items)}
          onChange={(event) => {
            try {
              setItems(normalizeGalleryItems(JSON.parse(event.target.value)));
            } catch {
              // Keep previous items until JSON is valid.
            }
          }}
        />
      ) : null}
    </div>
  );
}
