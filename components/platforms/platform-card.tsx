import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Platform } from "@/types";
import { cn } from "@/lib/utils";

type PlatformCardProps = {
  platform: Platform;
  className?: string;
  featured?: boolean;
};

export function PlatformCard({
  platform,
  className,
  featured = false,
}: PlatformCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col border border-border bg-surface transition-shadow hover:shadow-md",
        featured
          ? "justify-center rounded-xl p-7 sm:p-8 lg:min-h-[20rem] lg:p-10"
          : "h-full rounded-xl p-6",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 inline-flex items-center justify-center rounded-md bg-accent-soft text-accent-text",
          featured ? "h-12 w-12" : "h-11 w-11",
        )}
      >
        <Icon name={platform.icon} className="h-5 w-5" />
      </div>
      <h2
        className={cn(
          "font-display font-semibold",
          featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
        )}
      >
        <Link href={platform.href} className="hover:text-accent-text">
          {platform.name}
        </Link>
      </h2>
      {featured ? (
        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-accent-text">
          Featured platform
        </p>
      ) : null}
      <p
        className={cn(
          "mt-3 leading-relaxed text-muted",
          featured
            ? "max-w-md text-base sm:text-[1.0625rem]"
            : "flex-1 text-[0.9375rem] sm:text-base",
        )}
      >
        {platform.summary}
      </p>
      <Link
        href={platform.href}
        className="mt-5 inline-flex text-[0.9375rem] font-semibold text-accent-text hover:underline"
      >
        Explore Platform
      </Link>
    </article>
  );
}
