import { describe, expect, it } from "vitest";
import { STARTER_TEMPLATE_SYSTEM_KEYS } from "@/lib/agency/templates";

describe("starter template identity", () => {
  it("defines seven stable system keys", () => {
    expect(STARTER_TEMPLATE_SYSTEM_KEYS).toEqual([
      "website-design",
      "website-redesign",
      "landing-page",
      "ecommerce",
      "seo",
      "branding",
      "website-maintenance",
    ]);
  });
});
