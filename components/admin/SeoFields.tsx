import { MediaPicker } from "@/components/admin/media/MediaPicker";

type SeoFieldsProps = {
  defaults?: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImagePath?: string | null;
    noIndex?: boolean;
    canonicalOverride?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
  includeMeta?: boolean;
  disabled?: boolean;
};

export function SeoFields({
  defaults,
  includeMeta = false,
  disabled,
}: SeoFieldsProps) {
  return (
    <fieldset className="admin-fieldset">
      <legend className="admin-legend">SEO</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {includeMeta ? (
          <>
            <label className="admin-field">
              <span className="admin-label">Meta title</span>
              <input
                name="metaTitle"
                className="admin-input"
                disabled={disabled}
                defaultValue={defaults?.metaTitle ?? ""}
              />
            </label>
            <label className="admin-field sm:col-span-2">
              <span className="admin-label">Meta description</span>
              <textarea
                name="metaDescription"
                rows={2}
                className="admin-input"
                disabled={disabled}
                defaultValue={defaults?.metaDescription ?? ""}
              />
            </label>
          </>
        ) : null}
        <label className="admin-field">
          <span className="admin-label">SEO title</span>
          <input
            name="seoTitle"
            className="admin-input"
            disabled={disabled}
            defaultValue={defaults?.seoTitle ?? ""}
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">OG title</span>
          <input
            name="ogTitle"
            className="admin-input"
            disabled={disabled}
            defaultValue={defaults?.ogTitle ?? ""}
          />
        </label>
        <label className="admin-field sm:col-span-2">
          <span className="admin-label">SEO description</span>
          <textarea
            name="seoDescription"
            rows={2}
            className="admin-input"
            disabled={disabled}
            defaultValue={defaults?.seoDescription ?? ""}
          />
        </label>
        <label className="admin-field sm:col-span-2">
          <span className="admin-label">OG description</span>
          <textarea
            name="ogDescription"
            rows={2}
            className="admin-input"
            disabled={disabled}
            defaultValue={defaults?.ogDescription ?? ""}
          />
        </label>
        <div className="admin-field sm:col-span-2">
          {disabled ? (
            <label className="admin-field">
              <span className="admin-label">OG image path</span>
              <input
                name="ogImagePath"
                className="admin-input"
                disabled
                defaultValue={defaults?.ogImagePath ?? ""}
              />
            </label>
          ) : (
            <MediaPicker
              name="ogImagePath"
              label="OG image"
              defaultValue={defaults?.ogImagePath}
            />
          )}
        </div>
        <label className="admin-field">
          <span className="admin-label">Canonical override</span>
          <input
            name="canonicalOverride"
            className="admin-input"
            disabled={disabled}
            defaultValue={defaults?.canonicalOverride ?? ""}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="noIndex"
            value="true"
            disabled={disabled}
            defaultChecked={Boolean(defaults?.noIndex)}
            className="rounded border-neutral-300"
          />
          noIndex
        </label>
      </div>
    </fieldset>
  );
}
