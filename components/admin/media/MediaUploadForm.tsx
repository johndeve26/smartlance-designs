"use client";

import { useState, useTransition } from "react";
import { uploadMediaAction } from "@/lib/admin/phase4-actions";

export function MediaUploadForm({ maxMb }: { maxMb: number }) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="rounded-lg border border-neutral-200 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        setOk(null);
        start(async () => {
          const res = await uploadMediaAction(fd);
          if (!res.ok) setError(res.error);
          else {
            setOk(`Uploaded ${res.publicUrl}`);
            e.currentTarget.reset();
            window.location.reload();
          }
        });
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="font-medium text-neutral-800">Upload image</span>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            required
            className="mt-1 block w-full text-sm"
          />
        </label>
        <label className="block text-sm">
          Alt text
          <input
            name="altText"
            className="mt-1 block w-48 rounded border px-2 py-1.5"
            placeholder="Optional; empty if decorative"
          />
        </label>
        <label className="block text-sm">
          Title
          <input name="title" className="mt-1 block w-48 rounded border px-2 py-1.5" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-[#F47A48] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        JPEG, PNG, WebP, AVIF, GIF · max {maxMb} MB · SVG not allowed
      </p>
      {error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-2 text-sm text-emerald-700" role="status">
          {ok}
        </p>
      ) : null}
    </form>
  );
}
