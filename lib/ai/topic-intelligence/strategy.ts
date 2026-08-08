import { prisma, hasDatabaseUrl } from "@/lib/db";
import { DEFAULT_SOURCE_PACKS } from "@/lib/ai/topic-intelligence/default-packs";

/** Idempotent seed of default Source Packs. */
export async function ensureDefaultSourcePacks(actorId?: string) {
  if (!hasDatabaseUrl()) return { created: 0 };
  let created = 0;
  for (const pack of DEFAULT_SOURCE_PACKS) {
    const existing = await prisma.topicSourcePack.findUnique({
      where: { slug: pack.slug },
    });
    if (existing) continue;
    await prisma.topicSourcePack.create({
      data: {
        slug: pack.slug,
        name: pack.name,
        description: pack.description,
        enabled: true,
        priority: pack.priority,
        officialDomainsJson: [...pack.officialDomains],
        keywordsJson: [...pack.keywords],
        newsQueriesJson: [...pack.newsQueries],
        rssFeedsJson: [...pack.rssFeeds],
        updatedById: actorId || null,
      },
    });
    created += 1;
  }
  return { created };
}

export async function getOrCreateTopicStrategy() {
  return prisma.topicStrategySettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      defaultMarket: "global_en",
      marketsJson: ["global_en", "us", "uk", "eu", "ca", "au"],
      // Initial defaults only — never overwrite a saved Admin strategy.
      priorityThemesJson: [
        "website-redesign",
        "website-strategy",
        "website-development",
        "seo",
        "local-seo",
        "conversion",
        "website-performance",
        "website-migration",
        "ecommerce",
        "platforms",
      ],
      lowerPriorityThemesJson: [
        "short-term-rentals",
        "airbnb",
        "pricelabs",
      ],
      pausedTopicsJson: [],
    },
    update: {},
  });
}
