import Link from "next/link";

const LINKS = [
  { href: "/admin/ai-writer", label: "Projects" },
  { href: "/admin/ai-writer/discover", label: "Discover" },
  { href: "/admin/ai-writer/evaluations", label: "Evaluations" },
  { href: "/admin/ai-writer/brand-voice", label: "Brand Voice" },
  { href: "/admin/ai-writer/source-policy", label: "Source Policy" },
  { href: "/admin/ai-writer/settings", label: "Settings" },
] as const;

export function AIWriterSubnav({ current }: { current?: string }) {
  return (
    <nav className="flex flex-wrap gap-3 border-b border-neutral-200 pb-2 text-sm">
      {LINKS.map((l) => {
        const active = current
          ? l.href === current || (current !== "/admin/ai-writer" && l.href.startsWith(current))
          : false;
        const isActive =
          current === l.href ||
          (l.href !== "/admin/ai-writer" && current?.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              isActive || active
                ? "font-medium text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
