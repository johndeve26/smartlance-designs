import { z } from "zod";

const SAFE_SCHEMES = /^(https?:|mailto:|tel:)/i;

export function isSafePublicUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return false;
    if (trimmed.includes("\\")) return false;
    return true;
  }
  return SAFE_SCHEMES.test(trimmed);
}

export function normalizeInternalPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return null;
  try {
    const u = new URL(trimmed, "https://example.invalid");
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return null;
  }
}

export const socialLinkSchema = z.object({
  platform: z.enum(["instagram", "facebook", "linkedin", "x", "youtube"]),
  url: z.string().url().or(z.literal("")),
  enabled: z.boolean(),
  displayOrder: z.number().int().min(0),
});

export type SocialLinkSetting = z.infer<typeof socialLinkSchema>;
