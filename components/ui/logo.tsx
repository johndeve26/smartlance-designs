import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media/urls";
import { cn } from "@/lib/utils";

/** Versioned, right-sized brand assets — safe for long-lived CDN caching. */
const LOGO_ASSETS = {
  light: "/images/brand/smartlance-logo-v2.webp",
  dark: "/images/brand/smartlance-logo-dark-v2.webp",
  mark: "/images/brand/smartlance-mark-v2.webp",
} as const;

type LogoProps = {
  className?: string;
  compact?: boolean;
  onDark?: boolean;
  /** @deprecated Logo is above-fold but secondary to page LCP — do not mark high priority. */
  priority?: boolean;
};

export function Logo({
  className,
  compact = false,
  onDark = false,
}: LogoProps) {
  if (compact) {
    return (
      <Link
        href="/"
        className={cn("inline-flex items-center", className)}
        aria-label="Smartlance Designs home"
      >
        <Image
          src={resolveMediaUrl(LOGO_ASSETS.mark)}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          unoptimized
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
      aria-label="Smartlance Designs home"
    >
      <Image
        src={resolveMediaUrl(onDark ? LOGO_ASSETS.dark : LOGO_ASSETS.light)}
        alt="Smartlance Designs"
        width={180}
        height={39}
        sizes="(max-width: 640px) 166px, (max-width: 1024px) 180px, 210px"
        className="h-9 w-auto object-contain bg-transparent sm:h-10 lg:h-[2.625rem]"
        unoptimized
      />
    </Link>
  );
}
