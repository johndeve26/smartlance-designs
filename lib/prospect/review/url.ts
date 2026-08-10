import { assertPublicHttpUrl } from "@/lib/ai/ssrf";

export function normalizeWebsiteUrl(input: string): {
  url: string;
  domain: string;
} {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Website URL is required.");

  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol.replace(/^\/\//, "")}`;
  }

  const parsed = assertPublicHttpUrl(withProtocol);
  const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
  return { url: parsed.toString(), domain };
}

export function isValidWebsiteUrlInput(input: string): boolean {
  try {
    normalizeWebsiteUrl(input);
    return true;
  } catch {
    return false;
  }
}
