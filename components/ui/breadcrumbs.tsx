import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
  /** Use on dark/image heroes */
  tone?: "default" | "light";
};

export function Breadcrumbs({
  items,
  className,
  tone = "default",
}: BreadcrumbsProps) {
  const light = tone === "light";

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6", className)}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-sm",
          light ? "text-white/70" : "text-muted",
        )}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5",
                    light ? "text-white/45" : "text-subtle",
                  )}
                  aria-hidden
                />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(light ? "hover:text-white" : "hover:text-accent-text")}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    isLast &&
                      (light
                        ? "font-medium text-white"
                        : "font-medium text-foreground"),
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
