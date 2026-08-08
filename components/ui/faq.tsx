"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import type { FaqItem } from "@/types";

type FAQProps = {
  items: FaqItem[];
  className?: string;
};

export function FAQ({ items, className }: FAQProps) {
  return (
    <div
      className={cn(
        "divide-y divide-border rounded-xl border border-border bg-surface",
        className,
      )}
    >
      {items.map((item) => (
        <FAQItem key={item.question} item={item} />
      ))}
    </div>
  );
}

function FAQItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className={cn(open && "bg-surface-muted/30")}>
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex w-full items-start justify-between gap-4 px-5 py-5 text-left text-[1.0625rem] font-semibold leading-snug text-foreground transition-colors sm:px-7 sm:py-6 sm:text-lg",
            "hover:bg-surface-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
            open && "bg-transparent",
          )}
        >
          <span className="pt-0.5">{item.question}</span>
          <ChevronDown
            className={cn(
              "mt-1 h-5 w-5 shrink-0 text-muted transition-transform motion-reduce:transition-none",
              open && "rotate-180 text-accent-text",
            )}
            aria-hidden
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="px-5 pb-6 text-base leading-[1.7] text-muted sm:px-7 sm:pb-7 sm:text-[1.0625rem]"
      >
        {item.answer}
      </div>
    </div>
  );
}
