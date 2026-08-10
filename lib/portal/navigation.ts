export type PortalNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  badgeKey?: "approvals";
};

export type PortalNavGroup = {
  id: string;
  label?: string;
  items: PortalNavItem[];
};

export const portalNavGroups: PortalNavGroup[] = [
  {
    id: "main",
    items: [
      { href: "/portal", label: "Home", exact: true },
      { href: "/portal/projects", label: "Projects" },
      { href: "/portal/approvals", label: "Approvals", badgeKey: "approvals" },
      { href: "/portal/files", label: "Files" },
      { href: "/portal/documents", label: "Documents" },
      { href: "/portal/billing", label: "Billing" },
    ],
  },
  {
    id: "ongoing",
    label: "Ongoing",
    items: [
      { href: "/portal/websites", label: "Websites" },
      { href: "/portal/support", label: "Support" },
    ],
  },
];

export const portalFooterNav: PortalNavItem[] = [
  { href: "/portal/account", label: "Account" },
  { href: "/portal/logout", label: "Sign out" },
];

export const portalMobileBottomNav: PortalNavItem[] = [
  { href: "/portal", label: "Home", exact: true },
  { href: "/portal/projects", label: "Projects" },
  { href: "/portal/files", label: "Files" },
  { href: "/portal/billing", label: "Billing" },
  { href: "/portal/more", label: "More" },
];

export const portalMoreNav: PortalNavItem[] = [
  { href: "/portal/websites", label: "Websites" },
  { href: "/portal/support", label: "Support" },
  { href: "/portal/approvals", label: "Approvals", badgeKey: "approvals" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/account", label: "Account" },
  { href: "/portal/logout", label: "Sign out" },
];

export function filterPortalNav(options?: {
  showWebsites?: boolean;
  showSupport?: boolean;
}) {
  const showWebsites = options?.showWebsites ?? true;
  const showSupport = options?.showSupport ?? true;

  return portalNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === "/portal/websites") return showWebsites;
        if (item.href === "/portal/support") return showSupport;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
