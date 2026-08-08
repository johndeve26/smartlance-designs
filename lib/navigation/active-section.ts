export type NavSection =
  | "services"
  | "solutions"
  | "work"
  | "industries"
  | "resources"
  | "about"
  | null;

const RESOURCE_PREFIXES = [
  "/blog",
  "/guides",
  "/compare",
  "/checklists",
  "/glossary",
  "/templates",
  "/tools",
  "/resources",
];

/** Maps pathname to primary header section for active styling. */
export function activeNavSection(pathname: string): NavSection {
  if (pathname === "/about" || pathname.startsWith("/about/")) return "about";
  if (pathname === "/work" || pathname.startsWith("/work/")) return "work";
  if (
    pathname === "/industries" ||
    pathname.startsWith("/industries/")
  ) {
    return "industries";
  }
  if (
    pathname === "/solutions" ||
    pathname.startsWith("/solutions/")
  ) {
    return "solutions";
  }
  if (
    pathname === "/services" ||
    pathname.startsWith("/services/") ||
    pathname === "/seo" ||
    pathname.startsWith("/seo/") ||
    pathname === "/platforms" ||
    pathname.startsWith("/platforms/")
  ) {
    return "services";
  }
  if (RESOURCE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "resources";
  }
  return null;
}

export function isNavSectionActive(
  section: NavSection,
  pathname: string,
): boolean {
  return activeNavSection(pathname) === section;
}
