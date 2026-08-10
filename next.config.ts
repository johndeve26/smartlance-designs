import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

function mediaRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "*.r2.dev",
    },
  ];

  const base = process.env.MEDIA_PUBLIC_BASE_URL?.trim();
  if (base) {
    try {
      const hostname = new URL(base).hostname;
      if (!patterns.some((pattern) => pattern.hostname === hostname)) {
        patterns.unshift({ protocol: "https", hostname });
      }
    } catch {
      // ignore invalid MEDIA_PUBLIC_BASE_URL
    }
  }

  return patterns;
}

const mediaPublicBaseUrl =
  process.env.NEXT_PUBLIC_MEDIA_PUBLIC_BASE_URL?.trim() ||
  process.env.MEDIA_PUBLIC_BASE_URL?.trim() ||
  "";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    /** Mirror server media CDN base for client bundles (Logo, etc.) — avoids hydration mismatch. */
    NEXT_PUBLIC_MEDIA_PUBLIC_BASE_URL: mediaPublicBaseUrl,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: mediaRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/images/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/images/brand/smartlance-logo-v2.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/brand/smartlance-logo-dark-v2.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/brand/smartlance-mark-v2.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/projects/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/portal/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/workspace/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/api/agency/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/api/prospect/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/api/webhooks/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
