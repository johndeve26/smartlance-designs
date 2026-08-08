"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function SolutionViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent("solution_viewed", { slug });
  }, [slug]);

  return null;
}
