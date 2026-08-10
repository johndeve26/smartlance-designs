import type { CrmSocialPlatform } from "@prisma/client";

const UNSAFE_PROTOCOLS = /^(javascript|data|file|vbscript):/i;

const PLATFORM_HOSTS: Partial<Record<CrmSocialPlatform, RegExp[]>> = {
  LINKEDIN: [/linkedin\.com/i],
  X: [/^(www\.)?(twitter|x)\.com/i],
  FACEBOOK: [/facebook\.com/i],
  INSTAGRAM: [/instagram\.com/i],
  GITHUB: [/github\.com/i],
  YOUTUBE: [/youtube\.com/i, /youtu\.be/i],
  TIKTOK: [/tiktok\.com/i],
};

export function isSafeHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (UNSAFE_PROTOCOLS.test(raw.trim())) return false;
    return true;
  } catch {
    return false;
  }
}

export function validateSocialProfileUrl(
  platform: CrmSocialPlatform,
  raw: string,
): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "URL required." };
  if (!isSafeHttpUrl(trimmed)) return { ok: false, error: "URL must be http(s)." };

  const url = new URL(trimmed);
  if (platform !== "OTHER") {
    const patterns = PLATFORM_HOSTS[platform];
    if (patterns && !patterns.some((p) => p.test(url.hostname))) {
      return { ok: false, error: `URL does not match ${platform} host.` };
    }
  }

  return { ok: true, url: url.toString() };
}

export function parseSocialUsername(platform: CrmSocialPlatform, url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (!parts.length) return null;
    if (platform === "LINKEDIN" && parts[0] === "in" && parts[1]) return parts[1]!;
    if (platform === "GITHUB" && parts[0]) return parts[0]!;
    if (platform === "X" && parts[0]) return parts[0]!.replace(/^@/, "");
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

export const SOCIAL_PLATFORM_LABELS: Record<CrmSocialPlatform, string> = {
  LINKEDIN: "LinkedIn",
  X: "X (Twitter)",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  GITHUB: "GitHub",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  OTHER: "Other",
};

export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_PLATFORM_LABELS) as CrmSocialPlatform[];
