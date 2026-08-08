/**
 * Industry sector-specificity helpers — substitution tests + profile cues.
 * Profiles are pattern-derived, not hard-coded to a single CMS slug.
 */

export type IndustrySpecificityProfile = {
  id: string;
  match: RegExp;
  /** Distinct website / digital journey cues for this sector family */
  cues: string[];
  visitor: string;
  decisions: string[];
  trust: string[];
  tasks: string[];
  seoAngle: string;
};

/** Representative sector families — used to derive specific copy, not paste templates wholesale. */
export const INDUSTRY_SPECIFICITY_PROFILES: IndustrySpecificityProfile[] = [
  {
    id: "short-term-rentals",
    match: /short[- ]?term|vacation\s*rental|str\b|airbnb|cabin\s*rental|holiday\s*let/i,
    cues: [
      "property discovery",
      "availability",
      "booking path",
      "direct booking",
      "guest confidence",
      "house rules",
      "location expectations",
      "mobile browsing",
      "photos and amenities",
      "policies",
    ],
    visitor: "guests comparing stays and deciding whether to enquire or book",
    decisions: [
      "whether the property matches dates and group needs",
      "whether the listing feels trustworthy enough to book directly",
    ],
    trust: [
      "clear policies",
      "accurate property information",
      "credible photos and location context",
    ],
    tasks: [
      "scan availability cues",
      "compare amenities",
      "understand booking or enquiry next steps",
    ],
    seoAngle: "property discovery, guest trust, and clearer booking or enquiry paths",
  },
  {
    id: "hospitality",
    match: /hospitality|hotel|resort|lodge|inn\b|b&b|bed\s*and\s*breakfast/i,
    cues: [
      "stay packages",
      "room types",
      "guest journey",
      "booking",
      "amenities",
      "arrival information",
      "reviews and credibility",
    ],
    visitor: "travellers shortlisting where to stay",
    decisions: [
      "whether the stay matches trip intent and budget signals",
      "whether booking or enquiry feels straightforward",
    ],
    trust: ["credible photography", "transparent stay details", "clear contact path"],
    tasks: ["compare room or package options", "check location fit", "start a booking or enquiry"],
    seoAngle: "stay clarity, guest trust, and a practical booking or enquiry journey",
  },
  {
    id: "real-estate",
    match: /real\s*estate|property\s*management|lettings?|realtor|estate\s*agenc/i,
    cues: [
      "listings",
      "property search",
      "viewings",
      "buyer trust",
      "area information",
      "enquiry qualification",
      "portfolio clarity",
    ],
    visitor: "buyers, renters, or owners evaluating property options",
    decisions: [
      "which listings deserve a viewing or call",
      "whether the agency looks credible and local-knowledgeable",
    ],
    trust: ["accurate listing detail", "transparent process", "professional proof"],
    tasks: ["browse or filter properties", "request a viewing", "contact an agent"],
    seoAngle: "listing clarity, viewing requests, and buyer or renter trust",
  },
  {
    id: "professional-services",
    match: /professional\s*services?|consult|law\b|legal|accountan|advisory|agency\b(?!.*travel)/i,
    cues: [
      "expertise",
      "credibility",
      "service clarity",
      "qualifications",
      "consultation path",
      "case proof",
      "decision-maker trust",
    ],
    visitor: "decision-makers evaluating expertise before a consultation",
    decisions: [
      "whether the firm understands their problem",
      "whether it is worth requesting a conversation",
    ],
    trust: ["clear service scope", "credible proof", "plain-language expertise"],
    tasks: ["understand offerings", "assess fit", "request a consultation or proposal"],
    seoAngle: "expertise clarity, credibility, and a practical consultation path",
  },
  {
    id: "ecommerce",
    match: /e-?commerce|online\s*store|retail|shop\b|merchandise/i,
    cues: [
      "catalogue discovery",
      "product detail",
      "checkout friction",
      "shipping expectations",
      "returns",
      "mobile shopping",
      "trust signals",
    ],
    visitor: "shoppers deciding whether to browse, add to basket, or abandon",
    decisions: [
      "whether products and pricing are clear",
      "whether checkout and fulfilment feel trustworthy",
    ],
    trust: ["transparent shipping and returns", "secure checkout cues", "accurate product detail"],
    tasks: ["find products", "compare options", "complete purchase or enquire"],
    seoAngle: "catalogue clarity, checkout confidence, and reduced purchase friction",
  },
  {
    id: "local-business",
    match: /local\s*business|restaurant|cafe|salon|clinic|dentist|plumber|contractor/i,
    cues: [
      "local discovery",
      "hours and location",
      "service area",
      "appointment or reservation",
      "reviews",
      "contact path",
      "mobile directions",
    ],
    visitor: "nearby customers choosing a provider and how to contact them",
    decisions: [
      "whether the business is the right local fit",
      "whether calling, booking, or visiting is easy",
    ],
    trust: ["clear location and hours", "credible reviews or proof", "responsive contact path"],
    tasks: ["confirm services", "find location or hours", "book, call, or enquire"],
    seoAngle: "local discovery, clear contact paths, and trust for nearby customers",
  },
];

export function matchIndustryProfile(
  name: string,
  slug?: string | null,
): IndustrySpecificityProfile | null {
  const hay = `${name} ${slug || ""}`;
  return INDUSTRY_SPECIFICITY_PROFILES.find((p) => p.match.test(hay)) || null;
}

