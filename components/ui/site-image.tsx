import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { isCloudMediaUrl, isLocalProjectScreenshot } from "@/lib/media/urls";

type SiteImageProps = ImageProps & {
  /** UI/product screenshots — no crop, no extra compression, capped upscale. */
  variant?: "default" | "screenshot";
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
  ...props
}: SiteImageProps) {
  const isScreenshot =
    variant === "screenshot" ||
    (typeof props.src === "string" && isLocalProjectScreenshot(props.src));
  const skipOptimize = shouldSkipOptimize(props.src);

  return (
    <Image
      {...props}
      unoptimized={skipOptimize || unoptimized}
      quality={quality ?? (isScreenshot ? 100 : undefined)}
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
};

/** Portfolio / case-study UI capture — clarity over crop. */
export function PortfolioScreenshot({
  frameClassName,
  maxWidthClassName = "max-w-[1280px]",
  className,
  sizes = "(max-width: 1280px) 100vw, 1280px",
  ...props
}: PortfolioScreenshotProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full overflow-hidden bg-surface-muted",
        maxWidthClassName,
        frameClassName,
      )}
    >
      <div className="relative aspect-[16/9] w-full">
        <SiteImage
          {...props}
          variant="screenshot"
          fill
          sizes={sizes}
          className={cn("object-contain object-top", className)}
        />
      </div>
    </div>
  );
}
