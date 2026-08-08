import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  title: string;
  description: string;
  href: string;
  icon: string;
  className?: string;
};

export function ServiceCard({
  title,
  description,
  href,
  icon,
  className,
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      aria-label={`Explore ${title}`}
      className={cn(
        "group flex h-full flex-col border-b border-border bg-surface p-6 transition-colors hover:bg-accent-soft/40 sm:p-7",
        className,
      )}
    >
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-md bg-accent-soft text-accent-text transition-colors group-hover:bg-cta group-hover:text-cta-foreground">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-accent-text">
        {title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted sm:text-base">
        {description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
        Explore {title}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}
