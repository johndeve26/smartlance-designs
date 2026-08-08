import type { BlogCategory } from "@/types";

export type ArticleCtaCopy = {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  sidebarTitle: string;
  sidebarBody: string;
  sidebarPrimaryLabel: string;
  sidebarPrimaryHref: string;
  /** Concise in-article help heading near article end */
  endTitle: string;
};

const DEFAULT_CTA: Omit<ArticleCtaCopy, "sidebarPrimaryHref"> = {
  title: "Want Help Applying This to Your Website?",
  description:
    "If your website needs clearer messaging, stronger SEO or a better path to conversion, we can help you identify what deserves attention first.",
  primaryLabel: "Get a Free Website Review",
  primaryHref: "/free-website-review",
  secondaryLabel: "Tell Us About Your Project",
  secondaryHref: "/contact",
  sidebarTitle: "Need help with your website?",
  sidebarBody:
    "Get a practical review of what to improve first — design, SEO or conversion.",
  sidebarPrimaryLabel: "Explore related services",
  endTitle: "Need help with your website?",
};

const CATEGORY_CTAS: Partial<
  Record<BlogCategory, Partial<Omit<ArticleCtaCopy, "sidebarPrimaryHref">>>
> = {
  "Vacation Rentals": {
    title: "Need a Better Website for Your Rental Business?",
    description:
      "If you want clearer property presentation, stronger booking paths or better search foundations, we can help you decide what to improve first.",
    sidebarTitle: "Need a stronger rental website?",
    sidebarBody:
      "Explore website design and development for hospitality and vacation rental businesses.",
    sidebarPrimaryLabel: "Explore Website Development",
    endTitle: "Need a Better Direct-Booking Website?",
  },
  Hospitality: {
    title: "Need a Better Website for Your Hospitality Brand?",
    description:
      "If guests need a clearer path from interest to enquiry or booking, we can help improve the experience.",
    sidebarTitle: "Need a clearer hospitality website?",
    sidebarBody:
      "Explore website work designed around guest journeys and property presentation.",
    sidebarPrimaryLabel: "Explore Website Development",
    endTitle: "Need a Better Direct-Booking Website?",
  },
  "Website Design": {
    title: "Is Your Website Giving Customers the Right Impression?",
    description:
      "If your site needs clearer messaging, stronger structure or a more professional presentation, we can help you decide what to redesign first.",
    sidebarTitle: "Need a clearer website experience?",
    sidebarBody:
      "Explore website design that makes your offer easier to understand and act on.",
    sidebarPrimaryLabel: "Explore Website Design",
    endTitle: "Is Your Current Website Holding You Back?",
  },
  SEO: {
    title: "Not Sure What's Limiting Your Search Visibility?",
    description:
      "If organic visibility feels stuck, we can help identify technical, on-page or local issues worth fixing first.",
    sidebarTitle: "Need stronger search foundations?",
    sidebarBody:
      "Explore SEO services that connect website structure with practical search improvements.",
    sidebarPrimaryLabel: "Explore SEO Services",
    endTitle: "Need Help Improving Your Search Visibility?",
  },
  "Local SEO": {
    title: "Not Sure What's Limiting Your Search Visibility?",
    description:
      "If nearby customers struggle to find you, we can help improve local relevance and website foundations.",
    sidebarTitle: "Need stronger local visibility?",
    sidebarBody:
      "Explore local SEO that works with your website — not against it.",
    sidebarPrimaryLabel: "Explore Local SEO",
    endTitle: "Need Help Improving Your Search Visibility?",
  },
  Conversion: {
    title: "Getting Traffic but Not Enough Enquiries?",
    description:
      "If visitors arrive but do not convert, we can help clarify offers, CTAs and page structure so the next step is obvious.",
    sidebarTitle: "Need help improving how your website converts?",
    sidebarBody:
      "Explore conversion-focused website improvements that make the next step clearer.",
    sidebarPrimaryLabel: "Explore Conversion Rate Optimization",
    endTitle: "Getting Traffic but Not Enough Enquiries?",
  },
  Performance: {
    title: "Want Help Applying This to Your Website?",
    description:
      "If speed or technical quality is holding your site back, we can help identify the improvements that matter most.",
    sidebarTitle: "Need a faster, cleaner website?",
    sidebarBody:
      "Explore development and performance improvements that support users and search.",
    endTitle: "Need Help Improving Website Performance?",
  },
  "Digital Marketing": {
    title: "Need a Stronger Digital Growth Foundation?",
    description:
      "If your marketing needs a clearer website foundation, we can help align messaging, SEO and conversion paths.",
    sidebarTitle: "Need stronger digital foundations?",
    sidebarBody:
      "Start with a website review, then decide what growth work deserves attention.",
    endTitle: "Need a Stronger Digital Growth Foundation?",
  },
  "Website Development": {
    title: "Want Help Applying This to Your Website?",
    description:
      "If your site needs a more reliable, maintainable build, we can help plan the right development next step.",
    sidebarTitle: "Need dependable website development?",
    sidebarBody:
      "Explore development that supports performance, content management and SEO foundations.",
    endTitle: "Need Dependable Website Development?",
  },
  "E-commerce": {
    title: "Want Help Applying This to Your Website?",
    description:
      "If your store needs clearer product journeys or stronger conversion paths, we can help identify priorities.",
    sidebarTitle: "Need a stronger ecommerce experience?",
    sidebarBody:
      "Explore ecommerce development focused on clarity, performance and conversion.",
    endTitle: "Need a Stronger Ecommerce Experience?",
  },
};

export function getArticleCta(
  category: BlogCategory,
  relatedServiceHref?: string,
): ArticleCtaCopy {
  const mapped = CATEGORY_CTAS[category] || {};
  return {
    ...DEFAULT_CTA,
    ...mapped,
    sidebarPrimaryHref: relatedServiceHref || "/services",
  };
}
