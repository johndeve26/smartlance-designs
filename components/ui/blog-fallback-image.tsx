import { cn } from "@/lib/utils";

type BlogFallbackImageProps = {
  category: string;
  slug?: string;
  className?: string;
  /** Larger typography for article covers */
  size?: "card" | "hero";
  /** Offset variant selection for related-card diversity */
  variantOffset?: number;
};

function variantIndex(category: string, slug?: string, offset = 0) {
  const seed = `${category}:${slug || ""}:${offset}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 5;
}

function shortLabel(category: string) {
  const map: Record<string, string> = {
    "Website Design": "Design",
    "Website Development": "Development",
    SEO: "SEO",
    "Local SEO": "Local SEO",
    Conversion: "Conversion",
    Performance: "Performance",
    "Digital Marketing": "Marketing",
    "Vacation Rentals": "Rentals",
    Hospitality: "Hospitality",
    "E-commerce": "Commerce",
    "Business Growth": "Growth",
  };
  return map[category] || category;
}

export function BlogFallbackImage({
  category,
  slug,
  className,
  size = "card",
  variantOffset = 0,
}: BlogFallbackImageProps) {
  const variant = variantIndex(category, slug, variantOffset);
  const label = shortLabel(category).toUpperCase();
  const isHero = size === "hero";

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden",
        variant === 0 && "bg-[#F3EEE8]",
        variant === 1 && "bg-[#1C1917]",
        variant === 2 && "bg-[#F7F1EC]",
        variant === 3 && "bg-[#EFE8E1]",
        variant === 4 && "bg-[#F5F0EB]",
        className,
      )}
      aria-hidden
    >
      {/* Shared geometry */}
      <div
        className={cn(
          "absolute inset-0 opacity-[0.35]",
          variant === 1 ? "bg-[linear-gradient(135deg,transparent_0%,rgba(244,122,72,0.18)_100%)]" : "bg-[linear-gradient(160deg,rgba(244,122,72,0.08)_0%,transparent_55%)]",
        )}
      />

      {variant === 0 ? (
        <>
          <div className="absolute left-6 top-6 h-10 w-10 rounded-lg border border-[#D9CFC5] bg-white/70" />
          <div className="absolute right-8 top-10 h-24 w-24 rounded-full border border-orange-200/90" />
          <div className="absolute bottom-10 left-10 h-px w-24 bg-accent/50" />
          <div className="absolute bottom-8 right-8 grid grid-cols-3 gap-1.5 opacity-70">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-5 rounded-[2px] border border-[#D4C8BC] bg-white/50"
              />
            ))}
          </div>
        </>
      ) : null}

      {variant === 1 ? (
        <>
          <div className="absolute left-8 top-8 h-8 w-8 rounded-md border border-white/20" />
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full border border-orange-400/30" />
          <div className="absolute bottom-12 left-8 h-1 w-16 bg-accent" />
          <div className="absolute inset-x-8 bottom-8 top-20 border border-white/10" />
        </>
      ) : null}

      {variant === 2 ? (
        <>
          <div className="absolute left-1/2 top-8 h-16 w-[70%] -translate-x-1/2 rounded-t-md border border-[#D9CFC5] bg-white/60" />
          <div className="absolute left-[18%] top-[3.25rem] flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
          </div>
          <div className="absolute bottom-10 right-10 h-14 w-14 rounded-full border-2 border-accent/40" />
          <div className="absolute bottom-14 right-14 h-2 w-2 rounded-full bg-accent" />
        </>
      ) : null}

      {variant === 3 ? (
        <>
          <div className="absolute left-8 top-8 space-y-2">
            <div className="h-2 w-20 rounded-full bg-accent/45" />
            <div className="h-2 w-14 rounded-full bg-[#D4C8BC]" />
            <div className="h-2 w-16 rounded-full bg-[#D4C8BC]" />
          </div>
          <div className="absolute bottom-8 left-8 right-8 flex items-end gap-2">
            <span className="h-10 flex-1 rounded-sm bg-white/70 ring-1 ring-[#D9CFC5]" />
            <span className="h-16 flex-1 rounded-sm bg-accent/25 ring-1 ring-accent/30" />
            <span className="h-12 flex-1 rounded-sm bg-white/70 ring-1 ring-[#D9CFC5]" />
          </div>
        </>
      ) : null}

      {variant === 4 ? (
        <>
          <div className="absolute left-6 top-6 right-6 h-px bg-[#D9CFC5]" />
          <div className="absolute left-6 top-6 bottom-6 w-px bg-[#D9CFC5]" />
          <div className="absolute right-10 top-10 h-20 w-20 rotate-12 border border-accent/35" />
          <div className="absolute bottom-10 left-10 h-8 w-28 rounded-md bg-white/75 ring-1 ring-[#D4C8BC]" />
        </>
      ) : null}

      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between",
          isHero ? "p-6 sm:p-10" : "p-5 sm:p-6",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-md border",
            isHero ? "h-10 w-10" : "h-8 w-8",
            variant === 1
              ? "border-white/20 bg-white/5"
              : "border-[#D9CFC5] bg-white/80",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
        </div>
        <div>
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.16em]",
              isHero ? "text-xs" : "text-[0.6875rem]",
              variant === 1 ? "text-orange-300" : "text-accent-text",
            )}
          >
            Insights
          </p>
          <p
            className={cn(
              "mt-2 font-display font-semibold leading-none tracking-tight",
              isHero
                ? "text-4xl sm:text-5xl lg:text-6xl"
                : "text-2xl sm:text-3xl",
              variant === 1 ? "text-white" : "text-foreground",
            )}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