const GENERIC_FILLER_RE =
  /\b(strong online presence|professional website helps attract|stand out in a competitive market|build trust and grow your business|digital landscape|unlock growth|elevate your brand|transform your business|cutting-edge|seamless solution|one-stop solution|game[- ]?changer)\b/i;

const GENERIC_AGENCY_RE =
  /\b(businesses|companies|organisations|organizations|website|digital presence|online presence|attract (more )?customers|grow your business)\b/i;

/** Sector-specific tokens that survive name substitution. */
const SECTOR_HINT_RE =
  /(patient|guest|diner|buyer|listing|booking|menu|clinic|property|tenant|reservation|supply.?chain|compliance|franchise|availability|direct booking|house rules|amenities|viewing|consultation|qualification|checkout|catalogue|catalog|shipping|returns|appointment|service area|decision-maker|credibility|expertise|room type|stay package|enquiry path|mobile browsing)/i;

/** CMS draft placeholders — not real industry copy. */
const INDUSTRY_PLACEHOLDER_RE =
  /^draft industry description\.?$/i;

export function isIndustryPlaceholderCopy(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return INDUSTRY_PLACEHOLDER_RE.test(trimmed);
}

/** Whether Industry improve/fill actions should rewrite the description. */
export function needsIndustryDescriptionImprovement(
  text: string,
  industryName: string,
): boolean {
  if (isIndustryPlaceholderCopy(text)) return true;
  const trimmed = text.trim();
  if (trimmed.length < 160) return true;
  return looksLikeGenericIndustryCopy(trimmed, industryName);
}

/**
 * Substitution / generic-copy gate.
 * Do not treat the industry name token alone as evidence of specificity.
 */
export function looksLikeGenericIndustryCopy(
  text: string,
  industryName: string,
): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 60) return false;
  if (GENERIC_FILLER_RE.test(trimmed)) return true;
  if (SECTOR_HINT_RE.test(trimmed)) return false;

  const lower = trimmed.toLowerCase();
  const name = industryName.toLowerCase();
  const withoutName = lower.split(name).join("OTHER_INDUSTRY");

  // Mechanical “Web Design for {Industry}” style is thin, not always generic prose
  if (/^web(site)?\s+(design|development)\s+for\s+/i.test(trimmed) && trimmed.length < 120) {
    return true;
  }

  return GENERIC_AGENCY_RE.test(withoutName) && !SECTOR_HINT_RE.test(withoutName);
}

/**
 * Stronger substitution check: after swapping the industry name for a distant sector,
 * does the paragraph still read as equally valid?
 */
export function failsIndustrySubstitutionTest(
  text: string,
  industryName: string,
  substituteName = "Professional Services",
): boolean {
  if (!looksLikeGenericIndustryCopy(text, industryName)) {
    // Still fail if filler phrases dominate even with some sector words
    const fillerHits = (text.match(GENERIC_FILLER_RE) || []).length;
    if (fillerHits >= 2) return true;
    return false;
  }
  const substituted = text.replace(new RegExp(industryName, "gi"), substituteName);
  // If it still looks like generic agency copy after swap, it failed
  return looksLikeGenericIndustryCopy(substituted, substituteName) ||
    GENERIC_AGENCY_RE.test(substituted);
}

export function buildSpecificIndustryDescription(input: {
  name: string;
  slug?: string | null;
  verified: boolean;
  publishedWork?: Array<{ name: string; shortDescription?: string | null }>;
}): string {
  const profile = matchIndustryProfile(input.name, input.slug);
  const workNote =
    input.verified && input.publishedWork?.[0]
      ? ` Verified published work such as ${input.publishedWork[0].name} can illustrate delivery context without inventing metrics or claiming every ${input.name.toLowerCase()} business shares the same problem.`
      : " Smartlance supports relevant website Services and Solutions here without inventing project experience.";

  if (!profile) {
    return `${input.name} websites should help the primary visitor understand the offer, judge credibility, and take a clear next step that matches how buyers research providers in this sector. Focus on the decisions and trust factors that are distinct to ${input.name} — not generic “professional website” claims.${workNote}`;
  }

  const decision = profile.decisions[0];
  const trust = profile.trust.slice(0, 2).join(", ");
  const tasks = profile.tasks.slice(0, 2).join(" and ");
  const cueSample = profile.cues.slice(0, 4).join(", ");

  return `${input.name} sites are used by ${profile.visitor}. Visitors typically need to ${tasks}, then decide ${decision}. Trust often depends on ${trust}. Useful pages make ${cueSample} easy to understand on mobile and desktop — not a generic brochure that could describe any industry unchanged.${workNote}`;
}

export function buildIndustrySeo(input: {
  name: string;
  slug?: string | null;
  description?: string | null;
  verified: boolean;
}): { seoTitle: string; seoDescription: string } {
  const profile = matchIndustryProfile(input.name, input.slug);
  const angle = profile?.seoAngle || "clearer websites and practical digital journeys";

  // Natural commercial title — not “Web Design for {Industry}” and not “Expert … Agency”
  const seoTitle = (
    profile
      ? `${input.name} websites — ${angle} | Smartlance`
      : `${input.name} websites | Smartlance Designs`
  )
    .replace(/\b(expert|leading|award-winning)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70);

  const baseDesc =
    input.description?.trim() && !looksLikeGenericIndustryCopy(input.description, input.name)
      ? input.description.trim()
      : `Practical website guidance for ${input.name}: ${angle}.`;

  const seoDescription = baseDesc
    .replace(/\b(expert|leading|award-winning)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 170);

  void input.verified;
  return { seoTitle, seoDescription };
}
