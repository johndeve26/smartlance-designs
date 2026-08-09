import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { resolveMediaUrl } from "@/lib/media/urls";
import type { BlogCategory, BlogPostMeta } from "@/types";

const contentDirectory = path.join(process.cwd(), "content/blog");

export type BlogPost = BlogPostMeta & {
  content: string;
};

export const BLOG_PAGE_SIZE = 12;

export const blogCategories: BlogCategory[] = [
  "Website Design",
  "Website Development",
  "SEO",
  "Conversion",
  "Performance",
  "Digital Marketing",
  "Vacation Rentals",
  "Hospitality",
  "E-commerce",
  "Business Growth",
];

function ensureContentDir() {
  if (!fs.existsSync(contentDirectory)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
  }
}

export function getPostSlugs(): string[] {
  ensureContentDir();
  return fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx?$/, ""));
}

export function getPostBySlug(
  slug: string,
  options?: { includeDraft?: boolean },
): BlogPost | null {
  ensureContentDir();
  const mdPath = path.join(contentDirectory, `${slug}.md`);
  const mdxPath = path.join(contentDirectory, `${slug}.mdx`);
  const fullPath = fs.existsSync(mdPath)
    ? mdPath
    : fs.existsSync(mdxPath)
      ? mdxPath
      : null;

  if (!fullPath) return null;

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const stats = readingTime(content);

  const authorRaw = data.author != null ? String(data.author).trim() : "";

  const post: BlogPost = {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    category: (data.category as BlogCategory) || "Digital Marketing",
    author: authorRaw || undefined,
    publishedAt: String(data.publishedAt ?? new Date().toISOString()),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    readingTime: stats.text,
    heroImage: data.heroImage ? resolveMediaUrl(String(data.heroImage)) : undefined,
    heroImageAlt: data.heroImageAlt ? String(data.heroImageAlt) : undefined,
    relatedServiceHrefs: Array.isArray(data.relatedServiceHrefs)
      ? data.relatedServiceHrefs.map(String)
      : [],
    featured: Boolean(data.featured),
    published: data.published === undefined ? true : Boolean(data.published),
    legacyUrl: data.legacyUrl ? String(data.legacyUrl) : undefined,
    canonicalUrl: data.canonicalUrl ? String(data.canonicalUrl) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
    seoDescription: data.seoDescription
      ? String(data.seoDescription)
      : undefined,
    content,
  };

  if (post.published === false && !options?.includeDraft) {
    return null;
  }

  return post;
}

export function getAllPosts(): BlogPost[] {
  return getPostSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is BlogPost => Boolean(post))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getPostsByCategory(category?: string) {
  const posts = getAllPosts();
  if (!category || category === "All") return posts;
  return posts.filter((post) => post.category === category);
}

export function getPaginatedPosts(input: {
  page?: number;
  category?: string;
  pageSize?: number;
  excludeSlugs?: string[];
}) {
  const pageSize = input.pageSize ?? BLOG_PAGE_SIZE;
  const page = Math.max(1, input.page ?? 1);
  let filtered = getPostsByCategory(input.category);
  if (input.excludeSlugs?.length) {
    const excluded = new Set(input.excludeSlugs);
    filtered = filtered.filter((post) => !excluded.has(post.slug));
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    posts: filtered.slice(start, start + pageSize),
    page: current,
    totalPages,
    total,
    category: input.category || "All",
  };
}

const FEATURED_CATEGORY_PRIORITY = [
  "Conversion",
  "Website Design",
  "SEO",
  "Performance",
  "Website Development",
  "Digital Marketing",
] as const;

/** Curated Insights featured posts for /blog page 1 */
export function getFeaturedInsightsPosts(count = 3): BlogPostMeta[] {
  const all = getAllPosts();
  const featured = all.filter((post) => post.featured);

  const sortEditorial = (posts: BlogPost[]) =>
    [...posts].sort((a, b) => {
      const ai = FEATURED_CATEGORY_PRIORITY.indexOf(
        a.category as (typeof FEATURED_CATEGORY_PRIORITY)[number],
      );
      const bi = FEATURED_CATEGORY_PRIORITY.indexOf(
        b.category as (typeof FEATURED_CATEGORY_PRIORITY)[number],
      );
      const ap = ai === -1 ? 99 : ai;
      const bp = bi === -1 ? 99 : bi;
      if (ap !== bp) return ap - bp;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });

  const chosen = sortEditorial(featured).slice(0, count);
  if (chosen.length >= count) return chosen;

  const preferred = all.filter((post) =>
    FEATURED_CATEGORY_PRIORITY.includes(
      post.category as (typeof FEATURED_CATEGORY_PRIORITY)[number],
    ),
  );
  for (const post of preferred) {
    if (chosen.length >= count) break;
    if (!chosen.some((item) => item.slug === post.slug)) chosen.push(post);
  }
  for (const post of all) {
    if (chosen.length >= count) break;
    if (!chosen.some((item) => item.slug === post.slug)) chosen.push(post);
  }
  return chosen.slice(0, count);
}

