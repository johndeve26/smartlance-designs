import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { BlogPostMeta } from "@/types";
import { BlogFallbackImage } from "@/components/ui/blog-fallback-image";
import { cn } from "@/lib/utils";

type BlogCardProps = {
  post: BlogPostMeta;
  className?: string;
  variant?: "default" | "editorial" | "featured" | "lead";
  priority?: boolean;
  fallbackIndex?: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogCard({
  post,
  className,
  variant = "default",
  priority = false,
  fallbackIndex = 0,
}: BlogCardProps) {
  const isLead = variant === "lead";
  const isFeatured = variant === "featured" || isLead;
  const isEditorial = variant === "editorial" || isFeatured;

  return (
    <article
      className={cn(
        "group flex flex-col",
        !isLead && "h-full",
        className,
      )}
    >
      <Link
        href={`/blog/${post.slug}`}
        aria-label={`Read article: ${post.title}`}
        className={cn(
          "relative block overflow-hidden bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          isLead
            ? "aspect-[16/10] sm:aspect-[3/2] lg:aspect-[16/10]"
            : "aspect-[16/10]",
        )}
      >
        {post.heroImage ? (
          <Image
            src={post.heroImage}
            alt={post.heroImageAlt || post.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
            sizes={
              isLead
                ? "(max-width: 1024px) 100vw, 66vw"
                : isFeatured
                  ? "(max-width: 1024px) 100vw, 34vw"
                  : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            }
          />
        ) : (
          <BlogFallbackImage
            category={post.category}
            slug={post.slug}
            variantOffset={fallbackIndex}
          />
        )}
        <span
          className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/[0.04] motion-reduce:transition-none"
          aria-hidden
        />
      </Link>

      <div
        className={cn(
          "flex flex-1 flex-col",
          isLead ? "pt-6 sm:pt-7" : isEditorial ? "pt-5 sm:pt-6" : "pt-5",
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          {post.category}
        </p>
        <h3
          className={cn(
            "mt-2.5 font-display font-semibold leading-snug text-foreground",
            isLead
              ? "text-[1.5rem] sm:text-3xl lg:text-[2rem]"
              : isFeatured
                ? "text-[1.25rem] sm:text-[1.375rem]"
                : isEditorial
                  ? "text-[1.1875rem] sm:text-[1.3125rem]"
                  : "text-xl sm:text-[1.375rem]",
          )}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {post.title}
          </Link>
        </h3>

        {post.description ? (
          <p
            className={cn(
              "mt-3 leading-relaxed text-muted",
              isLead
                ? "line-clamp-3 text-base sm:text-[1.0625rem]"
                : isFeatured
                  ? "line-clamp-2 text-[0.9375rem] sm:text-base"
                  : "line-clamp-3 text-[0.9375rem] sm:text-base",
            )}
          >
            {post.description}
          </p>
        ) : null}

        <div className="mt-3 text-[0.9375rem] text-muted">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          {post.readingTime ? (
            <>
              <span aria-hidden> · </span>
              <span>{post.readingTime}</span>
            </>
          ) : null}
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className={cn(
            "group/link inline-flex items-center gap-1.5 pt-5 text-base font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            !isLead && "mt-auto",
          )}
        >
          Read Article
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-[3px] motion-reduce:transition-none" />
        </Link>
      </div>
    </article>
  );
}
