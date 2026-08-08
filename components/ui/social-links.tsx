import Link from "next/link";
import type { SocialLink } from "@/types";
import { cn } from "@/lib/utils";

type SocialLinksProps = {
  links: SocialLink[];
  className?: string;
  onDark?: boolean;
};

export function SocialLinks({ links, className, onDark = false }: SocialLinksProps) {
  return (
    <ul className={cn("flex items-center gap-3", className)}>
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              link.isPlaceholder
                ? `${link.label} (placeholder link)`
                : link.label
            }
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
              onDark
                ? "border-white/15 text-white/80 hover:border-white/40 hover:text-white"
                : "border-border text-muted hover:border-accent hover:text-accent-text",
            )}
          >
            <SocialIcon name={link.icon} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SocialIcon({ name }: { name: SocialLink["icon"] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V23h-4v-6.6c0-1.57-.03-3.59-2.19-3.59-2.19 0-2.53 1.71-2.53 3.48V23h-4V8.5z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm5.25-3.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.6A3 3 0 0 0 .5 7.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-4.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10.6 13.4a5 5 0 0 1 0-7.1l2.1-2.1a5 5 0 0 1 7.1 7.1l-1 1M13.4 10.6a5 5 0 0 1 0 7.1l-2.1 2.1a5 5 0 1 1-7.1-7.1l1-1" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}
