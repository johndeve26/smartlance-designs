import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { legacyBlogRedirects } from "@/data/legacy-blog-redirects";
import { legacyAiServiceRedirects } from "@/lib/public/ai-automation-routes";

const ADMIN_SESSION_COOKIE = "smartlance_admin_session";

function hashToken(token: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

/**
 * Legacy WordPress → Next.js permanent redirects (308).
 * Old URL → final canonical path (no chains).
 */
const redirects: Record<string, string> = {
  // Generic / alternate
  "/home": "/",
  "/service": "/services",
  "/portfolio": "/work",
  "/case-studies": "/work",
  "/get-a-quote": "/contact",
  "/quote": "/contact",
  "/free-review": "/free-website-review",
  "/website-review": "/free-website-review",

  // Legacy AI service paths → canonical AI & Automation hub
  ...legacyAiServiceRedirects,

  // Main WordPress pages
  "/about-smartlance-design": "/about",
  "/contact-us-2": "/contact",
  "/book-a-free-consultation": "/free-website-review",
  "/projects": "/work",
  "/project": "/work",
  "/insights": "/blog",

  // Projects (preserve SEO)
  "/project/gemini-corporate-relocations": "/work/gemini-corporate-relocations",
  "/project/katerinas-place": "/work/katerinas-place",
  "/project/the-coast": "/work/the-coast",
  "/project/banyan-vacations": "/work/banyan-vacations",
  "/project/overlook-cabin-rentals": "/work/overlook-cabin-rentals",
  "/project/nashville-home-viewer": "/work/nashville-home-viewer",
  "/project/kaerek-homes": "/work/kaerek-homes",
  "/project/zen-stays-rental": "/work/zen-stays-rental",

  // Expertise → closest new services
  "/expertise": "/services",
  "/expertise/expertise-overview": "/services",
  "/expertise/website-development": "/services/website-development",
  "/expertise/experience-design-2": "/services/website-design",
  "/expertise/digital-marketing-services": "/services/digital-marketing",
  "/expertise/strategy-and-insights": "/services",
  "/expertise/client-services": "/services/website-maintenance",

  // Platforms
  "/platform": "/platforms",
  "/platform/platforms-overview": "/platforms",
  "/platform/wordpress": "/platforms/wordpress",
  "/platform/shopify": "/platforms/shopify",
  "/platform/bigcommerce": "/platforms/bigcommerce",
  "/platform/salesforce": "/platforms/salesforce",
  "/platform/clixlo": "/platforms/clixlo",
  "/platform/woocommerce": "/platforms/woocommerce",
  "/platform/webflow": "/platforms/webflow",
  "/platform/wix-studio": "/platforms/wix-studio",
  "/platform/squarespace": "/platforms/squarespace",
  "/platform/framer": "/platforms/framer",
  "/platform/hubspot-cms": "/platforms/hubspot-cms",

  // Industries / solutions
  "/industry/short-term-rental": "/industries",
  "/industry/real-estate": "/industries",
  "/industry/cabin-rental": "/industries",
  "/industry/property-management": "/industries",
  "/industry_solution/airbnb": "/industries",
  "/industry_solution/vrbo": "/industries",
  "/industry_solution/vacation-rental": "/industries",
  "/solution/low-fee-solution-for-short-term-rental": "/industries",

  // Legal aliases
  "/terms": "/legal/terms-and-condition",
  "/privacy": "/legal/privacy-statement",
  "/accessibility": "/legal/accessibility-statement",

  // Category archives
  "/hospitality": "/blog?category=Vacation%20Rentals",
  "/performance": "/blog?category=Performance",
  "/analytics": "/blog?category=Performance",
  "/optimisation": "/blog?category=Performance",

  // Legacy root blog posts
  ...legacyBlogRedirects,
};

async function applyDbSlugRedirect(request: NextRequest, pathname: string) {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (
    !pathname.startsWith("/services/") &&
    !pathname.startsWith("/solutions/") &&
    !pathname.startsWith("/platforms/") &&
    !pathname.startsWith("/work/") &&
    !pathname.startsWith("/blog/") &&
    !pathname.startsWith("/guides/") &&
    !pathname.startsWith("/compare/") &&
    !pathname.startsWith("/checklists/") &&
    !pathname.startsWith("/glossary/") &&
    !pathname.startsWith("/templates/") &&
    !pathname.startsWith("/tools/")
  ) {
    return null;
  }

  try {
    const lookup = new URL("/api/internal/redirect-lookup", request.url);
    lookup.searchParams.set("path", pathname);
    const res = await fetch(lookup, {
      headers: { "x-internal-redirect": "1" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      destination?: string;
      permanent?: boolean;
    };
    if (!data.destination) return null;
    const dest = data.destination.startsWith("http")
      ? data.destination
      : new URL(data.destination, request.url).toString();
    return NextResponse.redirect(dest, data.permanent === false ? 302 : 301);
  } catch {
    return null;
  }
}

/**
 * Next.js 16 Proxy: legacy static redirects, Admin auth gate,
 * and DB-backed slug redirects for migrated content families.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin auth gate
  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const isPreview = pathname.startsWith("/admin/preview");
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const hasCookie = Boolean(token && hashToken(token));
    const hasPreviewToken =
      Boolean(request.nextUrl.searchParams.get("preview")) ||
      Boolean(request.cookies.get("smartlance_admin_preview")?.value);

    if (isPreview && !hasCookie && !hasPreviewToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }

    if (!isLogin && !isPreview && !hasCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }

    if (isLogin && hasCookie) {
      const dash = request.nextUrl.clone();
      dash.pathname = "/admin";
      dash.search = "";
      return NextResponse.redirect(dash);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-smartlance-admin", "1");
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (pathname.startsWith("/portal")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-smartlance-portal", "1");
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (pathname.startsWith("/workspace")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-smartlance-workspace", "1");
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Static legacy redirects (WordPress era)
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = redirects[normalized];
  if (target) {
    const url = request.nextUrl.clone();
    if (target.includes("?")) {
      const [path, query] = target.split("?");
      url.pathname = path;
      url.search = `?${query}`;
    } else {
      url.pathname = target;
      url.search = "";
    }
    return NextResponse.redirect(url, 308);
  }

  // CMS slug-change redirects
  const dbRedirect = await applyDbSlugRedirect(request, pathname);
  if (dbRedirect) return dbRedirect;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/portal",
    "/portal/:path*",
    "/workspace",
    "/workspace/:path*",
    "/services/:path*",
    "/solutions/:path*",
    "/platforms/:path*",
    "/work/:path*",
    "/blog/:path*",
    "/guides/:path*",
    "/compare/:path*",
    "/checklists/:path*",
    "/glossary/:path*",
    "/templates/:path*",
    "/tools/:path*",
    "/home",
    "/service",
    "/portfolio",
    "/case-studies",
    "/get-a-quote",
    "/quote",
    "/free-review",
    "/website-review",
    "/about-smartlance-design",
    "/contact-us-2",
    "/book-a-free-consultation",
    "/projects",
    "/project",
    "/project/:path*",
    "/insights",
    "/expertise",
    "/expertise/:path*",
    "/platform",
    "/platform/:path*",
    "/industry/:path*",
    "/industry_solution/:path*",
    "/solution/:path*",
    "/terms",
    "/privacy",
    "/accessibility",
    "/hospitality",
    "/performance",
    "/analytics",
    "/optimisation",
    "/:slug",
  ],
};
