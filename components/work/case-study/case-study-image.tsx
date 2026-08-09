import Image, { type ImageProps } from "next/image";

/** Pre-optimized WebP assets in /public — skip the Next.js optimizer to avoid dev cache glitches. */
export function isLocalProjectScreenshot(src: ImageProps["src"]) {
  return typeof src === "string" && src.startsWith("/images/projects/");
}

export function CaseStudyImage(props: ImageProps) {
  return (
    <Image
      {...props}
      unoptimized={isLocalProjectScreenshot(props.src) || props.unoptimized}
    />
  );
}
