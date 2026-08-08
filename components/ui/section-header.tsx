import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  dark?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  dark = false,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2
        className={cn(
          "text-3xl sm:text-4xl lg:text-[2.5rem] leading-[1.15]",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base sm:text-lg leading-relaxed",
            dark ? "text-white/75" : "text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
