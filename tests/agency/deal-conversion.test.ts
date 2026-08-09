import { describe, expect, it } from "vitest";

/** Mirrors inferServiceType in lib/agency/deal-conversion.ts */
function inferServiceType(deal: {
  servicesInterested: string[];
  title: string;
}) {
  const haystack = [deal.title, ...deal.servicesInterested].join(" ").toLowerCase();

  if (/e-?commerce|shopify|store|woocommerce/.test(haystack)) return "ECOMMERCE";
  if (/redesign|refresh|rebuild/.test(haystack)) return "WEBSITE_REDESIGN";
  if (/landing page|campaign page/.test(haystack)) return "LANDING_PAGE";
  if (/\bseo\b|search engine/.test(haystack)) return "SEO";
  if (/brand|logo|identity/.test(haystack)) return "BRANDING";
  if (/maintenance|support|retainer|care plan/.test(haystack)) {
    return "WEBSITE_MAINTENANCE";
  }
  if (/website|web design|web development/.test(haystack)) return "WEBSITE_DESIGN";
  return "OTHER";
}

describe("deal service type inference", () => {
  it("maps ecommerce keywords", () => {
    expect(
      inferServiceType({ title: "Shopify store build", servicesInterested: [] }),
    ).toBe("ECOMMERCE");
  });

  it("maps website redesign", () => {
    expect(
      inferServiceType({ title: "Website redesign", servicesInterested: ["WEBSITE_REDESIGN"] }),
    ).toBe("WEBSITE_REDESIGN");
  });

  it("defaults to OTHER for ambiguous deals", () => {
    expect(
      inferServiceType({ title: "Consulting engagement", servicesInterested: [] }),
    ).toBe("OTHER");
  });
});
