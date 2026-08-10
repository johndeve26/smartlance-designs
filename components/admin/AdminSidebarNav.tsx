import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Handshake,
  Headphones,
  History,
  Home,
  Image,
  Inbox,
  LayoutDashboard,
  Library,
  Link2,
  Mail,
  Menu,
  Newspaper,
  Quote,
  Radar,
  Receipt,
  RefreshCw,
  Server,
  Settings,
  Sparkles,
  Users,
  Boxes,
  Lightbulb,
  Layers,
  Search,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { AdminNavGroupDef } from "@/lib/admin/navigation";
import {
  activeAdminNavItemId,
  isAdminNavItemActive,
} from "@/lib/admin/navigation-active";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const adminNavIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  homepage: Home,
  services: Layers,
  solutions: Lightbulb,
  platforms: Boxes,
  industries: Building2,
  work: FolderKanban,
  testimonials: Quote,
  insights: Newspaper,
  resources: Library,
  "ai-writer": Sparkles,
  "topic-intelligence": Radar,
  "content-audit": ClipboardCheck,
  media: Image,
  navigation: Menu,
  seo: Search,
  "link-health": Link2,
  redirects: ArrowRightLeft,
  enquiries: Inbox,
  audience: UserPlus,
  crm: Users,
  "crm-inbox": Mail,
  "crm-contacts": Users,
  "crm-companies": Building2,
  "crm-leads": UserPlus,
  "crm-deals": Handshake,
  "agency-projects": FolderKanban,
  "agency-onboarding": ClipboardCheck,
  "agency-change-requests": RefreshCw,
  "agency-proposals": FileText,
  "agency-contracts": FileText,
  "agency-billing": Receipt,
  "agency-retainers": Wallet,
  "agency-websites": Globe,
  "agency-support": Headphones,
  users: Users,
  "audit-log": History,
  email: Mail,
  settings: Settings,
  system: Server,
};

type AdminSidebarNavProps = {
  groups: AdminNavGroupDef[];
  pathname: string;
  collapsed?: boolean;
  newEnquiryCount?: number;
  onNavigate?: () => void;
};

export function AdminSidebarNav({
  groups,
  pathname,
  collapsed = false,
  newEnquiryCount = 0,
  onNavigate,
}: AdminSidebarNavProps) {
  const activeId = activeAdminNavItemId(pathname);

  return (
    <nav aria-label="Admin" className="space-y-5">
      {groups.map((group) => (
        <div key={group.id}>
          {!collapsed ? (
            <p className="mb-1.5 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/40">
              {group.label}
            </p>
          ) : (
            <div className="mb-2 border-t border-white/10 first:border-0 first:pt-0" />
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = adminNavIcons[item.id] ?? LayoutDashboard;
              const active =
                activeId === item.id || isAdminNavItemActive(pathname, item.id);
              const badge =
                item.badge === "enquiries" && newEnquiryCount > 0
                  ? newEnquiryCount
                  : null;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "admin-nav-link relative flex items-center gap-2.5",
                      collapsed && "justify-center px-2",
                      active && "admin-nav-link-active",
                    )}
                    data-active={active ? "true" : "false"}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    {!collapsed ? (
                      <>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {badge ? (
                          <span className="rounded bg-[#F47A48] px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </>
                    ) : badge ? (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#F47A48]" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function ViewSiteLink({ className }: { className?: string }) {
  const href = siteConfig.url.replace(/\/$/, "") || "/";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900",
        className,
      )}
    >
      View Site
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}
