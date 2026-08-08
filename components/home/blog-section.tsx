import Link from "next/link";
import { Container } from "@/components/ui/container";
import { BlogCard } from "@/components/ui/blog-card";
import { Button } from "@/components/ui/button";
import { getLatestPosts } from "@/lib/blog";

export function HomeBlogSection() {
  const posts = getLatestPosts(3);

  return (
    <section className="section-padding bg-surface">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Insights</p>
            <h2 className="heading-section mt-3 font-display font-semibold">
              Practical Insights on Websites, SEO and Growth
            </h2>
            <p className="section-deck mt-4">
              Guides and practical notes on websites, search visibility and
              conversion.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3.5 self-start sm:items-end sm:self-end">
            <Button asChild variant="outline">
              <Link href="/blog">View All Insights</Link>
            </Button>
            <Link href="/resources" className="link-action">
              Explore Resources →
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-3 lg:gap-10">
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
    </section>
  );
}
