"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function ServiceViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent("service_viewed", { slug });
  }, [slug]);

  return null;
}
