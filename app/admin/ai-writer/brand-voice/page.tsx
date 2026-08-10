import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import { saveBrandVoiceAction } from "@/lib/admin/ai-writer-actions";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BrandVoicePage() {
  await requireAdminUser("manage_ai_settings");
  const voice = await getBrandVoice();
  const avoided = Array.isArray(voice.avoidedPhrases)
    ? (voice.avoidedPhrases as string[]).join("\n")
    : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Brand voice"
        description={
          <>
            <Link href="/admin/ai-writer" className="text-accent-text hover:underline">
              ← AI Writer
            </Link>
            <span className="mt-2 block">
              Structured Smartlance writing profile. Must be approved before it overrides defaults.
              Choose exemplars deliberately — do not blindly learn from every Insight.
            </span>
          </>
        }
      />

      <AIWriterSubnav current="/admin/ai-writer/brand-voice" />

      <AdminPanel>
        <form action={saveBrandVoiceAction} className="space-y-3">
          <label className="block text-sm">
            Personality
            <textarea name="personality" defaultValue={voice.personality || ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm">
            Audience
            <textarea name="audience" defaultValue={voice.audience || ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm">
            Tone
            <textarea name="tone" defaultValue={voice.tone || ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm">
            Sentence style
            <textarea name="sentenceStyle" defaultValue={voice.sentenceStyle || ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm">
            Technical depth
            <textarea name="technicalDepth" defaultValue={voice.technicalDepth || ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm">
            CTA style
            <textarea name="ctaStyle" defaultValue={voice.ctaStyle || ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm">
            Formatting preferences
            <textarea name="formattingPrefs" defaultValue={voice.formattingPrefs || ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm">
            Phrases to avoid (one per line)
            <textarea name="avoidedPhrases" defaultValue={avoided} rows={8} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="approved" defaultChecked={voice.approved} />
            Approved for use in generation
          </label>
          <Button type="submit">Save brand voice</Button>
        </form>
      </AdminPanel>
    </div>
  );
}
