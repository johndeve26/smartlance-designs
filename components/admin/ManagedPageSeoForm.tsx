"use client";

import { useState, useTransition } from "react";
import { saveManagedPageAction } from "@/lib/admin/phase4-actions";
import { MediaPicker } from "@/components/admin/media/MediaPicker";

export function ManagedPageSeoForm({
  page,
}: {
  page: {
    key: string;
    displayName: string;
    route: string;
    seoTitle: string | null;
    seoDescription: string | null;
    ogImagePath: string | null;
    noIndex: boolean;
    canonicalOverride: string | null;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3 rounded-lg border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await saveManagedPageAction(fd);
          setMessage(res.ok ? "Managed page SEO saved." : res.error);
        });
      }}
    >
      <h2 className="font-semibold">
        Managed page: {page.displayName}{" "}
        <span className="font-mono text-xs text-neutral-500">{page.route}</span>
      </h2>
      <input type="hidden" name="key" value={page.key} />
      <label className="block text-sm">
        SEO title
        <input name="seoTitle" defaultValue={page.seoTitle || ""} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm">
        SEO description
        <textarea name="seoDescription" defaultValue={page.seoDescription || ""} rows={3} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <MediaPicker name="ogImagePath" label="OG image" defaultValue={page.ogImagePath} />
      <label className="block text-sm">
        Canonical override (optional)
        <input name="canonicalOverride" defaultValue={page.canonicalOverride || ""} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="noIndex" value="1" defaultChecked={page.noIndex} />
        noindex
      </label>
      <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
        Save
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
