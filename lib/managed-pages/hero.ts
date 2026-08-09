export type ManagedPageHeroCopy = {
  eyebrow: string;
  headline: string;
  supporting: string;
};

export function normalizeManagedPageText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveManagedPageHero(
  staticDefaults: ManagedPageHeroCopy,
  page?: {
    heroEyebrow?: string | null;
    heroHeadline?: string | null;
    heroSupporting?: string | null;
  } | null,
): ManagedPageHeroCopy {
  return {
    eyebrow:
      normalizeManagedPageText(page?.heroEyebrow) ?? staticDefaults.eyebrow,
    headline:
      normalizeManagedPageText(page?.heroHeadline) ?? staticDefaults.headline,
    supporting:
      normalizeManagedPageText(page?.heroSupporting) ??
      staticDefaults.supporting,
  };
}

export const MANAGED_PAGE_HERO_DEFAULTS: Record<string, ManagedPageHeroCopy> = {
  about: {
    eyebrow: "About Smartlance",
    headline: "We Build Websites Around What Businesses Actually Need.",
    supporting:
      "Smartlance Designs is a website, SEO and digital-growth agency helping businesses build clearer, faster and more discoverable online experiences — with 5+ years of experience.",
  },
  contact: {
    eyebrow: "Contact",
    headline: "Let's Talk About Your Website",
    supporting:
      "Tell us what you're planning, what isn't working, or what you'd like to improve. We'll use that information to recommend the most useful next step.",
  },
  pricing: {
    eyebrow: "Pricing & project scope",
    headline: "What Will Your Website Project Actually Involve?",
    supporting:
      "Website costs depend on more than page count. We scope projects around the strategy, content, design, development, SEO, integrations and ongoing needs required to make the site work properly.",
  },
};
