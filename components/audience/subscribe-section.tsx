import { SubscribeForm } from "@/components/audience/subscribe-form";
import type { SubscriberSourceValue } from "@/lib/audience";
import { cn } from "@/lib/utils";

export type SubscribeSectionProps = {
  source: SubscriberSourceValue;
  sourceUrl?: string;
  variant?: "default" | "footer" | "insight" | "resource";
  enabled?: boolean;
  className?: string;
};

const copy = {
  default: {
    heading: "Stay in the loop",
    body: "Practical website, SEO and conversion insights, delivered occasionally.",
  },
  insight: {
    heading: "Get more useful website insights",
    body: "Occasional practical advice on websites, SEO and conversion.",
  },
  resource: {
    heading: "Useful resources, straight to your inbox",
    body: "Practical website, SEO and conversion insights, delivered occasionally.",
  },
  footer: {
    heading: "Stay in the loop",
    body: "Practical website, SEO and conversion insights, delivered occasionally.",
  },
} as const;

export function SubscribeSection({
  source,
  sourceUrl,
  variant = "default",
  enabled = true,
  className,
}: SubscribeSectionProps) {
  if (!enabled) return null;

  const content = copy[variant === "footer" ? "footer" : variant];
  const formVariant = variant === "footer" ? "footer" : "default";

  if (variant === "footer") {
    return (
      <div className={cn("mt-8 border-t border-white/10 pt-8", className)}>
        <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white/50">
          {content.heading}
        </p>
        <SubscribeForm
          source={source}
          sourceUrl={sourceUrl}
          variant="footer"
          className="mt-4 max-w-xl"
        />
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-surface px-5 py-6 sm:px-6 sm:py-7",
        className,
      )}
    >
      <h2 className="font-display text-xl font-semibold text-foreground sm:text-[1.375rem]">
        {content.heading}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        {content.body}
      </p>
      <SubscribeForm
        source={source}
        sourceUrl={sourceUrl}
        variant={formVariant}
        className="mt-5 max-w-xl"
      />
    </section>
  );
}
