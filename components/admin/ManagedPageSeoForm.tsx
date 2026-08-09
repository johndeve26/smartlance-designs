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
    ogTitle: string | null;
    ogDescription: string | null;
    ogImagePath: string | null;
    noIndex: boolean;
    canonicalOverride: string | null;
    heroEyebrow: string | null;
    heroHeadline: string | null;
    heroSupporting: string | null;
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
          setMessage(res.ok ? "Managed page saved." : res.error);
        });
      }}
    >
      <h2 className="font-semibold">
        Managed page: {page.displayName}{" "}
        <span className="font-mono text-xs text-neutral-500">{page.route}</span>
      </h2>
      <input type="hidden" name="key" value={page.key} />

      <fieldset className="space-y-3 rounded border border-neutral-200 bg-neutral-50 p-4">
        <legend className="px-1 text-sm font-semibold text-neutral-900">Hero copy</legend>
        <p className="text-xs text-neutral-600">
          Optional overrides when a managed page reads hero content from the CMS.
        </p>
        <label className="block text-sm">
          Hero eyebrow
          <input name="heroEyebrow" defaultValue={page.heroEyebrow || ""} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Hero headline
          <input name="heroHeadline" defaultValue={page.heroHeadline || ""} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Hero supporting copy
          <textarea name="heroSupporting" defaultValue={page.heroSupporting || ""} rows={3} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
      </fieldset>

      <label className="block text-sm">
        SEO title
        <input name="seoTitle" defaultValue={page.seoTitle || ""} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm">
        SEO description
        <textarea name="seoDescription" defaultValue={page.seoDescription || ""} rows={3} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm">
        OG title
        <input name="ogTitle" defaultValue={page.ogTitle || ""} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm">
        OG description
        <textarea name="ogDescription" defaultValue={page.ogDescription || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
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
