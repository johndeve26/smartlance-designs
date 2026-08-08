import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import {
  ensureDiscoveryDefaultsAction,
  saveSourcePackAction,
  testRssFeedAction,
} from "@/lib/admin/topic-intelligence-actions";
import { ensureDefaultSourcePacks } from "@/lib/ai/topic-intelligence/strategy";

export const dynamic = "force-dynamic";

export default async function SourcePacksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser("manage_ai_settings");
  await ensureDefaultSourcePacks();
  const packs = await prisma.topicSourcePack.findMany({
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });
  const sp = (await searchParams) || {};
  const tested = typeof sp.tested === "string";
  const count = typeof sp.count === "string" ? sp.count : "0";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <header className="space-y-3">
        <nav className="text-sm text-neutral-500">
          <Link href="/admin/ai-writer/discover" className="hover:text-neutral-800">
            Topic Discovery
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-neutral-800">Source Packs</span>
        </nav>
        <h1 className="text-2xl font-semibold">Source Packs</h1>
        <p className="text-sm text-neutral-600">
          Trusted places to watch for a topic or industry. Feeds are validated safely (SSRF-safe).
        </p>
        <AIWriterSubnav current="/admin/ai-writer/discover" />
      </header>

      {tested ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          Feed test returned {count} matching items (headline/summary only).
        </p>
      ) : null}

      <form action={ensureDiscoveryDefaultsAction}>
        <button type="submit" className="admin-btn">
          Ensure default packs
        </button>
      </form>

      <div className="space-y-4">
        {packs.map((pack) => {
          const rss = Array.isArray(pack.rssFeedsJson)
            ? (pack.rssFeedsJson as string[]).join("\n")
            : "";
          const keywords = Array.isArray(pack.keywordsJson)
            ? (pack.keywordsJson as string[]).join("\n")
            : "";
          const domains = Array.isArray(pack.officialDomainsJson)
            ? (pack.officialDomainsJson as string[]).join("\n")
            : "";
          const newsQueries = Array.isArray(pack.newsQueriesJson)
            ? (pack.newsQueriesJson as string[]).join("\n")
            : "";
          return (
            <form
              key={pack.id}
              action={saveSourcePackAction}
              className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <input type="hidden" name="id" value={pack.id} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-neutral-900">{pack.name}</h2>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={pack.enabled} />
                  Enabled
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Name
                  <input name="name" defaultValue={pack.name} className="admin-input mt-1" required />
                </label>
                <label className="block text-sm">
                  Slug
                  <input name="slug" defaultValue={pack.slug} className="admin-input mt-1" required />
                </label>
              </div>
              <label className="block text-sm">
                Description
                <textarea
                  name="description"
                  defaultValue={pack.description || ""}
                  rows={2}
                  className="admin-input mt-1"
                />
              </label>
              <label className="block text-sm">
                Official domains (one per line)
                <textarea name="officialDomains" defaultValue={domains} rows={2} className="admin-input mt-1 font-mono text-xs" />
              </label>
              <label className="block text-sm">
                Keywords
                <textarea name="keywords" defaultValue={keywords} rows={2} className="admin-input mt-1 font-mono text-xs" />
              </label>
              <label className="block text-sm">
                News queries
                <textarea name="newsQueries" defaultValue={newsQueries} rows={2} className="admin-input mt-1 font-mono text-xs" />
              </label>
              <label className="block text-sm">
                RSS feeds (public https only)
                <textarea name="rssFeeds" defaultValue={rss} rows={2} className="admin-input mt-1 font-mono text-xs" />
              </label>
              <label className="block text-sm">
                Priority
                <input
                  type="number"
                  name="priority"
                  defaultValue={pack.priority}
                  className="admin-input mt-1"
                />
              </label>
              <button type="submit" className="admin-btn-primary">
                Save pack
              </button>
            </form>
          );
        })}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold">Create pack</h2>
        <form action={saveSourcePackAction} className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked />
            Enabled
          </label>
          <input name="name" placeholder="Name" className="admin-input" required />
          <input name="slug" placeholder="slug" className="admin-input" required />
          <textarea name="description" placeholder="Description" className="admin-input" rows={2} />
          <textarea name="keywords" placeholder="Keywords (one per line)" className="admin-input font-mono text-xs" rows={2} />
          <textarea name="rssFeeds" placeholder="RSS feeds" className="admin-input font-mono text-xs" rows={2} />
          <button type="submit" className="admin-btn-primary">
            Create
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold">Test RSS feed</h2>
        <form action={testRssFeedAction} className="mt-3 flex flex-wrap gap-2">
          <input
            name="rssUrl"
            placeholder="https://example.com/feed.xml"
            className="admin-input min-w-[16rem] flex-1"
            required
          />
          <button type="submit" className="admin-btn">
            Test feed
          </button>
        </form>
      </section>
    </div>
  );
}
