export type ProspectNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

export const prospectMainNav: ProspectNavItem[] = [
  { href: "/workspace", label: "Home", exact: true },
  { href: "/workspace/reviews", label: "Website Reviews" },
  { href: "/workspace/briefs", label: "Project Briefs" },
  { href: "/workspace/requests", label: "Requests" },
];

export const prospectFooterNav: ProspectNavItem[] = [
  { href: "/workspace/account", label: "Account" },
  { href: "/workspace/logout", label: "Sign out" },
];

export const prospectMobileBottomNav: ProspectNavItem[] = [
  { href: "/workspace", label: "Home", exact: true },
  { href: "/workspace/reviews", label: "Reviews" },
  { href: "/workspace/briefs", label: "Briefs" },
  { href: "/workspace/requests", label: "Requests" },
  { href: "/workspace/more", label: "More" },
];

export const prospectMoreNav: ProspectNavItem[] = [
  { href: "/workspace/account", label: "Account" },
  { href: "/workspace/logout", label: "Sign out" },
];
