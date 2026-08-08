"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function PortfolioViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent("case_study_viewed", { slug });
    trackEvent("portfolio_viewed", { slug });
  }, [slug]);

  return null;
}
