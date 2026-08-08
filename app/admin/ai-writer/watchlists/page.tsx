import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import {
  saveWatchlistAction,
  scanWatchlistAction,
} from "@/lib/admin/topic-intelligence-actions";
import { ensureDefaultSourcePacks } from "@/lib/ai/topic-intelligence/strategy";

export const dynamic = "force-dynamic";

export default async function WatchlistsPage() {
  await requireAdminUser("manage_ai_settings");
  await ensureDefaultSourcePacks();
  const [watchlists, packs] = await Promise.all([
    prisma.topicWatchlist.findMany({
      include: { sourcePack: true },
      orderBy: { name: "asc" },
    }),
    prisma.topicSourcePack.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <header className="space-y-3">
        <nav className="text-sm text-neutral-500">
          <Link href="/admin/ai-writer/discover" className="hover:text-neutral-800">
            Topic Discovery
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-neutral-800">Watchlists</span>
        </nav>
        <h1 className="text-2xl font-semibold">Watchlists</h1>
        <p className="text-sm text-neutral-600">
          Monitored themes. Use Scan now for manual discovery. Scheduled scans stay disabled until
          durable cron is configured.
        </p>
        <AIWriterSubnav current="/admin/ai-writer/discover" />
      </header>

      <div className="space-y-4">
        {watchlists.map((wl) => {
          const keywords = Array.isArray(wl.keywordsJson)
            ? (wl.keywordsJson as string[]).join("\n")
            : "";
          return (
            <div key={wl.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <form action={saveWatchlistAction} className="space-y-3">
                <input type="hidden" name="id" value={wl.id} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">{wl.name}</h2>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={wl.active} />
                    Active
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    Name
                    <input name="name" defaultValue={wl.name} className="admin-input mt-1" required />
                  </label>
                  <label className="block text-sm">
                    Slug
                    <input name="slug" defaultValue={wl.slug} className="admin-input mt-1" required />
                  </label>
                </div>
                <label className="block text-sm">
                  Description
                  <textarea
                    name="description"
                    defaultValue={wl.description || ""}
                    rows={2}
                    className="admin-input mt-1"
                  />
                </label>
                <label className="block text-sm">
                  Keywords / concepts
                  <textarea
                    name="keywords"
                    defaultValue={keywords}
                    rows={3}
                    className="admin-input mt-1 font-mono text-xs"
                  />
                </label>
                <label className="block text-sm">
                  Source pack
                  <select
                    name="sourcePackId"
                    defaultValue={wl.sourcePackId || ""}
                    className="admin-input mt-1"
                  >
                    <option value="">None</option>
                    {packs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs text-neutral-500">
                  Last scan: {wl.lastScanAt ? wl.lastScanAt.toISOString() : "Never"} · Schedule:
                  manual only
                </p>
                <button type="submit" className="admin-btn-primary">
                  Save watchlist
                </button>
              </form>
              <form action={scanWatchlistAction} className="mt-3">
                <input type="hidden" name="watchlistId" value={wl.id} />
                <button type="submit" className="admin-btn">
                  Scan now
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold">Create watchlist</h2>
        <form action={saveWatchlistAction} className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked />
            Active
          </label>
          <input name="name" placeholder="Name" className="admin-input" required />
          <input name="slug" placeholder="slug" className="admin-input" required />
          <textarea name="keywords" placeholder="Keywords" className="admin-input font-mono text-xs" rows={3} />
          <select name="sourcePackId" className="admin-input">
            <option value="">No source pack</option>
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="admin-btn-primary">
            Create
          </button>
        </form>
      </section>
    </div>
  );
}
