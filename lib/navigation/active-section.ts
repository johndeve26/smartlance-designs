export type NavSection =
  | "services"
  | "ai-automation"
  | "solutions"
  | "work"
  | "resources"
  | "company"
  | null;

const AI_AUTOMATION_PREFIX = "/ai-automation";

const RESOURCE_PREFIXES = [
  "/blog",
  "/guides",
  "/compare",
  "/checklists",
  "/glossary",
  "/templates",
  "/tools",
  "/resources",
  "/free-tools",
  "/free-website-review",
  "/website-brief",
  "/project-planner",
];

const COMPANY_PREFIXES = ["/about", "/how-we-work", "/contact", "/pricing"];

/** Maps pathname to primary header section for active styling. */
export function activeNavSection(pathname: string): NavSection {
  if (COMPANY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "company";
  }
  if (pathname === AI_AUTOMATION_PREFIX || pathname.startsWith(`${AI_AUTOMATION_PREFIX}/`)) {
    return "ai-automation";
  }
  if (pathname === "/work" || pathname.startsWith("/work/")) return "work";
  if (pathname === "/solutions" || pathname.startsWith("/solutions/")) {
    return "solutions";
  }
  if (
    pathname === "/services" ||
    pathname.startsWith("/services/") ||
    pathname === "/seo" ||
    pathname.startsWith("/seo/") ||
    pathname === "/platforms" ||
    pathname.startsWith("/platforms/") ||
    pathname === "/industries" ||
    pathname.startsWith("/industries/")
  ) {
    return "services";
  }
  if (RESOURCE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "resources";
  }
  return null;
}

export function isNavSectionActive(
  section: NavSection | string,
  pathname: string,
): boolean {
  return activeNavSection(pathname) === section;
}
