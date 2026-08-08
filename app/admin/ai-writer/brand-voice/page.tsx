import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import { saveBrandVoiceAction } from "@/lib/admin/ai-writer-actions";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";

export const dynamic = "force-dynamic";

export default async function BrandVoicePage() {
  await requireAdminUser("manage_ai_settings");
  const voice = await getBrandVoice();
  const avoided = Array.isArray(voice.avoidedPhrases)
    ? (voice.avoidedPhrases as string[]).join("\n")
    : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/ai-writer" className="text-sm text-neutral-500">
          ← AI Writer
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Brand voice</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Structured Smartlance writing profile. Must be approved before it overrides defaults.
          Choose exemplars deliberately — do not blindly learn from every Insight.
        </p>
      </div>

      <AIWriterSubnav current="/admin/ai-writer/brand-voice" />

      <form action={saveBrandVoiceAction} className="space-y-3 rounded-lg border bg-white p-4">
        <label className="block text-sm">
          Personality
          <textarea name="personality" defaultValue={voice.personality || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Audience
          <textarea name="audience" defaultValue={voice.audience || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Tone
          <textarea name="tone" defaultValue={voice.tone || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Sentence style
          <textarea name="sentenceStyle" defaultValue={voice.sentenceStyle || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Technical depth
          <textarea name="technicalDepth" defaultValue={voice.technicalDepth || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          CTA style
          <textarea name="ctaStyle" defaultValue={voice.ctaStyle || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Formatting preferences
          <textarea name="formattingPrefs" defaultValue={voice.formattingPrefs || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Phrases to avoid (one per line)
          <textarea name="avoidedPhrases" defaultValue={avoided} rows={8} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="approved" defaultChecked={voice.approved} />
          Approved for use in generation
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
          Save brand voice
        </button>
      </form>
    </div>
  );
}
