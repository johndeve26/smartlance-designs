"use client";

import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { uploadMediaAction } from "@/lib/admin/phase4-actions";

type MediaItem = {
  id: string;
  publicUrl: string;
  title: string | null;
  filename: string;
  altText: string | null;
};

export function MediaPicker({
  name,
  label,
  defaultValue,
  value: controlledValue,
  onValueChange,
  hideLabel = false,
  storageConfigured = true,
  header,
  includeHiddenInput = true,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  value?: string;
  onValueChange?: (value: string) => void;
  hideLabel?: boolean;
  storageConfigured?: boolean;
  header?: ReactNode;
  /** When false, omits the named hidden input (for nested gallery rows). */
  includeHiddenInput?: boolean;
}) {
  const dialogId = useId();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const value = controlledValue ?? internalValue;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pending, start] = useTransition();
  const [uploadPending, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setValue(next: string) {
    if (onValueChange) onValueChange(next);
    else setInternalValue(next);
  }

  function load(search: string) {
    start(async () => {
      const res = await fetch(
        `/api/admin/media?q=${encodeURIComponent(search)}&status=ACTIVE&pageSize=24`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { items: MediaItem[] };
      setItems(data.items);
    });
  }

  function handleUpload(file: File) {
    setError(null);
    startUpload(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadMediaAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setValue(res.publicUrl);
      load(q);
    });
  }

  return (
    <div className="space-y-2">
      {hideLabel ? null : (
        <div className="flex items-center justify-between gap-2">
          <label className="block text-sm font-medium text-neutral-800" htmlFor={name}>
            {label}
          </label>
          {header}
        </div>
      )}
      {hideLabel && header ? <div>{header}</div> : null}
      {includeHiddenInput ? <input type="hidden" name={name} value={value} /> : null}
      <div className="flex flex-wrap gap-2">
        <input
          id={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-[16rem] flex-1 rounded border border-neutral-300 px-3 py-2 font-mono text-xs"
          placeholder="/images/… or uploaded URL"
          aria-label={hideLabel ? label : undefined}
        />
        <button
          type="button"
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
          onClick={() => {
            setOpen(true);
            load(q);
          }}
          aria-haspopup="dialog"
          aria-controls={dialogId}
        >
          Browse
        </button>
        {storageConfigured ? (
          <>
            <button
              type="button"
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
              disabled={uploadPending}
              onClick={() => uploadInputRef.current?.click()}
            >
              {uploadPending ? "Uploading…" : "Upload"}
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleUpload(file);
                event.target.value = "";
              }}
            />
          </>
        ) : null}
        {value ? (
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm text-neutral-600"
            onClick={() => setValue("")}
          >
            Clear
          </button>
        ) : null}
      </div>
      {!storageConfigured ? (
        <p className="text-xs text-neutral-500">
          Upload requires configured object storage. Browse indexed media or paste a
          site path such as <code>/images/projects/…</code>.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {value ? (
        <div className="h-24 w-40 overflow-hidden rounded border bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      {open ? (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label="Media picker"
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Select media</h2>
              <button
                type="button"
                className="text-sm text-neutral-600"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="flex-1 rounded border px-3 py-2 text-sm"
                aria-label="Search media"
              />
              <button
                type="button"
                className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
                onClick={() => load(q)}
                disabled={pending}
              >
                Search
              </button>
            </div>
            {value ? (
              <p className="mt-2 text-xs text-neutral-500">
                Currently selected: {value}
              </p>
            ) : null}
            <div
              className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
              role="listbox"
              aria-label="Media results"
            >
              {items.map((item) => {
                const selected = value === item.publicUrl;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`overflow-hidden rounded border text-left focus:outline-none focus:ring-2 focus:ring-[#F47A48] ${
                      selected
                        ? "border-[#F47A48] ring-2 ring-[#F47A48]"
                        : "border-neutral-200"
                    }`}
                    onClick={() => {
                      setValue(item.publicUrl);
                      setOpen(false);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.publicUrl}
                      alt={item.altText || item.title || item.filename}
                      className="aspect-square w-full object-cover"
                    />
                    <span className="block truncate px-2 py-1 text-xs">
                      {item.title || item.filename}
                      {selected ? " (selected)" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
