import { imageSize } from "image-size";

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export function getMaxUploadBytes(maxMb?: number) {
  const mb =
    maxMb != null && Number.isFinite(maxMb)
      ? maxMb
      : Number(process.env.MEDIA_MAX_UPLOAD_MB || "8");
  return Math.max(1, Math.min(mb, 25)) * 1024 * 1024;
}

function sniffMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  /**
   * AVIF only. The generic HEIF brand "mif1" is deliberately excluded: it is
   * not AVIF, and image-size's HEIF parser has an unfixed infinite-loop
   * advisory (GHSA-5p2g-fcmc-qvqq) that a crafted upload could otherwise reach.
   */
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const majorBrand = buffer.toString("ascii", 8, 12);
    if (majorBrand === "avif" || majorBrand === "avis") {
      return "image/avif";
    }
  }
  return null;
}

export type ValidatedUpload = {
  extension: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  byteSize: number;
  safeFilename: string;
};

export function validateImageUpload(input: {
  buffer: Buffer;
  originalFilename: string;
  reportedMime?: string | null;
  maxBytes?: number;
}): ValidatedUpload {
  const max = input.maxBytes ?? getMaxUploadBytes();
  if (input.buffer.byteLength <= 0) {
    throw new Error("Empty file.");
  }
  if (input.buffer.byteLength > max) {
    throw new Error(
      `File exceeds the ${Math.round(max / (1024 * 1024))} MB upload limit.`,
    );
  }

  const rawExt = (input.originalFilename.split(".").pop() || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!ALLOWED_EXTENSIONS.has(rawExt)) {
    throw new Error(
      `Unsupported file type .${rawExt || "?"}. Allowed: JPEG, PNG, WebP, AVIF, GIF.`,
    );
  }
  if (rawExt === "svg") {
    throw new Error("SVG uploads are not allowed.");
  }

  const sniffed = sniffMime(input.buffer);
  if (!sniffed || !ALLOWED_IMAGE_MIME.has(sniffed)) {
    throw new Error("File contents are not a supported image format.");
  }

  const expected = EXT_TO_MIME[rawExt];
  if (expected && expected !== sniffed) {
    throw new Error("File extension does not match file contents.");
  }

  if (
    input.reportedMime &&
    input.reportedMime !== "application/octet-stream" &&
    !ALLOWED_IMAGE_MIME.has(input.reportedMime)
  ) {
    throw new Error("Reported MIME type is not allowed.");
  }

  let width: number | null = null;
  let height: number | null = null;
  try {
    const dims = imageSize(input.buffer);
    width = dims.width ?? null;
    height = dims.height ?? null;
  } catch {
    // dimensions optional for exotic formats
  }

  const base = input.originalFilename
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120);

  return {
    extension: rawExt === "jpeg" ? "jpg" : rawExt,
    mimeType: sniffed,
    width,
    height,
    byteSize: input.buffer.byteLength,
    safeFilename: base || `upload.${rawExt}`,
  };
}

export function buildStorageKey(filename: string, extension: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 10);
  const safe = filename
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return `uploads/${stamp}/${rand}-${safe || "image"}.${extension}`;
}
