import { getVisibleProjects } from "@/data/portfolio";

const CAPABILITY_MATCHERS: Record<
  string,
  { label: string; href: string; match: (services: string[]) => boolean }
> = {
  websites: {
    label: "Websites",
    href: "/work?capability=websites",
    match: (services) =>
      services.some((service) =>
        /website design|website development|seo/i.test(service),
      ),
  },
  ai: {
    label: "AI",
    href: "/work?capability=ai",
    match: (services) =>
      services.some((service) => /ai integration|^ai$/i.test(service)),
  },
  automation: {
    label: "Automation",
    href: "/work?capability=automation",
    match: (services) =>
      services.some((service) => /automation/i.test(service)),
  },
};

export function getAvailableWorkCapabilities() {
  const projects = getVisibleProjects();
  const available = Object.entries(CAPABILITY_MATCHERS)
    .filter(([, config]) =>
      projects.some((project) => config.match(project.services)),
    )
    .map(([, config]) => ({ label: config.label, href: config.href }));

  return [
    ...available,
    { label: "View All Work", href: "/work" },
  ];
}

export function countWorkCapability(capability: string): number {
  const config = CAPABILITY_MATCHERS[capability.toLowerCase()];
  if (!config) return 0;
  return getVisibleProjects().filter((project) =>
    config.match(project.services),
  ).length;
}

export function getWorkMenuLinks() {
  return getAvailableWorkCapabilities();
}

export { CAPABILITY_MATCHERS };
