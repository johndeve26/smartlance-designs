import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { isCloudMediaUrl, isLocalProjectScreenshot } from "@/lib/media/urls";

type SiteImageProps = Omit<ImageProps, "priority"> & {
  /** UI/product screenshots — no crop, no extra compression, capped upscale. */
  variant?: "default" | "screenshot";
  /**
   * Marks the image as LCP-critical. Maps to `loading="eager"` + `fetchPriority="high"`.
   * Next.js 16 deprecates the Image `priority` prop — use this instead.
   */
  lcp?: boolean;
  /** @deprecated Use `lcp` — kept for call-site compatibility during migration. */
  priority?: boolean;
};

function shouldSkipOptimize(src: ImageProps["src"]) {
  return (
    typeof src === "string" &&
    (isCloudMediaUrl(src) || isLocalProjectScreenshot(src))
  );
}

/** Site media — skip Next optimizer for R2 assets and pre-optimized project WebPs. */
export function SiteImage({
  variant = "default",
  className,
  quality,
  unoptimized,
  lcp = false,
  priority = false,
  loading,
  fetchPriority,
  ...props
}: SiteImageProps) {
  const isLcp = lcp || priority;
  const isScreenshot =
    variant === "screenshot" ||
    (typeof props.src === "string" && isLocalProjectScreenshot(props.src));
  const skipOptimize = shouldSkipOptimize(props.src);

  return (
    <Image
      {...props}
      loading={loading ?? (isLcp ? "eager" : undefined)}
      fetchPriority={fetchPriority ?? (isLcp ? "high" : undefined)}
      unoptimized={skipOptimize || unoptimized}
      quality={quality ?? (isScreenshot || skipOptimize ? 100 : 90)}
      className={cn(
        isScreenshot && "object-contain object-top [image-rendering:-webkit-optimize-contrast]",
        className,
      )}
    />
  );
}

type PortfolioScreenshotProps = Omit<SiteImageProps, "fill" | "variant"> & {
  frameClassName?: string;
  /** Cap display width so 1024px assets are not upscaled on large screens. */
  maxWidthClassName?: string;
  /** Optional smaller source for sub-tablet viewports (paired with `<picture>`). */
  mobileSrc?: string;
};

function projectScreenshotMobileSrc(src: string): string | undefined {
  if (src.includes("/hero.webp")) {
    return src.replace(/\/hero\.webp$/, "/hero-768.webp");
  }
  return undefined;
}

const screenshotImgClass =
  "object-contain object-top [image-rendering:-webkit-optimize-contrast] absolute inset-0 h-full w-full";

/** Portfolio / case-study UI capture — clarity over crop. */
export function PortfolioScreenshot({
  frameClassName,
  maxWidthClassName = "max-w-[1280px]",
  className,
  sizes = "(max-width: 1280px) 100vw, 1280px",
  mobileSrc,
  src,
  alt = "",
  lcp,
  priority,
  loading,
  ...props
}: PortfolioScreenshotProps) {
  const resolvedMobileSrc =
    mobileSrc ??
    (typeof src === "string" ? projectScreenshotMobileSrc(src) : undefined);
  const isLcp = lcp || priority;
  const imgLoading = loading ?? (isLcp ? "eager" : "lazy");
  const imgFetchPriority = isLcp ? "high" : undefined;

  return (
    <div
      className={cn(
        "relative mx-auto w-full overflow-hidden bg-surface-muted",
        maxWidthClassName,
        frameClassName,
      )}
    >
      <div className="relative aspect-[16/9] w-full">
        {resolvedMobileSrc && typeof src === "string" ? (
          <picture className="absolute inset-0 block h-full w-full">
            <source media="(max-width: 768px)" srcSet={resolvedMobileSrc} />
            {/* Native img — Next/Image wraps img in span, which breaks picture selection */}
            <img
              {...props}
              src={src}
              alt={alt}
              sizes={sizes}
              loading={imgLoading}
              fetchPriority={imgFetchPriority}
              decoding="async"
              className={cn(screenshotImgClass, className)}
            />
          </picture>
        ) : (
          <SiteImage
            {...props}
            alt={alt}
            src={src}
            variant="screenshot"
            fill
            sizes={sizes}
            lcp={isLcp}
            loading={loading}
            className={cn("object-contain object-top", className)}
          />
        )}
      </div>
    </div>
  );
}
