import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { isCloudMediaUrl, isLocalProjectScreenshot } from "@/lib/media/urls";

export { isLocalProjectScreenshot };

export function CaseStudyImage(props: ImageProps) {
  const isScreenshot =
    typeof props.src === "string" &&
    (isLocalProjectScreenshot(props.src) || isCloudMediaUrl(props.src));

  return (
    <Image
      {...props}
      unoptimized={isScreenshot || props.unoptimized}
      quality={props.quality ?? (isScreenshot ? 100 : undefined)}
      className={cn(
        isScreenshot &&
          "object-contain object-top [image-rendering:-webkit-optimize-contrast]",
        props.className,
      )}
    />
  );
}
