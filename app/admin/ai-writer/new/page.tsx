import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { createAIProjectAction } from "@/lib/admin/ai-writer-actions";
import { getAIProviderStatus } from "@/lib/ai/providers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewAIProjectPage() {
  await requireAdminUser("use_ai_writer");
  const provider = await getAIProviderStatus();
  const insights = await prisma.insight.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    select: { id: true, title: true, slug: true, status: true },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/ai-writer" className="text-sm text-neutral-500">
          ← AI Writer
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New editorial project</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Start with a topic or question — you do not need a primary keyword first.
        </p>
      </div>

      {!provider.configured ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          Provider: Not Configured. You can still create projects and add sources; generation
          requires an API key.
        </div>
      ) : (
        <div className="rounded border bg-white px-4 py-3 text-sm">
          Provider: Configured ({provider.providerId})
        </div>
      )}

      <form action={createAIProjectAction} className="space-y-4 rounded-lg border bg-white p-4">
        <label className="block text-sm">
          Mode
          <select name="mode" className="mt-1 w-full rounded border px-3 py-2" defaultValue="NEW_ARTICLE">
            <option value="NEW_ARTICLE">New article</option>
            <option value="UPDATE_EXISTING">Update existing article</option>
            <option value="BRIEF_ONLY">Content brief only</option>
            <option value="OUTLINE_ONLY">Outline only</option>
            <option value="IMPROVE_DRAFT">Improve existing draft</option>
          </select>
        </label>
        <label className="block text-sm">
          Working title
          <input name="title" className="mt-1 w-full rounded border px-3 py-2" placeholder="Optional — can be refined later" />
        </label>
        <label className="block text-sm">
          Topic / question *
          <textarea
            name="workingTopic"
            required
            rows={3}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="What makes a website redesign successful?"
          />
        </label>
        <label className="block text-sm">
          Primary query (optional)
          <input name="primaryQuery" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Secondary queries (one per line)
          <textarea name="secondaryQueries" rows={3} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Audience
          <input name="targetAudience" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Business objective
          <select name="businessGoal" className="mt-1 w-full rounded border px-3 py-2" defaultValue="Build authority">
            {[
              "Build authority",
              "Educate prospects",
              "Support a Service",
              "Support a Solution",
              "Answer customer questions",
              "Create evergreen reference",
              "Address a search topic",
              "Refresh old content",
            ].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Region (optional)
          <input name="targetRegion" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Linked Insight (for update / improve modes)
          <select name="linkedInsightId" className="mt-1 w-full rounded border px-3 py-2" defaultValue="">
            <option value="">None</option>
            {insights.map((i) => (
              <option key={i.id} value={i.id}>
                [{i.status}] {i.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Notes / angle
          <textarea name="notes" rows={3} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
          Create project
        </button>
      </form>
    </div>
  );
}
