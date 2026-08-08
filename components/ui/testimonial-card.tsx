import { Badge } from "@/components/ui/badge";
import type { Testimonial } from "@/types";
import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  testimonial: Testimonial;
  className?: string;
};

export function TestimonialCard({
  testimonial,
  className,
}: TestimonialCardProps) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col border-t border-border pt-5",
        className,
      )}
    >
      <blockquote className="flex-1 text-base leading-relaxed text-foreground">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-5">
        <p className="font-semibold text-foreground">{testimonial.name}</p>
        <p className="mt-0.5 text-sm text-muted">
          {testimonial.company}
          {testimonial.service ? ` · ${testimonial.service}` : ""}
        </p>
        {testimonial.source ? (
          <Badge className="mt-3">{testimonial.source}</Badge>
        ) : null}
      </figcaption>
    </figure>
  );
}
