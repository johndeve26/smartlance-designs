import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media/urls";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
  onDark?: boolean;
  priority?: boolean;
};

export function Logo({
  className,
  compact = false,
  onDark = false,
  priority = false,
}: LogoProps) {
  if (compact) {
    return (
      <Link
        href="/"
        className={cn("inline-flex items-center", className)}
        aria-label="Smartlance Designs home"
      >
        <Image
          src={resolveMediaUrl("/images/brand/smartlance-mark.png")}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          priority={priority}
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
        src={resolveMediaUrl(
          onDark
            ? "/images/brand/smartlance-logo-dark.png"
            : "/images/brand/smartlance-logo.png",
        )}
        alt="Smartlance Designs"
        width={180}
        height={39}
        className="h-9 w-auto object-contain bg-transparent sm:h-10 lg:h-[2.625rem]"
        priority={priority}
        unoptimized
      />
    </Link>
  );
}