/** Homepage: prefer featured posts, then fill with newest non-vacation if needed.
 * STATIC / PRE-IMPORT FALLBACK ONLY — production Homepage uses DB Insights loader. */
export function getLatestPosts(count = 3): BlogPostMeta[] {
  const all = getAllPosts();
  const featured = all.filter((post) => post.featured);
  if (featured.length >= count) return featured.slice(0, count);

  const preferred = all.filter(
    (post) =>
      post.featured ||
      ["Website Design", "Website Development", "SEO", "Conversion", "Performance"].includes(
        post.category,
      ),
  );
  const chosen = [...featured];
  for (const post of preferred) {
    if (chosen.length >= count) break;
    if (!chosen.some((item) => item.slug === post.slug)) chosen.push(post);
  }
  for (const post of all) {
    if (chosen.length >= count) break;
    if (!chosen.some((item) => item.slug === post.slug)) chosen.push(post);
  }
  return chosen.slice(0, count);
}

const RELATED_CATEGORY_GROUPS: BlogCategory[][] = [
  ["Website Design", "Conversion", "Website Development", "E-commerce", "Development"],
  ["SEO", "Local SEO", "Performance"],
  ["Vacation Rentals", "Hospitality"],
  ["Digital Marketing", "Business Growth"],
];

function relatedCategoryScore(
  current: BlogCategory,
  candidate: BlogCategory,
): number {
  if (current === candidate) return 3;
  for (const group of RELATED_CATEGORY_GROUPS) {
    if (group.includes(current) && group.includes(candidate)) return 2;
  }
  return 0;
}

function sharedServiceScore(
  current?: string[],
  candidate?: string[],
): number {
  if (!current?.length || !candidate?.length) return 0;
  return current.filter((href) => candidate.includes(href)).length;
}

function sortRelatedCandidates(a: BlogPostMeta, b: BlogPostMeta) {
  if (Boolean(b.featured) !== Boolean(a.featured)) {
    return Number(b.featured) - Number(a.featured);
  }
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getRelatedPosts(slug: string, count = 3): BlogPostMeta[] {
  const current = getPostBySlug(slug);
  if (!current) return getLatestPosts(count);

  const candidates = getAllPosts().filter((post) => post.slug !== slug);
  const sameCategory: BlogPostMeta[] = [];
  const relatedGroup: BlogPostMeta[] = [];
  const remaining: BlogPostMeta[] = [];

  for (const post of candidates) {
    const categoryScore = relatedCategoryScore(current.category, post.category);
    if (categoryScore >= 3) sameCategory.push(post);
    else if (categoryScore > 0) relatedGroup.push(post);
    else remaining.push(post);
  }

  const featuredRemaining = remaining
    .filter((post) => post.featured)
    .sort(sortRelatedCandidates);
  const nonFeaturedRemaining = remaining.filter((post) => !post.featured);

  const sharedServices = nonFeaturedRemaining
    .filter(
      (post) =>
        sharedServiceScore(
          current.relatedServiceHrefs,
          post.relatedServiceHrefs,
        ) > 0,
    )
    .sort((a, b) => {
      const scoreDiff =
        sharedServiceScore(
          current.relatedServiceHrefs,
          b.relatedServiceHrefs,
        ) -
        sharedServiceScore(
          current.relatedServiceHrefs,
          a.relatedServiceHrefs,
        );
      if (scoreDiff !== 0) return scoreDiff;
      return sortRelatedCandidates(a, b);
    });

  const sharedSlugs = new Set(sharedServices.map((post) => post.slug));
  const rest = nonFeaturedRemaining
    .filter((post) => !sharedSlugs.has(post.slug))
    .sort(sortRelatedCandidates);

  return [
    ...sameCategory.sort(sortRelatedCandidates),
    ...relatedGroup.sort(sortRelatedCandidates),
    ...featuredRemaining,
    ...sharedServices,
    ...rest,
  ].slice(0, count);
}

export function getAdjacentPosts(slug: string) {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index < posts.length - 1 ? posts[index + 1] : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}

export function getUsedBlogCategories(): BlogCategory[] {
  const used = new Set(getAllPosts().map((post) => post.category));
  return blogCategories.filter((category) => used.has(category));
}

const TOC_SKIP =
  /^(need help|get a free|ready to|want help|let'?s |contact us|book a)/i;

export function extractHeadings(markdown: string) {
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: { id: string; text: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[1].trim();
    if (TOC_SKIP.test(text)) continue;
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text });
  }

  return headings;
}
