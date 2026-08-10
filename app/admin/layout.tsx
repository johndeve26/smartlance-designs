import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { hasDatabaseUrl } from "@/lib/db";
import { countNewEnquiries } from "@/lib/enquiries/service";
import { getAdminNavBadgeCounts } from "@/lib/admin/nav-badges";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Smartlance Admin",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = hasDatabaseUrl() ? await getSessionUser() : null;
  const isDev = process.env.NODE_ENV !== "production";

  const [enquiryCount, navBadges] = await Promise.all([
    user && can(user.role, "view_enquiries")
      ? countNewEnquiries().then((r) => r.total)
      : Promise.resolve(0),
    user ? getAdminNavBadgeCounts().catch(() => ({ enquiries: 0, inbox: 0, support: 0 })) : Promise.resolve({ enquiries: 0, inbox: 0, support: 0 }),
  ]);

  return (
    <AdminShell
      user={user}
      isDev={isDev}
      badgeCounts={{
        enquiries: enquiryCount,
        inbox: navBadges.inbox,
        support: navBadges.support,
      }}
    >
      {children}
    </AdminShell>
  );
}
