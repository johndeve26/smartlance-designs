import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import { ALLOWED_EXTENSIONS } from "@/lib/media/validation";
import { normalizePublicMediaPath } from "@/lib/media/reference";

const STATIC_SCAN_ROOTS = ["public/images", "public/og"] as const;

const DISCOVERABLE_EXTENSIONS = new Set([
  ...ALLOWED_EXTENSIONS,
  "svg",
]);

export type DiscoveredStaticAsset = {
  publicPath: string;
  absolutePath: string;
  extension: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
};

function guessMimeFromExtension(ext: string): string {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function isWithinPublicRoot(absolutePath: string, publicRoot: string): boolean {
  const resolved = path.resolve(absolutePath);
  const root = path.resolve(publicRoot);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

function readDimensions(absolutePath: string, extension: string): {
  width: number | null;
  height: number | null;
} {
  if (extension === "svg") return { width: null, height: null };
  if (!ALLOWED_EXTENSIONS.has(extension === "jpeg" ? "jpg" : extension)) {
    return { width: null, height: null };
  }
  try {
    const buffer = fs.readFileSync(absolutePath);
    const dims = imageSize(buffer);
    return { width: dims.width ?? null, height: dims.height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

/**
 * Discover image files under approved public static roots.
 * Does not mutate files or content.
 */
export function discoverStaticMediaAssets(
  projectRoot = process.cwd(),
): DiscoveredStaticAsset[] {
  const publicRoot = path.join(projectRoot, "public");
  const discovered: DiscoveredStaticAsset[] = [];

  for (const scanRoot of STATIC_SCAN_ROOTS) {
    const absoluteRoot = path.join(projectRoot, scanRoot);
    if (!fs.existsSync(absoluteRoot)) continue;

    const stack: string[] = [absoluteRoot];
    while (stack.length) {
      const current = stack.pop()!;
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const absolutePath = path.join(current, entry.name);
        if (!isWithinPublicRoot(absolutePath, publicRoot)) continue;

        if (entry.isDirectory()) {
          stack.push(absolutePath);
          continue;
        }
        if (!entry.isFile()) continue;

        const extension = (entry.name.split(".").pop() || "").toLowerCase();
        if (!DISCOVERABLE_EXTENSIONS.has(extension)) continue;

        const relativeFromPublic = path
          .relative(publicRoot, absolutePath)
          .split(path.sep)
          .join("/");
        const publicPath = normalizePublicMediaPath(`/${relativeFromPublic}`);
        if (!publicPath) continue;

        const stat = fs.statSync(absolutePath);
        const { width, height } = readDimensions(absolutePath, extension);

        discovered.push({
          publicPath,
          absolutePath,
          extension: extension === "jpeg" ? "jpg" : extension,
          mimeType: guessMimeFromExtension(extension),
          byteSize: stat.size,
          width,
          height,
        });
      }
    }
  }

  discovered.sort((a, b) => a.publicPath.localeCompare(b.publicPath));
  return discovered;
}
