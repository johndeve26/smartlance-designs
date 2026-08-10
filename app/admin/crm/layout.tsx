import Link from "next/link";
import { adminCrmSecondaryNav } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav
        aria-label="CRM tools"
        className="flex flex-wrap gap-1 border-b border-border pb-3"
      >
        {adminCrmSecondaryNav.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
