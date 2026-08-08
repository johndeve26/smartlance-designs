import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BlogFallbackImage } from "@/components/ui/blog-fallback-image";
import type { BlogPostMeta } from "@/types";

type ArticleHeroProps = {
  post: BlogPostMeta;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleHero({ post }: ArticleHeroProps) {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="pt-8 pb-9 sm:pb-11">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <div className="mt-7">
          <Link
            href={`/blog?category=${encodeURIComponent(post.category)}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text hover:underline"
          >
            {post.category}
          </Link>

          <h1 className="mt-3.5 max-w-[36rem] font-display text-[clamp(2.375rem,4.5vw,4.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground sm:max-w-[42rem] lg:max-w-[46rem]">
            {post.title}
          </h1>

          {post.description ? (
            <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted sm:text-lg sm:leading-[1.65]">
              {post.description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="font-medium text-foreground">
              {post.author || "Smartlance Designs"}
            </span>
            <span aria-hidden className="text-subtle">
              ·
            </span>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            {post.updatedAt ? (
              <>
                <span aria-hidden className="text-subtle">
                  ·
                </span>
                <span>Updated {formatDate(post.updatedAt)}</span>
              </>
            ) : null}
            {post.readingTime ? (
              <>
                <span aria-hidden className="text-subtle">
                  ·
                </span>
                <span>{post.readingTime}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="relative mt-9 aspect-[16/10] max-w-5xl overflow-hidden rounded-2xl bg-surface-muted sm:mt-10 sm:aspect-[16/9]">
          {post.heroImage ? (
            <Image
              src={post.heroImage}
              alt={post.heroImageAlt || post.title}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 1100px"
            />
          ) : (
            <BlogFallbackImage
              category={post.category}
              slug={post.slug}
              size="hero"
            />
          )}
        </div>
      </Container>
    </header>
  );
}
