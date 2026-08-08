import Link from "next/link";
import { BlogCard } from "@/components/ui/blog-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { BlogPostMeta } from "@/types";

export function ArticleRelated({ posts }: { posts: BlogPostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <Section tone="muted" className="!py-14 sm:!py-16 lg:!py-[4.5rem]">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Keep reading</p>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              Related Insights
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden text-base font-semibold text-accent-text hover:underline sm:inline"
          >
            View all articles →
          </Link>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <BlogCard
              key={post.slug}
              post={post}
              variant="editorial"
              fallbackIndex={index}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function ArticleNav({
  previous,
  next,
}: {
  previous?: BlogPostMeta | null;
  next?: BlogPostMeta | null;
}) {
  if (!previous && !next) return null;

  return (
    <Section className="!py-10 sm:!py-12">
      <Container>
        <div className="grid gap-8 border-y border-border py-8 sm:grid-cols-2 sm:gap-10 sm:py-10">
          {previous ? (
            <Link
              href={`/blog/${previous.slug}`}
              className="group block hover:text-accent-text"
            >
              <span className="block text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                ← Previous article
              </span>
              <span className="mt-2.5 block font-display text-xl font-semibold leading-snug sm:text-[1.375rem]">
                {previous.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="group block sm:text-right hover:text-accent-text"
            >
              <span className="block text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-subtle">
                Next article →
              </span>
              <span className="mt-2.5 block font-display text-xl font-semibold leading-snug sm:text-[1.375rem]">
                {next.title}
              </span>
            </Link>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
