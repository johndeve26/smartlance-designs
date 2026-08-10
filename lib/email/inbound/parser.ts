import sanitizeHtml from "sanitize-html";
import { simpleParser, type AddressObject, type ParsedMail } from "mailparser";
import { INBOUND_BODY_MAX_BYTES } from "@/lib/email/inbound/types";
import type { ParsedInboundMessage } from "@/lib/email/inbound/types";
import { normalizeMessageId } from "@/lib/email/inbound/threading";

const AUTOMATED_HEADERS = [
  "auto-submitted",
  "x-autoreply",
  "x-autorespond",
];

function asAddressObject(
  entry: AddressObject | AddressObject[] | undefined,
): AddressObject | undefined {
  if (!entry) return undefined;
  return Array.isArray(entry) ? entry[0] : entry;
}

export function sanitizeInboundHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "b", "i", "em", "strong", "a", "ul", "ol", "li",
      "blockquote", "h1", "h2", "h3", "h4", "span", "div", "pre", "code",
    ],
    allowedAttributes: {
      a: ["href", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}

function detectAutomated(parsed: ParsedMail): boolean {
  const headers = parsed.headers;
  for (const key of AUTOMATED_HEADERS) {
    const val = headers.get(key);
    if (typeof val === "string" && val.toLowerCase() !== "no") return true;
  }
  const precedence = headers.get("precedence");
  if (typeof precedence === "string" && /bulk|junk|list/i.test(precedence)) {
    return true;
  }
  return false;
}

function extractAddress(entry: ParsedMail["from"]): { email: string; name: string | null } {
  const addr = asAddressObject(entry);
  const first = addr?.value?.[0];
  if (!first?.address) return { email: "unknown@invalid.local", name: null };
  return {
    email: first.address.toLowerCase(),
    name: first.name ?? null,
  };
}

function extractAddressList(
  list: ParsedMail["to"] | ParsedMail["cc"],
): string[] {
  const addr = asAddressObject(list);
  if (!addr?.value?.length) return [];
  return addr.value
    .map((v) => v.address?.toLowerCase())
    .filter((a): a is string => Boolean(a));
}

function normalizeReferencesHeader(
  refs: string | string[] | undefined,
): string | null {
  if (!refs) return null;
  if (Array.isArray(refs)) return refs.join(" ");
  return refs;
}

export async function parseInboundRawMessage(
  source: Buffer | string,
): Promise<ParsedInboundMessage> {
  const parsed = await simpleParser(source);
  const from = extractAddress(parsed.from);
  const bodyTextRaw = parsed.text ?? parsed.textAsHtml ?? "";
  let bodyText = bodyTextRaw;
  let bodyTruncated = false;

  const encoder = new TextEncoder();
  if (encoder.encode(bodyText).length > INBOUND_BODY_MAX_BYTES) {
    bodyText = bodyText.slice(0, INBOUND_BODY_MAX_BYTES);
    bodyTruncated = true;
  }

  const htmlRaw = parsed.html ?? parsed.textAsHtml ?? null;
  const bodyHtmlSanitized = htmlRaw ? sanitizeInboundHtml(htmlRaw) : null;

  const attachments =
    parsed.attachments?.map((a) => ({
      filename: a.filename ?? "attachment",
      contentType: a.contentType ?? "application/octet-stream",
      size: a.size ?? 0,
    })) ?? [];

  return {
    fromAddress: from.email,
    fromName: from.name,
    toAddresses: extractAddressList(parsed.to),
    ccAddresses: extractAddressList(parsed.cc),
    subject: parsed.subject?.trim() || "(no subject)",
    bodyText,
    bodyHtmlSanitized,
    internetMessageId: normalizeMessageId(parsed.messageId ?? null),
    inReplyToMessageId: normalizeMessageId(parsed.inReplyTo ?? null),
    referencesHeader: normalizeReferencesHeader(parsed.references),
    receivedAt: parsed.date ?? new Date(),
    isAutomated: detectAutomated(parsed),
    attachmentMeta: attachments,
    bodyTruncated,
  };
}
